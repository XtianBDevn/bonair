# 02 — Database Schema

## Overview

PostgreSQL 16 with Row-Level Security (RLS) for tenant isolation. All multi-tenant tables carry `tenant_id UUID NOT NULL` with RLS policies enforced at the database level. EF Core global query filters provide the application-level belt to RLS's suspenders.

---

## Core Tables

### tenants

```sql
CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,           -- "Smith & Associates"
    slug            VARCHAR(100) UNIQUE NOT NULL,     -- "smith-associates"
    domain          VARCHAR(255),                     -- custom domain for white-label
    plan_id         UUID REFERENCES plans(id),
    parent_tenant_id UUID REFERENCES tenants(id),     -- multi-office hierarchy
    settings        JSONB NOT NULL DEFAULT '{}',      -- timezone, branding, defaults
    status          VARCHAR(20) NOT NULL DEFAULT 'active', -- active, suspended, cancelled
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### users

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    role            VARCHAR(30) NOT NULL DEFAULT 'staff',  -- owner, admin, attorney, staff, readonly
    avatar_url      VARCHAR(500),
    phone           VARCHAR(20),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, email)
);
```

### attorneys

```sql
CREATE TABLE attorneys (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    practice_areas  TEXT[] NOT NULL DEFAULT '{}',      -- '{personal_injury,criminal_defense}'
    bio             TEXT,
    hourly_rate     DECIMAL(10,2),
    is_accepting    BOOLEAN NOT NULL DEFAULT true,     -- accepting new leads
    max_daily_consultations INT NOT NULL DEFAULT 8,
    calendar_provider VARCHAR(20),                     -- google, outlook, null
    calendar_token_encrypted BYTEA,                    -- encrypted OAuth token
    office_hours    JSONB NOT NULL DEFAULT '{}',       -- { "mon": ["09:00","17:00"], ... }
    assignment_weight INT NOT NULL DEFAULT 1,          -- round-robin weighting
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attorneys_tenant ON attorneys(tenant_id);
CREATE INDEX idx_attorneys_practice ON attorneys USING GIN(practice_areas);
```

---

## Leads & Contacts

### contacts

```sql
CREATE TABLE contacts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    first_name      VARCHAR(100),
    last_name       VARCHAR(100),
    email           VARCHAR(255),
    phone           VARCHAR(20),
    phone_normalized VARCHAR(20),                     -- E.164 format for Twilio matching
    address_line1   VARCHAR(255),
    address_city    VARCHAR(100),
    address_state   VARCHAR(50),
    address_zip     VARCHAR(20),
    tags            TEXT[] DEFAULT '{}',
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX idx_contacts_phone ON contacts(tenant_id, phone_normalized);
CREATE INDEX idx_contacts_email ON contacts(tenant_id, email);
```

### leads

```sql
CREATE TABLE leads (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id),
    contact_id          UUID NOT NULL REFERENCES contacts(id),
    source              VARCHAR(30) NOT NULL,          -- website, phone, sms, referral, ad, chatbot, clio
    source_detail       VARCHAR(255),                  -- "google_ads_campaign_123", "referral_from_john"
    practice_area       VARCHAR(50) NOT NULL,           -- personal_injury, criminal_defense, dui, family, etc.
    status              VARCHAR(30) NOT NULL DEFAULT 'new',
        -- new → contacted → qualified → consultation_booked → consultation_completed → retained → lost
    score               INT NOT NULL DEFAULT 0,         -- 0–100, AI-computed
    urgency             VARCHAR(20) NOT NULL DEFAULT 'medium', -- low, medium, high, critical
    case_summary        TEXT,                           -- AI-generated from intake
    case_type_detail    VARCHAR(100),                   -- "rear-end collision", "first-offense DUI"
    estimated_value     DECIMAL(12,2),                  -- AI-estimated case value
    assigned_attorney_id UUID REFERENCES attorneys(id),
    pipeline_stage_id   UUID REFERENCES pipeline_stages(id),
    lost_reason         VARCHAR(255),
    retained_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_tenant_status ON leads(tenant_id, status);
CREATE INDEX idx_leads_tenant_score ON leads(tenant_id, score DESC);
CREATE INDEX idx_leads_tenant_urgency ON leads(tenant_id, urgency);
CREATE INDEX idx_leads_tenant_practice ON leads(tenant_id, practice_area);
CREATE INDEX idx_leads_tenant_attorney ON leads(tenant_id, assigned_attorney_id);
CREATE INDEX idx_leads_created ON leads(tenant_id, created_at DESC);
```

