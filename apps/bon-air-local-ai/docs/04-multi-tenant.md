# 04 — Multi-Tenant Strategy

## Tenancy model: **shared-DB, shared-schema, RLS-enforced**

Pool model is the only one that scales economically for thousands of small agencies and SMBs. Tenant isolation through three layered defenses:

1. **EF Core global query filters** — every multi-tenant entity has `b.HasQueryFilter(x => x.TenantId == _tenant.CurrentId)`. Developers can't accidentally cross tenants.
2. **Postgres Row-Level Security** — second-line defense. Even raw SQL can't escape it because the connection has `app.tenant_id` set.
3. **API-layer authorization** — explicit policy checks for cross-tenant operations (e.g., agency acting on client).

## Tenant hierarchy

```
Agency Tenant (is_agency=true)
 ├── Client Tenant A (parent_tenant_id = agency)
 ├── Client Tenant B
 └── Client Tenant C
```

- Agency owners/admins automatically have implicit membership in all child tenants.
- Billing rolls up to the agency unless a sub-tenant has its own subscription (enterprise option).
- Per-client white-label brand overrides the agency brand for that client's reports/portals.

## Acting-as-tenant

Agency user U has a JWT with `tenant_id=AGENCY_ID`. To work on client C, they send `X-Acting-Tenant-Id: CLIENT_ID`. The middleware:

1. Verifies U has agency membership.
2. Verifies the client's `parent_tenant_id = AGENCY_ID`.
3. Sets `ITenantContext.CurrentId = CLIENT_ID` and `ActingFor` for audit.
4. Writes audit entry: `actor_user_id=U, tenant_id=CLIENT_ID, agency_id=AGENCY_ID`.

## Resource quotas

Defined per plan in `plans.limits` JSON:

```json
{
  "locations": 5,
  "geoPagesPerMonth": 100,
  "gbpPostsPerMonth": 200,
  "aiCredits": 50000,
  "clients": 0,
  "users": 3,
  "whiteLabel": false
}
```

Quota check runs in a MediatR pipeline behavior (`QuotaGuardBehavior<TRequest, TResponse>`) before any command handler that touches metered resources. Returns 402 if exceeded.

## Data residency

US-East primary for all plans. EU residency available on Agency/Enterprise: tenants flagged `region=eu` are routed at the load balancer to an EU API + EU DB cluster. Cross-region replication is not used — tenants live entirely in one region.

## Tenant lifecycle

| Event       | Effect |
| ----------- | ------ |
| Signup      | New tenant created, owner membership, 14-day trial of Growth plan |
| Plan change | New plan effective at next period unless upgrade (immediate, prorated) |
| Cancel      | `status=canceled`, access until `current_period_end`, then read-only 30 days |
| Delete      | Soft delete (`deleted_at` set). 30 days later, hard delete cascades through. Audit retained 7 years. |
| Export      | Tenant can request full data export — async job builds a ZIP of CSV + JSON, S3 link via email |

## Tenant onboarding flow

1. Signup → tenant + owner created.
2. Onboarding wizard:
   - Add first business location (name, address, GBP claim).
   - Connect Google Business Profile (OAuth).
   - Pick 3 priority service/city combinations.
   - Generate 1 GEO page + 1 GBP post draft as the "wow" moment.
3. Dashboard reveals with starter checklist.

This onboarding hits the AI hero feature in under 60 seconds and is the single most important UX in the product.
