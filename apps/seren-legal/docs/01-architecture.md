# 01 — System Architecture

## Guiding Principles

1. **AI-first, not AI-bolted-on.** Every workflow — intake, follow-up, scheduling, qualification — has an AI affordance. The AI orchestrator is a first-class subsystem, not a feature flag.
2. **Multi-tenant from day one.** Every row is tenant-scoped (law firm / office). Isolation is enforced at the DB (RLS) and middleware layers, not just in queries.
3. **CQRS without religion.** Commands and queries are separate handlers via MediatR, but we share the same EF model. We split read models only when a hot path demands it.
4. **Server is the source of truth.** The Next.js app is a thin client over a typed API contract. No business logic in the browser.
5. **Background by default.** Anything that touches AI, Twilio, external calendars, or third-party APIs is a job. The UI never blocks on it.
6. **Legal-grade data handling.** Encryption at rest and in transit, audit logs on every mutation, HIPAA-aware patterns for sensitive client data.

---

## High-Level Diagram

```
                 ┌──────────────────────────────────────────────┐
                 │            Next.js 15 (Vercel)               │
                 │   App Router · Server Actions · RSC          │
                 │   Tailwind · shadcn/ui · Framer Motion       │
                 │                                              │
                 │   Routes:                                    │
                 │   (marketing) landing, pricing, blog         │
                 │   (auth) login, signup                       │
                 │   (app) dashboard, leads, intake, pipeline,  │
                 │         communications, calendar, analytics  │
                 └───────────────┬──────────────────────────────┘
                                 │ HTTPS / JWT
                                 ▼
                 ┌──────────────────────────────────────────────┐
                 │           .NET 9 Web API                     │
                 │  ┌────────────────────────────────────────┐  │
                 │  │  WebApi (Controllers / Minimal API)    │  │
                 │  ├────────────────────────────────────────┤  │
                 │  │  Application (CQRS via MediatR)        │◀─┤── Tenant middleware
                 │  │    Features/                           │  │   Rate limiting
                 │  │      Leads/ Intake/ Pipeline/          │  │   Audit logging
                 │  │      Communications/ Calendar/         │  │   Plan gating
                 │  │      AI/ Analytics/ Billing/           │  │
                 │  ├────────────────────────────────────────┤  │
                 │  │  Domain (Entities, Value Objects,      │  │
                 │  │         Domain Events, Enums)          │  │
                 │  ├────────────────────────────────────────┤  │
                 │  │  Infrastructure                        │  │
                 │  │   · EF Core + PostgreSQL               │  │
                 │  │   · Hangfire (background jobs)         │  │
                 │  │   · AI Orchestrator (OpenAI + Claude)  │  │
                 │  │   · Twilio (SMS, voice, transcription) │  │
                 │  │   · Stripe (billing, subscriptions)    │  │
                 │  │   · Calendar (Google + Outlook)        │  │
                 │  └────────────────────────────────────────┘  │
                 └────┬──────────────┬────────────┬─────────────┘
                      │              │            │
                      ▼              ▼            ▼
              ┌──────────────┐ ┌──────────┐ ┌──────────────┐
              │ PostgreSQL   │ │  Redis   │ │   S3 / R2    │
              │ + RLS        │ │ (cache + │ │  (documents, │
              │              │ │ Hangfire)│ │   voicemail, │
              │              │ │          │ │   exports)   │
              └──────────────┘ └──────────┘ └──────────────┘

     External: OpenAI · Anthropic · Twilio · Stripe · Google Calendar
               Outlook/Graph · Clio · Lawmatics · Zapier
```

---

## Layered Design (Clean Architecture)

```
apps/api/src/
├── SerenLegal.Domain/            ← pure C#, no deps. Entities, ValueObjects, Domain Events
├── SerenLegal.Application/       ← CQRS handlers, validators (FluentValidation), DTOs, ports
├── SerenLegal.Infrastructure/    ← EF Core, Twilio, Stripe, AI clients, calendar, queues
└── SerenLegal.WebApi/            ← controllers, middleware, DI composition, Swagger
```

**Dependency rule:** WebApi → Application → Domain. Infrastructure → Application/Domain. Nothing depends on WebApi.

### Why MediatR