---

## Intake

### intake_forms

```sql
CREATE TABLE intake_forms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    name            VARCHAR(255) NOT NULL,             -- "Personal Injury Intake"
    practice_area   VARCHAR(50) NOT NULL,
    fields          JSONB NOT NULL,                    -- form field definitions
        -- [{ "key": "injury_date", "type": "date", "label": "When did the injury occur?", "required": true }, ...]
    is_active       BOOLEAN NOT NULL DEFAULT true,
    embed_token     VARCHAR(64) UNIQUE,                -- for public embed URL
    settings        JSONB NOT NULL DEFAULT '{}',       -- redirect URL, confirmation message
    submission_count INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### intake_sessions

```sql
CREATE TABLE intake_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    lead_id         UUID REFERENCES leads(id),
    contact_id      UUID REFERENCES contacts(id),
    form_id         UUID REFERENCES intake_forms(id),
    channel         VARCHAR(20) NOT NULL,              -- chatbot, sms, phone, form, manual
    status          VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- in_progress, completed, abandoned
    transcript      JSONB NOT NULL DEFAULT '[]',       -- conversation turns
        -- [{ "role": "bot", "content": "...", "ts": "..." }, { "role": "user", "content": "...", "ts": "..." }]
    form_data       JSONB NOT NULL DEFAULT '{}',       -- collected form field values
    ai_summary      TEXT,                              -- AI-generated intake summary
    ai_entities     JSONB NOT NULL DEFAULT '{}',       -- extracted: dates, names, amounts, locations
    ai_urgency      VARCHAR(20),                       -- AI-detected urgency
    ai_practice_area VARCHAR(50),                      -- AI-detected practice area
    ai_score        INT,                               -- AI qualification score
    duration_seconds INT,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_intake_sessions_tenant ON intake_sessions(tenant_id);
CREATE INDEX idx_intake_sessions_lead ON intake_sessions(lead_id);
CREATE INDEX idx_intake_sessions_status ON intake_sessions(tenant_id, status);
```

---

## Pipeline

### pipelines

```sql
CREATE TABLE pipelines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    name            VARCHAR(255) NOT NULL,             -- "Default Pipeline", "PI Pipeline"
    practice_area   VARCHAR(50),                       -- null = default for all
    is_default      BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### pipeline_stages

```sql
CREATE TABLE pipeline_stages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    pipeline_id     UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,             -- "New Lead", "Contacted", "Qualified", etc.
    position        INT NOT NULL,                      -- display order
    color           VARCHAR(7),                        -- hex color for Kanban
    is_terminal     BOOLEAN NOT NULL DEFAULT false,    -- "Retained" or "Lost"
    auto_action     JSONB,                             -- optional: trigger workflow on enter
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pipeline_stages_pipeline ON pipeline_stages(pipeline_id, position);
```

---

## Communications

### communications

```sql
CREATE TABLE communications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    contact_id      UUID NOT NULL REFERENCES contacts(id),
    lead_id         UUID REFERENCES leads(id),
    channel         VARCHAR(20) NOT NULL,              -- sms, email, call, voicemail
    direction       VARCHAR(10) NOT NULL,              -- inbound, outbound
    status          VARCHAR(20) NOT NULL DEFAULT 'sent', -- sent, delivered, failed, received
    body            TEXT,                               -- message content
    subject         VARCHAR(255),                       -- email subject
    from_number     VARCHAR(20),
    to_number       VARCHAR(20),
    twilio_sid      VARCHAR(64),                        -- Twilio message/call SID
    duration_seconds INT,                               -- for calls
    sentiment       VARCHAR(20),                        -- positive, neutral, negative (AI)
    sentiment_score DECIMAL(3,2),                       -- -1.0 to 1.0
    metadata        JSONB NOT NULL DEFAULT '{}',
    sent_by_user_id UUID REFERENCES users(id),          -- null for automated
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comms_tenant_contact ON communications(tenant_id, contact_id, created_at DESC);
CREATE INDEX idx_comms_tenant_lead ON communications(tenant_id, lead_id, created_at DESC);
CREATE INDEX idx_comms_twilio ON communications(twilio_sid);
```

### call_transcripts

