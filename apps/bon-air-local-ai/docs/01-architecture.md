# 01 — System Architecture

## Guiding principles

1. **AI-first, not AI-bolted-on.** Every workflow has an AI affordance: drafting, summarizing, optimizing, suggesting. The orchestration layer is a first-class subsystem.
2. **Multi-tenant from day one.** Every row is tenant-scoped; isolation is enforced at the DB (RLS) and middleware layers, not just in queries.
3. **CQRS without religion.** Commands and queries are separate handlers via MediatR, but we share the same EF model. We split read models only when a hot path demands it.
4. **Server is the source of truth.** The Next.js app is a thin client over a typed API contract. No business logic in the browser.
5. **Background by default.** Anything that touches AI, external APIs, or scrapes is a job. The UI never blocks on it.

---

## High-level diagram

```
                 ┌─────────────────────────────────────────┐
                 │            Next.js 15 (Vercel)          │
                 │   App Router · Server Actions · RSC     │
                 │   Tailwind · shadcn/ui · Framer Motion  │
                 └───────────────┬─────────────────────────┘
                                 │ HTTPS / JWT
                                 ▼
                 ┌─────────────────────────────────────────┐
                 │           .NET 9 Web API                │
                 │  ┌──────────────────────────────────┐   │
                 │  │  WebApi (Controllers / Minimal)  │   │
                 │  ├──────────────────────────────────┤   │
                 │  │  Application (CQRS via MediatR)  │◀──┼── Tenant middleware
                 │  ├──────────────────────────────────┤   │   Rate limit
                 │  │  Domain (Entities, Value Objs)   │   │   Audit log
                 │  ├──────────────────────────────────┤   │
                 │  │  Infrastructure                  │   │
                 │  │   · EF Core · Hangfire · Stripe  │   │
                 │  │   · AI Orchestrator · GBP client │   │
                 │  └──────────────────────────────────┘   │
                 └────┬───────────────┬────────────┬───────┘
                      │               │            │
                      ▼               ▼            ▼
              ┌──────────────┐ ┌───────────┐ ┌──────────────┐
              │ PostgreSQL   │ │  Redis    │ │   S3 / R2    │
              │ + RLS        │ │ (cache +  │ │  (assets,    │
              │              │ │  Hangfire)│ │   exports)   │
              └──────────────┘ └───────────┘ └──────────────┘

      External: OpenAI · Anthropic · Google Business Profile · Stripe · DataForSEO/SerpApi
```

---

## Layered design (Clean Architecture)

```
apps/api/src/
├── BonAir.Domain/            ← pure C#, no deps. Entities, ValueObjects, Domain Events
├── BonAir.Application/       ← CQRS handlers, validators (FluentValidation), DTOs, ports
├── BonAir.Infrastructure/    ← EF Core, Stripe, AI clients, GBP client, queues, email
└── BonAir.WebApi/            ← controllers, middleware, DI composition, Swagger
```

**Dependency rule:** WebApi → Application → Domain. Infrastructure → Application/Domain. Nothing depends on WebApi.

### Why MediatR

Each feature is a vertical slice: `Features/GeoPages/Commands/GenerateGeoPage.cs` contains the command, validator, handler, and response in one file. New devs find everything for a feature in one place. We avoid bloated service classes.

---

## Subsystems

### 1. Tenancy resolver (middleware)

Order in the pipeline:

```
Request
 → Authentication (JWT)
 → TenantResolution (reads tenant_id claim, sets ITenantContext)
 → Authorization (RBAC + plan gate)
 → RateLimiting (per-tenant + per-user buckets)
 → Endpoint
 → AuditLog (writes to audit_events on commands)
```

`ITenantContext` is scoped per-request. EF Core has a global query filter (`b.HasQueryFilter(x => x.TenantId == _tenant.Id)`) on every multi-tenant entity. Postgres RLS is a belt-and-suspenders second layer.

### 2. AI Orchestrator

A provider-agnostic interface so we can swap models without rewriting features.

```
IAIOrchestrator
  ├── ChatCompletionAsync(prompt, options)  → uses cheapest model that meets quality bar
  ├── StreamCompletionAsync(...)            → SSE to client for long-form
  └── EmbedAsync(text)                      → for similarity / dedup
```

