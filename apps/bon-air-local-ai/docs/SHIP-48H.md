# Ship in 48 Hours — Bon Air Local AI

## MVP delivered

| Area | Status |
|------|--------|
| Multi-tenant auth (signup, login, JWT + refresh cookies) | ✅ |
| Business locations CRUD | ✅ |
| GEO pages (list, create, edit, publish) | ✅ |
| AI GEO generation (`POST /api/geo-pages/generate`) | ✅ OpenAI or template fallback |
| GBP posts (list, create, AI draft) | ✅ |
| Dashboard stats | ✅ |
| Marketing landing + pricing | ✅ |
| Docker Postgres + Redis (local) | ✅ |
| Production build (`npm run build`) | ✅ |

**Stack:** Next.js 15 App Router · Prisma · PostgreSQL · JWT (no separate .NET API in this MVP slice).

---

## Phase 2 delivered

- Stripe Checkout, portal, usage API + webhook route (configure `STRIPE_*` in env)
- GBP publish stub (`POST /api/gbp/posts/[id]/publish`)
- Marketing landing + pricing + `marketing/campaigns/` (3 ESP-ready emails)
- Social kit under `marketing/social/`

## Phase 3 delivered

See `docs/PHASE-3-ROADMAP.md` — rank tracking, citation health, competitors, CMS push stub, GBP cron.

## Still deferred

- Separate .NET 9 Web API / MediatR CQRS layer
- Hangfire / Redis job queue (Vercel cron stubs in place)
- Live DataForSEO/SerpApi rank pulls
- Google Business Profile OAuth + live publish
- RLS at Postgres level, agency white-label portals
- SSE streaming for long AI jobs

---

## Local run

```bash
docker compose -f infra/docker-compose.yml up -d
cd apps/web
cp ../.env.example .env.local   # or use existing .env.local
npm install
npm run db:push && npm run db:seed
npm run dev
```

| Item | Value |
|------|--------|
| App URL | http://localhost:3001 |
| Postgres | `localhost:5433` — `bonair` / `bonair` / `bonair_local` |
| Redis | `localhost:6380` |
| Demo login | `demo@bonairlocal.ai` / `demo1234` |
| Demo tenant slug | `demo-agency` |

---

## Deploy (Vercel + managed Postgres)

1. **Postgres:** Neon, Supabase, or RDS. Set `DATABASE_URL` in Vercel project env (project root: `apps/web`).

2. **Vercel:** Import repo, set **Root Directory** to `apps/web`, Framework Preset **Next.js**.

3. **Build command:** `npm run build` (runs `postinstall` → `prisma generate`).

4. **Env vars (required):**

   | Variable | Notes |
   |----------|--------|
   | `DATABASE_URL` | Production Postgres connection string |
   | `JWT_SECRET` | 32+ random chars (`openssl rand -base64 32`) |
   | `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` |

5. **Env vars (optional):**

   | Variable | Notes |
   |----------|--------|
   | `OPENAI_API_KEY` | Real AI content; omit for template mode |
   | `STRIPE_*` | Billing not wired in MVP UI |

6. **After first deploy:** run migrations/seed against production DB (one-time):

   ```bash
   DATABASE_URL="..." npm run db:push
   DATABASE_URL="..." npm run db:seed
   ```

   Or use `prisma migrate` once migration files are added.

7. **Redis:** not required for MVP; add Upstash/Redis when background jobs ship.

---

## Production blockers

- **Stripe:** keys present in `.env.example` but checkout/portal not implemented
- **GBP:** no Google OAuth; posts stored in DB only
- **OpenAI:** optional; without key, GEO/GBP drafts use templates
- **Custom domain / SSL:** configure in Vercel
- **Email:** no transactional email for invites/password reset

---

## Smoke-test checklist

- [ ] `GET /` — marketing page
- [ ] `POST /api/auth/login` with demo credentials → cookies set
- [ ] `GET /api/auth/me` with session cookie
- [ ] `GET /api/geo-pages` authenticated
- [ ] Create location → generate GEO page → view in UI