```sql
CREATE TABLE call_transcripts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id),
    communication_id    UUID NOT NULL REFERENCES communications(id),
    lead_id             UUID REFERENCES leads(id),
    recording_url       VARCHAR(500),
    recording_duration  INT,                            -- seconds
    transcript_raw      TEXT,                            -- full transcription
    transcript_segments JSONB,                           -- [{ "speaker": "caller", "text": "...", "start": 0.0, "end": 2.5 }]
    ai_summary          TEXT,
    ai_entities         JSONB NOT NULL DEFAULT '{}',     -- extracted names, dates, amounts
    ai_urgency          VARCHAR(20),
    ai_action_items     JSONB NOT NULL DEFAULT '[]',     -- ["Schedule consultation", "Collect police report"]
    processed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Appointments & Calendar

### appointments

```sql
CREATE TABLE appointments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id),
    lead_id             UUID NOT NULL REFERENCES leads(id),
    attorney_id         UUID NOT NULL REFERENCES attorneys(id),
    contact_id          UUID NOT NULL REFERENCES contacts(id),
    type                VARCHAR(30) NOT NULL DEFAULT 'consultation', -- consultation, follow_up, signing
    status              VARCHAR(20) NOT NULL DEFAULT 'scheduled',    -- scheduled, confirmed, completed, cancelled, no_show
    starts_at           TIMESTAMPTZ NOT NULL,
    ends_at             TIMESTAMPTZ NOT NULL,
    timezone            VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
    location            VARCHAR(255),                    -- "Office", "Zoom", phone number
    meeting_url         VARCHAR(500),                    -- Zoom/Teams link
    notes               TEXT,
    external_event_id   VARCHAR(255),                    -- Google/Outlook calendar event ID
    reminder_sent_at    TIMESTAMPTZ,
    confirmed_at        TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,
    cancel_reason       VARCHAR(255),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_tenant_date ON appointments(tenant_id, starts_at);
