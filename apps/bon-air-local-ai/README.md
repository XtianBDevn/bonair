# Bon Air Local AI

> AI-first Local SEO Operating System — programmatic GEO pages, GBP automation, and multi-tenant workflows in one Next.js platform.

---

## What this is

A multi-tenant SaaS MVP (full-stack Next.js 15, no separate API) with:

- **JWT auth** with refresh tokens and tenant-scoped data
- **AI GEO Page Generator** — OpenAI or built-in templates
- **GBP post drafts** — AI-assisted post creation
- **Business locations** — CRUD per tenant
- **PostgreSQL** via Prisma · **Redis** ready in Docker for future workers

---

## Repo layout

```
bon-air-local-ai/
├── apps/web/              # Next.js 15 App Router (port 3001)
│   ├── prisma/            # schema + seed
│   └── src/
│       ├── app/           # marketing, auth, app routes + API
│       ├── components/
│       └── lib/
├── infra/
│   └── docker-compose.yml # Postgres :5433, Redis :6380
├── docs/                  # architecture & product specs
└── .env.example
```

---

## Quick start

### 1. Environment

```bash
cp .env.example .env
cp .env apps/web/.env.local   # Next.js + Prisma read env here
```

Edit `apps/web/.env.local` — at minimum set `DATABASE_URL` and `JWT_SECRET` (32+ chars recommended).

### 2. Database services

```bash
docker compose -f infra/docker-compose.yml up -d
```

Postgres: `localhost:5433` · Redis: `localhost:6380`

### 3. Install & database

```bash
cd apps/web
npm install
npm run db:push
npm run db:seed
```

**Demo login:** `demo@bonairlocal.ai` / `demo1234`

### 4. Dev server

```bash
npm run dev
```

Open **http://localhost:3001**

| Area        | URL                    |
| ----------- | ---------------------- |
| Marketing   | `/`                    |
| Pricing     | `/pricing`             |
| App         | `/app/dashboard`       |
| API         | `/api/*`               |

---

## Scripts (`apps/web`)

| Script          | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Next.js on port **3001** |
| `npm run build` | Production build         |
| `npm run db:push` | Apply Prisma schema    |
| `npm run db:seed` | Seed demo data         |
| `npm run db:generate` | Regenerate client  |

Optional: set `OPENAI_API_KEY` for live AI generation; without it, templates are used.

---

## Tech stack (MVP)

| Layer     | Technology                          |
| --------- | ----------------------------------- |
| Frontend  | Next.js 15, React 19, Tailwind 4    |
| API       | Next.js Route Handlers              |
| Database  | PostgreSQL 16 (Prisma ORM)          |
| Cache     | Redis 7 (Docker, future jobs)       |
| Auth      | JWT + httpOnly cookies (jose)       |
| AI        | OpenAI (optional) + templates       |

---

## Documentation

See `docs/01-architecture.md` and `docs/11-roadmap-mvp.md` for the full product plan.

---

## Status

**MVP wired end-to-end** in `apps/web`:

- Multi-tenant auth (signup, login, logout, session)
- GEO pages (list, AI generate, edit, publish status)
- Locations CRUD
- GBP posts (list, create, AI draft)
- Dashboard stats
- Marketing landing + pricing

Phase 2: Stripe checkout, GBP OAuth, rank tracking, background workers.
