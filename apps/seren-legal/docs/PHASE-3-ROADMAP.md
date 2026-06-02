# Phase 3 — Roadmap & delivery status (Seren Legal)

Phase 3 adds calendar stubs, workflow execution, integration webhooks, analytics snapshots, and review-request flow — tenant-scoped in `apps/web`.

## Completed (Phase 3)

| # | Feature | Deliverables |
|---|---------|--------------|
| 1 | **Calendar availability** | `GET /api/calendar/availability`; UI `/calendar` with booking skeleton |
| 2 | **Booking stub** | `POST /api/calendar/book` creates `Appointment` (no Google/Outlook OAuth) |
| 3 | **Automation executor** | `POST /api/workflows/execute` runs next JSON workflow step; `WorkflowExecution` model; `POST /api/cron/workflows` |
| 4 | **Clio / Zapier webhooks** | `POST /api/webhooks/clio`, `POST /api/webhooks/zapier` (stub receivers) |
| 5 | **Analytics dashboard** | `GET /api/analytics`; `AnalyticsSnapshot` seed; UI `/analytics` |
| 6 | **Review requests** | `POST /api/reviews/request` stub; lead detail button; `ReviewRequest` model |
| 7 | **Navigation** | Sidebar: Calendar, Analytics |

## Environment (Phase 3)

| Variable | Required | Notes |
|----------|----------|-------|
| `CRON_SECRET` | For workflow cron | `Authorization: Bearer` or `x-cron-secret` |
| `CLIO_WEBHOOK_SECRET` | Optional | Validates Clio stub payloads |
| `ZAPIER_WEBHOOK_SECRET` | Optional | Validates Zapier stub payloads |

## Still deferred

- Google/Outlook calendar OAuth sync
- Hangfire / Redis durable job queue
- Full Clio/Lawmatics API sync
- Live Twilio review SMS with delivery receipts
- HIPAA audit hardening, Postgres RLS
- Monthly PDF reports

## Cron setup (Vercel)

```json
{
  "crons": [{
    "path": "/api/cron/workflows",
    "schedule": "*/10 * * * *"
  }]
}
```

Set `CRON_SECRET` in Vercel for authenticated cron invocations.