CREATE INDEX idx_appointments_attorney ON appointments(attorney_id, starts_at);
CREATE INDEX idx_appointments_lead ON appointments(lead_id);
```

---

## Automations

### automation_workflows

```sql
CREATE TABLE automation_workflows (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    name            VARCHAR(255) NOT NULL,             -- "Missed Call Recovery"
    description     TEXT,
    trigger_type    VARCHAR(50) NOT NULL,              -- lead_created, missed_call, intake_abandoned,
                                                       -- consultation_completed, stage_changed, manual
    trigger_config  JSONB NOT NULL DEFAULT '{}',       -- filter conditions for trigger
    steps           JSONB NOT NULL,                    -- ordered array of workflow steps
        -- [{ "type": "send_sms", "template": "...", "delay_minutes": 0 },
        --  { "type": "wait", "delay_minutes": 1440 },
        --  { "type": "condition", "field": "lead.status", "op": "eq", "value": "contacted", ... }]
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_system       BOOLEAN NOT NULL DEFAULT false,    -- system templates can't be deleted
    execution_count INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### workflow_executions

```sql
CREATE TABLE workflow_executions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id),
    workflow_id         UUID NOT NULL REFERENCES automation_workflows(id),
    lead_id             UUID NOT NULL REFERENCES leads(id),
    contact_id          UUID NOT NULL REFERENCES contacts(id),
    status              VARCHAR(20) NOT NULL DEFAULT 'running', -- running, completed, paused, failed, cancelled
    current_step_index  INT NOT NULL DEFAULT 0,
    step_results        JSONB NOT NULL DEFAULT '[]',    -- results of each completed step
    next_run_at         TIMESTAMPTZ,                     -- when the next step should execute
    error_message       TEXT,
    started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wf_exec_next_run ON workflow_executions(next_run_at) WHERE status = 'running';
CREATE INDEX idx_wf_exec_tenant ON workflow_executions(tenant_id, status);
```

---

## Reviews

### review_requests

```sql
CREATE TABLE review_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    lead_id         UUID NOT NULL REFERENCES leads(id),
    contact_id      UUID NOT NULL REFERENCES contacts(id),
    platform        VARCHAR(20) NOT NULL,              -- google, avvo, yelp, facebook
    status          VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, sent, clicked, reviewed, skipped
    review_url      VARCHAR(500),                       -- direct link to leave review
    message_sent    TEXT,                                -- the SMS/email body sent
    sent_at         TIMESTAMPTZ,
    clicked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Billing & Usage

### plans

```sql
CREATE TABLE plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,             -- "Starter", "Professional", "Enterprise"
    stripe_price_id VARCHAR(100) NOT NULL,
    monthly_price   DECIMAL(10,2) NOT NULL,
    ai_credits      INT NOT NULL,                      -- monthly AI credit allocation
    sms_included    INT NOT NULL,                      -- monthly SMS included
    max_users       INT NOT NULL,
    max_attorneys   INT NOT NULL,
    features        JSONB NOT NULL DEFAULT '{}',        -- feature flags per plan
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### subscriptions

```sql
CREATE TABLE subscriptions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id),
    plan_id             UUID NOT NULL REFERENCES plans(id),
    stripe_subscription_id VARCHAR(100) UNIQUE,
    stripe_customer_id  VARCHAR(100) NOT NULL,
    status              VARCHAR(20) NOT NULL,           -- active, past_due, cancelled, trialing
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end  TIMESTAMPTZ NOT NULL,
    trial_ends_at       TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### usage_events

```sql
CREATE TABLE usage_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    user_id         UUID REFERENCES users(id),
    event_type      VARCHAR(50) NOT NULL,              -- ai_completion, sms_sent, sms_received, call_minute
    model           VARCHAR(50),                        -- gpt-4o-mini, claude-sonnet, etc.
    tokens_input    INT,
    tokens_output   INT,
    credits_used    DECIMAL(10,4) NOT NULL DEFAULT 0,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_usage_tenant_date ON usage_events(tenant_id, created_at);

-- Partitioned by month for performance
-- CREATE TABLE usage_events_2025_01 PARTITION OF usage_events FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### usage_summary

```sql
CREATE TABLE usage_summary (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    ai_credits_used DECIMAL(12,4) NOT NULL DEFAULT 0,
    sms_sent        INT NOT NULL DEFAULT 0,
    sms_received    INT NOT NULL DEFAULT 0,
    call_minutes    INT NOT NULL DEFAULT 0,
    leads_created   INT NOT NULL DEFAULT 0,
    consultations_booked INT NOT NULL DEFAULT 0,
    UNIQUE(tenant_id, period_start)
);
```

---

## Analytics

### analytics_snapshots

```sql
CREATE TABLE analytics_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    snapshot_date   DATE NOT NULL,
    metrics         JSONB NOT NULL,
        -- { "leads_total": 45, "leads_qualified": 30, "conversion_rate": 0.67,
        --   "avg_response_time_seconds": 120, "consultations_booked": 15,
        --   "revenue_attributed": 25000.00, "source_breakdown": {...},
        --   "practice_area_breakdown": {...}, "attorney_performance": {...} }
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, snapshot_date)
);
```

---

## Audit & Security

### audit_events

```sql
CREATE TABLE audit_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    user_id         UUID REFERENCES users(id),
    action          VARCHAR(100) NOT NULL,             -- "lead.created", "sms.sent", "appointment.booked"
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       UUID NOT NULL,
    changes         JSONB,                              -- { "before": {...}, "after": {...} }
    ip_address      INET,
    user_agent      VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_tenant_date ON audit_events(tenant_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_events(entity_type, entity_id);

-- Retention: 2 years, then archive to cold storage
```

### refresh_tokens

```sql
CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    token_hash      VARCHAR(128) NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address      INET,
    user_agent      VARCHAR(500)
);
```

---

## Row-Level Security

Applied to every tenant-scoped table:

```sql
-- Example for leads table (repeated for all tenant tables)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_leads ON leads
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_leads_insert ON leads
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

The API sets `app.current_tenant_id` at the start of every request via:

```sql
SET LOCAL app.current_tenant_id = 'tenant-uuid-here';
```

---

## Indexes Summary

Key composite indexes for common query patterns:

- Lead list with filters: `(tenant_id, status)`, `(tenant_id, practice_area)`, `(tenant_id, created_at DESC)`
- Communication threads: `(tenant_id, contact_id, created_at DESC)`
- Appointment scheduling: `(attorney_id, starts_at)`, `(tenant_id, starts_at)`
- Workflow execution: `(next_run_at) WHERE status = 'running'`
- Usage metering: `(tenant_id, created_at)` — partitioned by month
- Full-text search on leads: GIN index on `case_summary` (Phase 2)

---

## Migration Strategy

- EF Core migrations for schema changes
- Seed data: default pipeline stages, system workflow templates, plan definitions
- Idempotent migration scripts for RLS policies
- Separate migration for partitioning `usage_events` (run once at scale)
