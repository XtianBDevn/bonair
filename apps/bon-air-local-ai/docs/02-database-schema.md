# 02 — Database Schema

PostgreSQL 16. Every multi-tenant table has `tenant_id uuid not null` + RLS policy. UUIDv7 for ordered primary keys. Timestamps in UTC.

## Schema overview

```
Identity        : tenants, users, memberships, roles, permissions, api_keys, oauth_connections
Billing         : plans, subscriptions, usage_events, usage_summary, ai_credits
Clients (agency): clients, client_users
Locations       : business_locations, service_areas, services
GEO Pages       : geo_pages, geo_page_revisions, geo_page_blocks, content_uniqueness
GBP             : gbp_accounts, gbp_locations, gbp_posts, gbp_reviews, gbp_review_responses
Content         : content_items, content_revisions, prompts, prompt_runs
Rankings        : keywords, rank_snapshots, geo_grid_points, competitors
Citations       : citation_directories, citation_listings
AI              : ai_jobs, ai_messages, ai_usage
System          : audit_events, webhooks, exports
```

---

## Core entities (DDL excerpts)

```sql
-- TENANTS ------------------------------------------------------------
create table tenants (
    id            uuid primary key default uuidv7(),
    slug          text not null unique,
    name          text not null,
    plan_id       uuid references plans(id),
    is_agency     boolean not null default false,
    parent_tenant_id uuid references tenants(id),
    brand         jsonb not null default '{}'::jsonb,
    settings      jsonb not null default '{}'::jsonb,
    created_at    timestamptz not null default now(),
    deleted_at    timestamptz
);
create index tenants_parent_idx on tenants(parent_tenant_id) where parent_tenant_id is not null;

-- USERS --------------------------------------------------------------
create table users (
    id            uuid primary key default uuidv7(),
    email         citext not null unique,
    password_hash text,
    name          text,
    avatar_url    text,
    is_active     boolean not null default true,
    last_login_at timestamptz,
    created_at    timestamptz not null default now()
);

create table memberships (
    id          uuid primary key default uuidv7(),
    tenant_id   uuid not null references tenants(id) on delete cascade,
    user_id     uuid not null references users(id) on delete cascade,
    role        text not null check (role in ('owner','admin','editor','viewer')),
    created_at  timestamptz not null default now(),
    unique(tenant_id, user_id)
);
create index memberships_user_idx on memberships(user_id);

-- BILLING ------------------------------------------------------------
create table plans (
    id              uuid primary key default uuidv7(),
    code            text not null unique,
    name            text not null,
    monthly_price_cents int not null,
    annual_price_cents  int not null,
    limits          jsonb not null,
    features        jsonb not null default '[]'::jsonb,
    stripe_price_monthly text,
    stripe_price_annual  text,
    is_active       boolean not null default true
);

create table subscriptions (
    id                  uuid primary key default uuidv7(),
    tenant_id           uuid not null references tenants(id) on delete cascade,
    plan_id             uuid not null references plans(id),
    stripe_customer_id  text not null,
    stripe_subscription_id text not null unique,
    status              text not null,
    current_period_end  timestamptz not null,
    cancel_at_period_end boolean not null default false,
    created_at          timestamptz not null default now()
);
create index subscriptions_tenant_idx on subscriptions(tenant_id);

create table usage_events (
    id          bigserial primary key,
    tenant_id   uuid not null references tenants(id) on delete cascade,
    kind        text not null,
    quantity    numeric not null,
    metadata    jsonb not null default '{}'::jsonb,
    created_at  timestamptz not null default now()
);
create index usage_events_tenant_kind_time on usage_events(tenant_id, kind, created_at desc);

-- LOCATIONS ----------------------------------------------------------
create table business_locations (
    id           uuid primary key default uuidv7(),
    tenant_id    uuid not null references tenants(id) on delete cascade,
    client_id    uuid references tenants(id),
    name         text not null,
    address      jsonb not null,
    geo          jsonb,
    phone        text,
    website      text,
    gbp_place_id text,
    primary_category text,
    categories   text[] not null default '{}',
    service_radius_miles int,
    timezone     text not null default 'America/New_York',
    created_at   timestamptz not null default now()
);
create index biz_loc_tenant_idx on business_locations(tenant_id);

create table services (
    id           uuid primary key default uuidv7(),
    tenant_id    uuid not null references tenants(id) on delete cascade,
    location_id  uuid references business_locations(id) on delete cascade,
    name         text not null,
    slug         text not null,
    description  text,
    metadata     jsonb not null default '{}'::jsonb,
    unique(tenant_id, location_id, slug)
);

-- GEO PAGES ----------------------------------------------------------
create table geo_pages (
    id              uuid primary key default uuidv7(),
    tenant_id       uuid not null references tenants(id) on delete cascade,
    location_id     uuid references business_locations(id),
    service_id      uuid references services(id),
    page_type       text not null,
    slug            text not null,
    target_city     text,
    target_region   text,
    target_geo      jsonb,
    title           text not null,
    meta_description text,
    status          text not null default 'draft',
    content         jsonb not null,
    schema_jsonld   jsonb,
    uniqueness_score numeric,
    word_count      int,
    published_at    timestamptz,
    published_url   text,
    created_by      uuid references users(id),
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    unique(tenant_id, slug)
);
create index geo_pages_tenant_status on geo_pages(tenant_id, status);
create index geo_pages_location_idx on geo_pages(location_id);

create table geo_page_revisions (
    id            uuid primary key default uuidv7(),
    geo_page_id   uuid not null references geo_pages(id) on delete cascade,
    revision      int not null,
    content       jsonb not null,
    created_by    uuid references users(id),
    created_at    timestamptz not null default now(),
    unique(geo_page_id, revision)
);

create table content_uniqueness (
    geo_page_id   uuid primary key references geo_pages(id) on delete cascade,
    embedding     vector(1536),
    computed_at   timestamptz not null default now()
);

-- GBP --------------------------------------------------------------
create table gbp_accounts (
    id                  uuid primary key default uuidv7(),
    tenant_id           uuid not null references tenants(id) on delete cascade,
    google_account_id   text not null,
    refresh_token       text not null,
    access_token        text,
    token_expires_at    timestamptz,
    connected_by        uuid references users(id),
    created_at          timestamptz not null default now(),
    unique(tenant_id, google_account_id)
);

create table gbp_posts (
    id            uuid primary key default uuidv7(),
    tenant_id     uuid not null references tenants(id) on delete cascade,
    location_id   uuid not null references business_locations(id) on delete cascade,
    topic         text not null,
    cta_type      text,
    cta_url       text,
    body          text not null,
    image_url     text,
    scheduled_for timestamptz,
    status        text not null default 'draft',
    posted_at     timestamptz,
    gbp_post_id   text,
    error         text,
    ai_job_id     uuid,
    created_at    timestamptz not null default now()
);
create index gbp_posts_tenant_status_sched on gbp_posts(tenant_id, status, scheduled_for);

create table gbp_reviews (
    id            uuid primary key default uuidv7(),
    tenant_id     uuid not null references tenants(id) on delete cascade,
    location_id   uuid not null references business_locations(id) on delete cascade,
    gbp_review_id text not null unique,
    rating        smallint not null,
    text          text,
    reviewer_name text,
    created_at    timestamptz not null,
    response_text text,
    response_status text not null default 'none',
    response_posted_at timestamptz
);

-- AI -----------------------------------------------------------------
create table ai_jobs (
    id            uuid primary key default uuidv7(),
    tenant_id     uuid not null references tenants(id) on delete cascade,
    kind          text not null,
    status        text not null default 'queued',
    input         jsonb not null,
    output        jsonb,
    error         text,
    correlation_id uuid,
    provider      text,
    model         text,
    input_tokens  int,
    output_tokens int,
    cost_cents    numeric(10,4),
    started_at    timestamptz,
    finished_at   timestamptz,
    created_at    timestamptz not null default now()
);
create index ai_jobs_tenant_status on ai_jobs(tenant_id, status);

-- AUDIT --------------------------------------------------------------
create table audit_events (
    id          bigserial primary key,
    tenant_id   uuid,
    user_id     uuid,
    action      text not null,
    target_type text,
    target_id   uuid,
    metadata    jsonb not null default '{}'::jsonb,
    ip          inet,
    user_agent  text,
    created_at  timestamptz not null default now()
);
create index audit_tenant_time on audit_events(tenant_id, created_at desc);
```

---

## Row-level security (sample)

```sql
alter table geo_pages enable row level security;

create policy geo_pages_tenant_isolation
  on geo_pages
  using (tenant_id = current_setting('app.tenant_id')::uuid)
  with check (tenant_id = current_setting('app.tenant_id')::uuid);
```

The API sets `SET app.tenant_id = $1` on each request via a `DbConnectionInterceptor` so RLS is enforced even if a query handler forgets the filter.

---

## Indexing strategy

- Composite indexes on `(tenant_id, <hot_column>)` for every multi-tenant read path.
- `geo_pages.slug` unique per tenant (not global).
- `pgvector` extension for `content_uniqueness.embedding` with HNSW index for similarity scoring during generation.
- Partial indexes for status filters: `where status = 'scheduled'` on `gbp_posts`.

## Migrations

EF Core code-first migrations live in `apps/api/src/BonAir.Infrastructure/Persistence/Migrations/`. CI runs `dotnet ef database update` against a Postgres test container on every PR.

## Backups

- Daily logical backups via `pg_dump` to S3 (encrypted, 30-day retention).
- Continuous WAL archiving (PITR window: 7 days).
- Monthly restore drill (documented in `docs/07-deployment-devops.md`).