Implemented by `OpenAIAdapter` and `ClaudeAdapter`. The orchestrator picks based on `AIRoutingPolicy`:

- **draft / short content** → `gpt-4o-mini` (cheap, fast)
- **landing-page generation** → `claude-sonnet-4-6` (quality, long context)
- **review responses** → `gpt-4o-mini` with safety prefilter
- **JSON / schema extraction** → `gpt-4o` with structured outputs
- **fallback** → next provider on the routing list

Every AI call goes through:

```
PromptBuilder → SafetyPrefilter → Orchestrator → ResponseValidator → PostProcessor → Persist + meter usage
```

See `docs/05-ai-prompt-architecture.md`.

### 3. Background workers (Hangfire)

Job types:

- `GenerateGeoPageJob` — long-running AI page generation
- `PublishGbpPostJob` — runs at scheduled time, posts via GBP API
- `RefreshRankingsJob` — daily geo-grid ranking refresh (Phase 2)
- `CrawlCitationsJob` — weekly citation health check (Phase 2)
- `MonthlyReportJob` — generates branded PDF reports

Jobs are tenant-aware: every job carries `tenantId` and `correlationId`, sets the tenant context on execute.

### 4. Billing

- **Subscriptions:** Stripe Checkout → webhook → `subscriptions` table.
- **Usage / AI credits:** every AI call increments `usage_events`. A nightly rollup writes to `usage_summary`. Hard cap at 100% of plan, soft warning at 80% via in-app banner.
- **Agency white-label:** sub-accounts under an agency tenant share the agency's plan or have their own.

### 5. CMS bridge

Generated pages can be:

- **Hosted by us** (`/sites/{slug}` rendered by Next.js from API data), or
- **Pushed to client's WordPress** via a companion WP plugin that hits a webhook endpoint with HMAC signing.

---

## Read paths vs write paths

- **Reads** (dashboard, page lists, analytics) go through query handlers that select projections, often cached in Redis for 30–120s.
- **Writes** (generate page, schedule post) go through command handlers that emit domain events. Domain events trigger jobs (e.g., `GeoPageRequested` → enqueue `GenerateGeoPageJob`).
- **Stream reads** (AI generation in progress) use SSE from a dedicated endpoint, with the client subscribing by `jobId`.

---

## Frontend architecture

```
apps/web/src/
├── app/                       ← App Router
│   ├── (marketing)/           ← public landing, pricing, blog
│   ├── (auth)/                ← login, signup
│   ├── (app)/                 ← authenticated shell
│   │   ├── dashboard/
│   │   ├── geo-pages/
│   │   ├── gbp/
│   │   ├── content/
│   │   ├── clients/           ← agency view
│   │   └── settings/
│   └── api/                   ← thin BFF for cookies/CSRF
├── components/
│   ├── ui/                    ← shadcn primitives
│   ├── shell/                 ← sidebar, topbar, command palette
│   └── features/              ← feature-scoped components
├── lib/
│   ├── api/                   ← typed client (generated from OpenAPI)
│   ├── auth/
│   └── utils/
└── styles/
```

- **Server Components by default**, Client Components only where interactivity demands it.
- **Server Actions** for mutations that don't need streaming.
- **TanStack Query** on client for cache + optimistic updates.
- **Theming:** CSS variables, dark/light, agency white-label via `--brand-*` overrides loaded from tenant config.

---

## Non-functional targets

| Concern        | Target |
| -------------- | ------ |
| API p50 / p95  | 80ms / 350ms (excluding AI) |
| AI generation  | < 60s for a city page, streamed |
| Uptime         | 99.9% |
| RPO / RTO      | 1h / 4h (daily logical backups + WAL archiving) |
| Data residency | US-East primary, EU option for agency tier |

---

## What we are deliberately NOT doing in Phase 1

- Building our own ranking-data scraper (we'll rent DataForSEO/SerpApi).
- Building a visual page editor (we render from structured JSON; editing is form-based).
- Real-time collaboration on documents.
- Mobile app.

These get re-evaluated after first 100 paying tenants.
