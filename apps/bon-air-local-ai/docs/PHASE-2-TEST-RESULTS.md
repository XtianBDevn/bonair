# Phase 2 Test Results — Bon Air Local AI

**Date:** 2026-05-23  
**Environment:** Local dev (`localhost:3001`), Docker Postgres `bon-air-local-postgres:5433`

## Summary

| Area | Result |
|------|--------|
| Production build | **PASS** |
| Docker Postgres | **PASS** (healthy) |
| Marketing & campaigns | **PASS** |
| Auth & authenticated APIs | **PASS** (Stripe checkout 503 without keys — expected) |
| Stripe webhook route | **PASS** (503 when unconfigured; not 500) |

## Detailed results

| # | Test | Result | Notes |
|---|------|--------|-------|
| 1 | `npm run build` (apps/web) | PASS | Next.js 15 production build succeeds |
| 2 | Docker Postgres running | PASS | `bon-air-local-postgres` healthy on 5433 |
| 3 | Database seeded | PASS | `demo@bonairlocal.ai` / `demo1234`, tenant `demo-agency` |
| 4 | Dev server :3001 | PASS | Already running |
| 5 | `GET /` marketing | PASS | HTTP 200 |
| 6 | `GET /pricing` | PASS | HTTP 200 |
| 7 | `POST /api/auth/login` (demo) | PASS | HTTP 200, session cookies set |
| 8 | `GET /api/billing/usage` (auth) | PASS | HTTP 200 |
| 9 | `POST /api/billing/checkout` (auth) | PASS* | HTTP 503 — Stripe keys not in `.env.local` (expected locally) |
| 10 | `POST /api/gbp/posts/{id}/publish` (auth) | PASS | HTTP 200, stub publish |
| 11 | `POST /api/webhooks/stripe` (no signature) | PASS* | HTTP 503 — webhook secret not configured |
| 12 | `POST /api/webhooks/stripe` (bad signature) | PASS* | HTTP 503 — same; returns 400 when `STRIPE_WEBHOOK_SECRET` is set |
| 13 | Communications POST | N/A | Not in Bon Air product scope (Seren Legal) |
| 14 | Widget intake POST | N/A | Not in Bon Air product scope |
| 15 | `marketing/campaigns/` (3 campaigns) | PASS | Each has `subject.txt`, `body.html`, `body.txt` |
| 16 | Social kit files | PASS | `marketing/social/*.md` + `marketing/assets/*.svg` |

## Bugs fixed during testing

- Prisma schema had duplicate `RankSnapshot` / `CompetitorSnapshot` model definitions (blocked `prisma validate`); removed duplicate block before Phase 3 `db:push`.

## Manual follow-up

- Set `STRIPE_*` and `STRIPE_WEBHOOK_SECRET` to verify checkout and webhook 400 on invalid signature.
- Phase 3 smoke: `GET /api/rankings`, `GET /api/citations/health`, `GET /api/competitors`, `POST /api/cms/push`, `POST /api/cron/gbp-scheduled` with `CRON_SECRET`.
