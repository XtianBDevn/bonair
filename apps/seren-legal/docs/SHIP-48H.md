# Ship in 48 Hours — Seren Legal

## MVP delivered

| Area | Status |
|------|--------|
| Multi-tenant auth (law firm signup/login) | ✅ |
| Leads list + detail + AI qualify endpoint | ✅ |
| Pipeline Kanban (stages, move lead) | ✅ |
| Intake sessions viewer | ✅ |
| Communications log (SMS/email stubs) | ✅ |
| Dashboard KPIs | ✅ |
| Public intake widget (`/widget/chat/[firmSlug]`) | ✅ |
| Marketing landing + pricing | ✅ |
| Docker Postgres + Redis (local) | ✅ |
| Production build (`npm run build`) | ✅ |

**Stack:** Next.js 15 App Router · Prisma · PostgreSQL · JWT.

---

## Phase 2 delivered

- Stripe billing routes + webhook; Twilio SMS stub on `POST /api/communications`
- Widget intake (`POST /api/widget/intake`, `/widget/chat/[firmSlug]`)
- Marketing + `marketing/campaigns/` + social kit

## Phase 3 delivered

See `docs/PHASE-3-ROADMAP.md` — calendar, workflow executor, Clio/Zapier stubs, analytics, review requests.

## Still deferred

- Separate .NET 9 API, MediatR, Hangfire/Redis queue
- Google/Outlook calendar OAuth
- Live Clio/Lawmatics sync
- Embeddable `seren-widget.js` CDN bundle
- HIPAA audit hardening, Postgres RLS
- Real-time SSE, monthly PDF reports

---

## Local run

```bash
docker compose -f infra/docker-compose.yml up -d
cd apps/web
cp ../../.env.example .env.local
npm install
npm run db:push && npm run db:seed
npm run dev
```

| Item | Value |
|------|--------|
| App URL | http://localhost:3002 |
| Postgres | `localhost:5434` — `seren` / `seren_dev` / `seren_legal` |
| Redis | `localhost:6381` |
| Demo login | `demo@serenlegal.ai` / `demo1234` |
| Demo firm slug | `smith-associates` |
| Widget URL | http://localhost:3002/widget/chat/smith-associates |

---

## Deploy (Vercel + managed Postgres)

1. **Postgres:** Neon, Supabase, or RDS → `DATABASE_URL`.

2. **Vercel:** Root Directory = `apps/web`, Framework **Next.js**.

3. **Build:** `npm run build` (includes `prisma generate`).

4. **Env vars (required):**

   | Variable | Notes |
   |----------|--------|
   | `DATABASE_URL` | Production Postgres |
   | `JWT_SECRET` | 32+ random chars |
   | `NEXT_PUBLIC_APP_URL` | Production URL |

5. **Env vars (optional):**

   | Variable | Notes |
   |----------|--------|
   | `OPENAI_API_KEY` | Lead qualification + intake summaries |
   | `REDIS_URL` | Future job queue |
   | `TWILIO_*` | Not wired in MVP |
   | `STRIPE_*` | Not wired in MVP |

6. **Post-deploy:** `db:push` + `db:seed` (or migrations) against production DB once.

---

## Production blockers

- **Twilio:** no live SMS/voice; communications are DB records
- **Stripe:** billing UI stub only
- **Calendar:** no Google/Outlook OAuth
- **OpenAI:** optional; qualify/summarize use heuristics without key
- **Widget:** embed via iframe URL; no standalone JS CDN yet
- **Email:** no invite/reset mailer

---

## Smoke-test checklist

- [ ] `GET /` — marketing
- [ ] Login as `demo@serenlegal.ai`
- [ ] Dashboard shows lead counts
- [ ] Pipeline board loads; move a lead between stages
- [ ] `/widget/chat/smith-associates` — public chat UI
- [ ] `POST /api/leads/[id]/qualify` — AI/heuristic score
