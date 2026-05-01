-- ================================================================
-- Zack AI Portal — Full Database Schema
-- Run via: npm run db:migrate
-- ================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- CLIENTS
-- Source of truth for every person who contacts the system
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           TEXT UNIQUE NOT NULL,         -- primary identifier (normalized E.164)
  name            TEXT,
  email           TEXT,
  intent          TEXT CHECK (intent IN ('buy','sell','both','unknown')) DEFAULT 'unknown',
  stage           TEXT CHECK (stage IN ('intake','qualifying','active','under_contract','closed','inactive')) DEFAULT 'intake',
  assigned_workflow TEXT,                        -- e.g. 'buyer_tour', 'listing_launch'
  workflow_run_id UUID,                          -- current active workflow
  channel         TEXT CHECK (channel IN ('imessage','sms','email')) DEFAULT 'imessage',
  opted_out       BOOLEAN DEFAULT false,         -- TCPA compliance
  opted_out_at    TIMESTAMPTZ,
  notes           TEXT,                          -- Zack's manual notes
  created_at      TIMESTAMPTZ DEFAULT now(),
  last_contact_at TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- CONVERSATIONS
-- Every message in/out — full history per client
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role        TEXT CHECK (role IN ('user','assistant','system')) NOT NULL,
  content     TEXT NOT NULL,
  channel     TEXT CHECK (channel IN ('imessage','sms','email','portal')) DEFAULT 'imessage',
  metadata    JSONB DEFAULT '{}',               -- e.g. {message_sid, bluesend_id}
  sent_at     TIMESTAMPTZ DEFAULT now(),
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_sent_at ON conversations(sent_at DESC);

-- ────────────────────────────────────────────────────────────
-- CAPTURED FIELDS
-- Structured info extracted from conversations
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS captured_fields (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  field_name   TEXT NOT NULL,                   -- e.g. 'budget', 'zip_codes', 'bedrooms'
  field_value  TEXT NOT NULL,
  confidence   NUMERIC(3,2) DEFAULT 1.0,        -- 0.0–1.0
  source       TEXT DEFAULT 'ai_extracted',     -- 'ai_extracted' | 'manual'
  captured_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, field_name)                 -- one value per field per client (upsert)
);
CREATE INDEX IF NOT EXISTS idx_captured_fields_client_id ON captured_fields(client_id);

-- ────────────────────────────────────────────────────────────
-- SKILLS
-- Reusable automation blocks (browser recordings + built-ins)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skills (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,                   -- user-given name, e.g. "Log into Navica"
  slug         TEXT UNIQUE NOT NULL,            -- machine-friendly, e.g. "log-into-navica"
  type         TEXT CHECK (type IN ('browser','email','sms','document','ai_generate','condition','delay','webhook')) NOT NULL,
  description  TEXT,
  config       JSONB DEFAULT '{}',              -- type-specific config (template, steps, etc.)
  steps        JSONB DEFAULT '[]',              -- Playwright steps array for browser skills
  is_builtin   BOOLEAN DEFAULT false,           -- true = ships with the app
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- TEMPLATES
-- Email/text/document templates with {{variable}} slots
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  type         TEXT CHECK (type IN ('email','sms','document','social')) NOT NULL,
  subject      TEXT,                            -- email subject line
  body         TEXT NOT NULL,                   -- supports {{variable}} syntax
  variables    JSONB DEFAULT '[]',              -- list of required variable names
  skill_id     UUID REFERENCES skills(id),      -- linked skill if applicable
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- WORKFLOWS
-- Named sequences of steps (the assembly line definition)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,                   -- e.g. "Listing Launch"
  slug         TEXT UNIQUE NOT NULL,
  description  TEXT,
  trigger      TEXT CHECK (trigger IN ('manual','intake_complete','date','webhook')) DEFAULT 'manual',
  trigger_config JSONB DEFAULT '{}',
  steps        JSONB NOT NULL DEFAULT '[]',     -- ordered array of step definitions
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- WORKFLOW RUNS
-- Live execution state for a client going through a workflow
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_runs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id      UUID NOT NULL REFERENCES workflows(id),
  client_id        UUID REFERENCES clients(id) ON DELETE SET NULL,
  status           TEXT CHECK (status IN ('pending','running','paused','completed','failed')) DEFAULT 'pending',
  current_step_idx INTEGER DEFAULT 0,
  step_results     JSONB DEFAULT '[]',          -- results from each completed step
  context          JSONB DEFAULT '{}',          -- deal-specific variable values
  error            TEXT,
  started_at       TIMESTAMPTZ DEFAULT now(),
  completed_at     TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_client_id ON workflow_runs(client_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status);

-- ────────────────────────────────────────────────────────────
-- DEALS
-- Active real estate transactions
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID REFERENCES clients(id) ON DELETE SET NULL,
  type                TEXT CHECK (type IN ('buy','sell','lease')) NOT NULL,
  status              TEXT CHECK (status IN ('active','under_contract','pending','closed','cancelled')) DEFAULT 'active',
  property_address    TEXT,
  property_city       TEXT,
  property_state      TEXT DEFAULT 'ID',
  property_zip        TEXT,
  list_price          NUMERIC(12,2),
  offer_price         NUMERIC(12,2),
  accepted_price      NUMERIC(12,2),
  mls_number          TEXT,
  close_date          DATE,
  inspection_deadline DATE,
  financing_deadline  DATE,
  appraisal_deadline  DATE,
  other_agent_name    TEXT,
  other_agent_phone   TEXT,
  other_agent_email   TEXT,
  notes               TEXT,
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_deals_client_id ON deals(client_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);

-- ────────────────────────────────────────────────────────────
-- TASKS
-- Checklist items, reminders, follow-ups
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id      UUID REFERENCES deals(id) ON DELETE CASCADE,
  client_id    UUID REFERENCES clients(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT CHECK (status IN ('pending','in_progress','done','cancelled')) DEFAULT 'pending',
  priority     TEXT CHECK (priority IN ('urgent','high','normal','low')) DEFAULT 'normal',
  due_date     TIMESTAMPTZ,
  assigned_to  TEXT DEFAULT 'zack',
  source       TEXT DEFAULT 'manual',           -- 'manual' | 'workflow' | 'ai'
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tasks_deal_id ON tasks(deal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- ────────────────────────────────────────────────────────────
-- SKILL JOB QUEUE
-- Async job tracking for browser/long-running skills
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skill_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id        UUID NOT NULL REFERENCES skills(id),
  workflow_run_id UUID REFERENCES workflow_runs(id),
  client_id       UUID REFERENCES clients(id),
  status          TEXT CHECK (status IN ('queued','running','completed','failed','retrying')) DEFAULT 'queued',
  input           JSONB DEFAULT '{}',
  output          JSONB DEFAULT '{}',
  error           TEXT,
  screenshot_url  TEXT,                         -- saved on failure for browser skills
  attempts        INTEGER DEFAULT 0,
  max_attempts    INTEGER DEFAULT 3,
  queued_at       TIMESTAMPTZ DEFAULT now(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_skill_jobs_status ON skill_jobs(status);
CREATE INDEX IF NOT EXISTS idx_skill_jobs_workflow_run_id ON skill_jobs(workflow_run_id);

-- ────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGER (auto-maintain updated_at on all tables)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['clients','skills','templates','workflows','workflow_runs','deals','tasks'] LOOP
    EXECUTE format('
      CREATE TRIGGER trg_%s_updated_at
      BEFORE UPDATE ON %s
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    ', t, t);
  END LOOP;
END;
$$;