Each feature is a vertical slice: `Features/Leads/Commands/QualifyLead.cs` contains the command, validator, handler, and response in one file. New devs find everything for a feature in one place.

---

## Subsystems

### 1. Tenancy Resolver (Middleware)

Pipeline order:

```
Request
 → Authentication (JWT)
 → TenantResolution (reads tenant_id claim → sets ITenantContext)
 → Authorization (RBAC + plan gate)
 → RateLimiting (per-tenant + per-user buckets)
 → Endpoint
 → AuditLog (writes to audit_events on commands)
```

`ITenantContext` is scoped per-request. EF Core has a global query filter on every multi-tenant entity. PostgreSQL RLS is the belt-and-suspenders second layer.

### 2. AI Orchestrator

Provider-agnostic interface — swap models without rewriting features.

```
IAIOrchestrator
  ├── ChatCompletionAsync(prompt, options)   → cheapest model meeting quality bar
  ├── StreamCompletionAsync(...)             → SSE for long-form generation
  ├── EmbedAsync(text)                       → similarity / dedup / RAG
  └── ClassifyAsync(text, labels)            → structured classification
```

Implemented by `OpenAIAdapter` and `ClaudeAdapter`. The orchestrator routes based on `AIRoutingPolicy`:

- **Lead qualification / urgency detection** → `gpt-4o` with structured outputs (JSON schema)
- **Intake summarization** → `claude-sonnet-4-6` (quality, long context)
- **Follow-up message drafting** → `gpt-4o-mini` (cheap, fast, personalized)
- **Call transcription summary** → `gpt-4o-mini` with safety prefilter
- **Consultation prep notes** → `claude-sonnet-4-6` (quality)
- **Chatbot conversation** → `gpt-4o-mini` with legal-domain system prompt
- **Fallback** → next provider on the routing list

Every AI call flows through:

```
PromptBuilder → SafetyPrefilter → Orchestrator → ResponseValidator → PostProcessor → Persist + Meter Usage
```

See `docs/05-ai-prompt-architecture.md` for full prompt templates.

### 3. Communications Engine (Twilio)

```
ICommunicationsService
  ├── SendSmsAsync(to, body, leadId)
  ├── SendMissedCallTextBackAsync(callSid, leadId)
  ├── InitiateCallAsync(to, callbackUrl)
  ├── GetVoicemailAsync(recordingSid) → audio URL + AI transcript
  └── HandleInboundWebhook(payload) → routes to correct handler
```

Twilio webhooks hit dedicated endpoints:
- `POST /api/webhooks/twilio/sms` → inbound SMS → match to lead → auto-reply or queue for staff
- `POST /api/webhooks/twilio/voice/status` → missed call → trigger text-back workflow
- `POST /api/webhooks/twilio/voice/recording` → voicemail → transcribe → AI summary → notify staff

### 4. Automation Engine

Workflow execution runtime for follow-up sequences:

```
AutomationWorkflow
  ├── WorkflowStep[] (ordered)
  │   ├── SendSms { template, delay }
  │   ├── SendEmail { template, delay }
  │   ├── Wait { duration }
  │   ├── Condition { field, operator, value, trueBranch, falseBranch }
  │   ├── AIGenerate { promptTemplate, outputField }
  │   └── AssignAttorney { rules }
  └── Triggers: LeadCreated, MissedCall, IntakeAbandoned, ConsultationCompleted
```

Workflows are stored as JSON in the DB and executed by Hangfire. Each step is idempotent with a `last_completed_step` cursor.

### 5. Background Workers (Hangfire)

Job types:

- `QualifyLeadJob` — AI scoring + urgency detection on new leads
- `TranscribeCallJob` — Twilio recording → AI transcription → summary
- `ExecuteWorkflowStepJob` — runs next step in an automation workflow
- `MissedCallTextBackJob` — sends SMS within 60s of missed call
- `SyncCalendarJob` — bidirectional sync with Google/Outlook every 5 min
- `GenerateIntakeSummaryJob` — AI summary of completed intake session
- `SendReviewRequestJob` — post-consultation review solicitation
- `DailyAnalyticsRollupJob` — aggregates conversion metrics
- `MonthlyReportJob` — generates branded PDF reports per firm

Jobs are tenant-aware: every job carries `tenantId` + `correlationId`, sets tenant context on execute.

