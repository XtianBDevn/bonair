# Seren Legal

AI-first, multi-tenant legal CRM MVP — leads, pipeline Kanban, intake sessions, communications, and AI qualification. Built as a **Next.js 15 full-stack** app with PostgreSQL (Prisma) and JWT auth.

## Quick start

### 1. Infrastructure

```bash
cd infra
docker compose up -d
```

PostgreSQL runs on **localhost:5434**, Redis on **6381**.

### 2. Environment

```bash
cp .env.example apps/web/.env
# Edit JWT_SECRET (openssl rand -base64 32)
```

### 3. Database & seed

```bash
cd apps/web
npm install
npm run db:push
npm run db:seed
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002).

**Demo login:** `demo@serenlegal.ai` / `demo1234`  
**Demo firm:** Smith & Associates (`smith-associates`)

## Project structure

```
seren-legal/
├── infra/docker-compose.yml    # Postgres 16 + Redis
├── .env.example
├── docs/                       # Architecture & schema specs
└── apps/web/
    ├── prisma/
    │   ├── schema.prisma       # Full domain model
    │   └── seed.ts             # Demo firm + 5 leads
    └── src/
        ├── app/                # Pages + API routes
        ├── components/         # ui, shell, pipeline
        ├── lib/                # db, auth, tenant, ai
        └── middleware.ts       # Protects /dashboard, /leads, …
```

## Features (MVP)

| Area | Routes |
|------|--------|
| Auth | `POST /api/auth/signup`, `login`, `logout`, `GET me` |
| Leads | `GET/POST /api/leads`, `GET/PATCH /api/leads/[id]`, `POST qualify` |
| Pipeline | `GET /api/pipeline`, `POST /api/pipeline/leads/[id]/move` |
| Intake | `GET /api/intake/sessions`, `GET …/[id]` |
| Comms | `GET/POST /api/communications` |
| Dashboard | `GET /api/dashboard/stats` |
| Widget | `/widget/chat/[firmSlug]` public chatbot UI |

## AI qualification

Set `OPENAI_API_KEY` in `apps/web/.env` for GPT-4o-mini structured scoring. Without it, rule-based template fallbacks are used.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port **3002** |
| `npm run db:push` | Sync schema to Postgres |
| `npm run db:seed` | Load demo data |
| `npm run db:studio` | Prisma Studio |

## Roadmap

Phase 1 targets the .NET API + Hangfire workers described in `docs/01-architecture.md`. This MVP consolidates the stack into Next.js for fast iteration while preserving the same domain model and tenant boundaries.
