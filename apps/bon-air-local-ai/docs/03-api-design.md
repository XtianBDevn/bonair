# 03 — API Design

REST + JSON. OpenAPI 3.1 spec at `/swagger/v1/swagger.json`. The Next.js client is generated from this spec on every build.

## Conventions

- **Base URL:** `https://api.bonairlocal.ai/v1`
- **Auth:** `Authorization: Bearer <jwt>`. Refresh via `POST /auth/refresh`.
- **Tenant scoping:** the JWT carries `tenant_id`. For agency users acting on a sub-client, pass `X-Acting-Tenant-Id: <client_uuid>` — server validates the membership.
- **Idempotency:** all mutations accept `Idempotency-Key` header (UUID). Replays return cached response within 24h.
- **Pagination:** cursor-based. `?cursor=<opaque>&limit=50`. Responses include `nextCursor`.
- **Errors:** RFC 7807 problem+json.

```json
{
  "type": "https://bonairlocal.ai/errors/quota_exceeded",
  "title": "Plan limit reached",
  "status": 402,
  "detail": "Your Starter plan allows 50 GEO pages/month. You have 50.",
  "code": "QUOTA_EXCEEDED",
  "traceId": "01HX..."
}
```

---

## Resource map

```
/auth
  POST   /signup
  POST   /login
  POST   /refresh
  POST   /logout
  POST   /oauth/google/start
  POST   /oauth/google/callback

/me
  GET    /                       — current user + memberships
  PATCH  /                       — update profile

/tenants/{tenantId}
  GET    /                       — tenant details (brand, plan)
  PATCH  /                       — owner/admin only
  GET    /members
  POST   /members                — invite
  DELETE /members/{userId}

/clients                          (agency only — sub-tenants)
  GET    /
  POST   /
  GET    /{clientId}
  PATCH  /{clientId}

/locations
  GET    /
  POST   /
  GET    /{id}
  PATCH  /{id}
  DELETE /{id}

/services
  GET    /?locationId=
  POST   /
  PATCH  /{id}
  DELETE /{id}

/geo-pages
  GET    /                       — list, filter by status/location
  POST   /                       — create draft (no AI yet)
  POST   /generate               — kick off AI generation → returns { jobId }
  GET    /{id}
  PATCH  /{id}                   — edit blocks
  POST   /{id}/publish           — publish (host or push to WP)
  POST   /{id}/archive
  GET    /{id}/revisions
  GET    /{id}/uniqueness        — score vs other tenant pages

/gbp
  GET    /accounts
  POST   /accounts/connect       — returns Google OAuth URL
  POST   /accounts/disconnect/{id}
  GET    /locations              — synced from GBP
  POST   /locations/sync         — refresh

/gbp/posts
  GET    /?locationId=&status=
  POST   /                       — create draft
  POST   /draft-ai               — { locationId, topic, tone } → AI draft
  POST   /{id}/schedule          — { whenUtc }
  POST   /{id}/publish-now
  DELETE /{id}

/gbp/reviews
  GET    /?locationId=
  POST   /{id}/draft-response    — AI draft
  POST   /{id}/respond           — { text } → posts to GBP

/content
  GET    /items
  POST   /items                  — { kind, prompt, context }
  GET    /items/{id}
  POST   /items/{id}/regenerate

/ai/jobs
  GET    /{id}
  GET    /{id}/stream            — SSE stream of tokens / status events
  POST   /{id}/cancel

/billing
  GET    /plans
  GET    /subscription
  POST   /checkout               — Stripe Checkout session
  POST   /portal                 — Stripe customer portal
  POST   /webhooks/stripe        — Stripe → us (HMAC verified)

/usage
  GET    /summary?period=current_month

/exports
  POST   /reports/monthly        — { clientId, month } → PDF, async
  GET    /reports/{id}
```

---

## Sample request/response

### POST `/v1/geo-pages/generate`

```http
POST /v1/geo-pages/generate
Authorization: Bearer ...
Idempotency-Key: 01HX2C0Z...
Content-Type: application/json

{
  "locationId": "01HX...",
  "serviceId": "01HX...",
  "pageType": "neighborhood",
  "targetCity": "Bon Air",
  "targetRegion": "VA",
  "tone": "warm-professional",
  "keywords": ["landscaping bon air va", "lawn care chesterfield"],
  "options": {
    "includeFaq": true,
    "faqCount": 6,
    "includeSchema": true,
    "internalLinkSlugs": ["midlothian-landscaping", "richmond-lawn-care"]
  }
}
```

```http
HTTP/1.1 202 Accepted

{
  "jobId": "01HX2C0Z...",
  "pageId": "01HX2C10...",
  "streamUrl": "/v1/ai/jobs/01HX2C0Z.../stream",
  "estimatedSeconds": 45
}
```

Then the client opens an SSE stream:

```
event: status
data: {"status":"running","step":"outline"}

event: token
data: {"block":"hero","text":"Trusted "}

event: block_done
data: {"block":"hero","html":"<h1>Trusted landscaping in Bon Air...</h1>"}

event: status
data: {"status":"completed","pageId":"01HX2C10..."}
```

### POST `/v1/gbp/posts/draft-ai`

```json
{
  "locationId": "01HX...",
  "topic": "Spring lawn aeration special — 15% off",
  "ctaType": "BOOK",
  "ctaUrl": "https://example.com/book",
  "tone": "friendly-local",
  "constraints": { "maxChars": 1500 }
}
```

Response includes the draft + a `usedCredits` field so the UI can show the remaining quota.

---

## Rate limits

| Tier      | Reads/min | Writes/min | AI generations/hr |
| --------- | ---------:| ----------:| -----------------:|
| Starter   | 120       | 30         | 20                |
| Growth    | 300       | 90         | 80                |
| Agency    | 600       | 200        | 250               |
| Enterprise| custom    | custom     | custom            |

Implemented with a Redis token-bucket per `tenantId`. 429 responses include `Retry-After`.

---

## Webhooks (outbound)

Tenants can register webhooks for events: `geo_page.published`, `gbp_post.posted`, `gbp_review.received`. Payloads are signed: `X-BonAir-Signature: t=<unix>,v1=<hmac_sha256>`.

---

## Versioning

URL-based (`/v1`, `/v2`). Breaking changes get a new version with a 6-month sunset on the previous version. Non-breaking additions go to the current version.