### 6. Billing (Stripe)

- **Subscriptions:** Stripe Checkout → webhook → `subscriptions` table
- **Usage / AI credits:** every AI call increments `usage_events`; nightly rollup to `usage_summary`; hard cap at 100%, soft warning at 80%
- **SMS usage:** Twilio costs passed through with markup, metered via Stripe usage records
- **Multi-office:** parent tenant with child tenants sharing or having independent plans
- **White-label:** agency tier gets custom branding CSS variables + subdomain

### 7. Calendar Integration

```
ICalendarService
  ├── GetAvailabilityAsync(attorneyId, dateRange) → merged free/busy
  ├── BookConsultationAsync(leadId, attorneyId, slot) → creates event + sends confirmations
  ├── SyncEventsAsync(attorneyId) → bidirectional pull/push
  └── CancelAsync(appointmentId) → cancels + triggers rebooking workflow
```

Supports Google Calendar (OAuth2) and Outlook/Graph API. Attorney availability is computed by merging calendar busy times with configured office hours.

---

## Read Paths vs Write Paths

- **Reads** (dashboard, lead lists, pipeline, analytics) → query handlers with Redis cache (30–120s TTL)
- **Writes** (create lead, send SMS, book consultation) → command handlers emitting domain events → domain events trigger jobs (e.g., `LeadCreated` → enqueue `QualifyLeadJob`)
- **Stream reads** (AI generation in progress, chatbot) → SSE from dedicated endpoint, client subscribes by `jobId` or `sessionId`

---

## Frontend Architecture

```
apps/web/src/
├── app/
│   ├── (marketing)/              ← landing, pricing, blog, demo request
│   ├── (auth)/                   ← login, signup, forgot-password
│   ├── (app)/                    ← authenticated shell
│   │   ├── dashboard/            ← KPIs, recent leads, conversion funnel
│   │   ├── leads/                ← lead list, detail, scoring
│   │   ├── intake/               ← form builder, session viewer, chatbot config
│   │   ├── pipeline/             ← Kanban board, stage management
│   │   ├── communications/       ← SMS threads, call logs, email history
│   │   ├── calendar/             ← booking view, attorney availability
│   │   ├── ai-assistant/         ← summaries, prep notes, suggestions
│   │   ├── automations/          ← workflow builder, templates
│   │   ├── analytics/            ← ROI, conversion, source attribution, staff perf
│   │   └── settings/             ← firm profile, team, billing, integrations
│   └── api/                      ← thin BFF for cookies/CSRF
├── components/
│   ├── ui/                       ← shadcn primitives
│   ├── shell/                    ← sidebar, topbar, command palette
│   ├── intake/                   ← chatbot widget, intake forms
│   ├── pipeline/                 ← kanban board, deal cards
│   └── communications/           ← SMS thread view, call player
├── lib/
│   ├── api/                      ← typed client (generated from OpenAPI spec)
│   ├── auth/
│   └── utils/
└── styles/
```

- **Server Components by default**, Client Components only for interactivity
- **TanStack Query** on client for cache + optimistic updates
- **Theming:** CSS variables, dark/light mode, white-label via `--brand-*` overrides

---

## Embeddable Chatbot Widget

A standalone JS bundle (`seren-widget.js`) that law firms embed on their website:

```html
<script src="https://widget.serenlegal.ai/v1/seren-widget.js"
        data-firm-id="abc123"
        data-theme="light"></script>
```

The widget opens an iframe pointing to a Next.js route (`/widget/chat/[firmId]`) that communicates with the API via the same typed client. Conversations create `IntakeSession` records in real-time.

---

## Non-Functional Targets

- API p50 / p95: 80ms / 350ms (excluding AI calls)
- Missed-call text-back: < 60s from call end to SMS delivery
- AI lead qualification: < 10s
- Chatbot response: < 3s
- Uptime: 99.9%
- RPO / RTO: 1h / 4h (daily logical backups + WAL archiving)

---

## What We Are NOT Doing in Phase 1

- Building our own telephony/VoIP system (we use Twilio)
- Real-time video consultations
- Document management / e-signatures (integrate with Clio for this)
- Mobile native app (responsive web only)
- Custom report builder (fixed dashboards first)

These get re-evaluated after first 100 paying law firms.
