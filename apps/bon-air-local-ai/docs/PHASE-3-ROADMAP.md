# Phase 3 — Roadmap & delivery status

Phase 3 extends the MVP with local SEO intelligence stubs, CMS bridge, and scheduled GBP processing — all tenant-scoped in `apps/web`.

## Completed (Phase 3)

| # | Feature | Deliverables |
|---|---------|--------------|
| 1 | **Rank tracking** | Prisma `RankKeyword`, `RankSnapshot`; demo seed; `GET /api/rankings`; UI `/app/rankings` (table + chart placeholder) |
| 2 | **Citation health** | Prisma `CitationListing`; `lib/citations.ts` crawl stub; `GET /api/citations/health`; dashboard citation card |
| 3 | **Competitor snapshots** | Prisma `CompetitorSnapshot`; seed; `GET /api/competitors`; UI `/app/competitors` |
| 4 | **WordPress CMS push** | `POST /api/cms/push` (session + HMAC webhook modes); `docs/CMS-WORDPRESS-PUSH.md` |
| 5 | **Scheduled GBP cron** | `POST /api/cron/gbp-scheduled` protected by `CRON_SECRET`; `lib/gbp-scheduled.ts` processes due `gbp_posts` |
| 6 | **Phase 2 test doc** | `docs/PHASE-2-TEST-RESULTS.md` (curl-based) |
| 7 | **Navigation** | Sidebar links for Rankings and Competitors |

## Environment (Phase 3)

| Variable | Required | Notes |
|----------|----------|-------|
| `CRON_SECRET` | For cron route | `Authorization: Bearer <secret>` or `x-cron-secret` |
| `CMS_WEBHOOK_SECRET` | For signed WP webhooks | Optional for session-only push |

## Still deferred (post–Phase 3)

- DataForSEO / SerpApi live rank pulls
- Full citation directory crawlers
- Hangfire / Redis job queue
- Live Google Business Profile OAuth publish
- Stripe metering tied to rank/citation jobs
- Recharts (or similar) on rankings UI

## Cron setup (Vercel)

```json
{
  "crons": [{
    "path": "/api/cron/gbp-scheduled",
    "schedule": "*/15 * * * *"
  }]
}
```

Set `CRON_SECRET` in Vercel and send it on each cron invocation.
