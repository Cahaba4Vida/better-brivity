create extension if not exists pgcrypto;

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_phone text,
  owner_email text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  role text not null default 'agent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  assigned_agent_id uuid references users(id) on delete set null,
  name text,
  phone text,
  email text,
  source text not null default 'manual',
  buyer_or_seller text not null default 'unknown',
  stage text not null default 'new',
  status text not null default 'active',
  location text,
  price_min numeric,
  price_max numeric,
  notes text,
  last_contacted_at timestamptz,
  last_inbound_at timestamptz,
  next_follow_up_at timestamptz,
  sms_consent_status text not null default 'unknown',
  email_consent_status text not null default 'unknown',
  automation_enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_team_due_idx on leads(team_id, automation_enabled, status, next_follow_up_at);
create index if not exists leads_team_phone_idx on leads(team_id, phone);
create index if not exists leads_team_email_idx on leads(team_id, email);

create table if not exists lead_events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  event_type text not null,
  summary text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists consent_events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  channel text not null,
  status text not null,
  source text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  channel text not null,
  direction text not null,
  provider text,
  provider_message_id text,
  subject text,
  body text not null,
  status text not null default 'draft',
  failure_reason text,
  ai_generated boolean not null default false,
  requires_human_review boolean not null default true,
  approved_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  idempotency_key text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists messages_team_status_idx on messages(team_id, status, created_at desc);
create index if not exists messages_lead_idx on messages(lead_id, created_at desc);

create table if not exists automation_runs (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  run_type text not null default 'manual',
  status text not null default 'running',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  summary jsonb not null default '{}'::jsonb,
  created_by uuid references users(id) on delete set null
);

create table if not exists ai_decisions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  run_id uuid references automation_runs(id) on delete set null,
  recommended_action text not null,
  confidence numeric,
  requires_human_review boolean not null default true,
  risk_flags jsonb not null default '[]'::jsonb,
  reason text,
  decision jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  type text not null default 'review',
  status text not null default 'open',
  title text not null,
  description text,
  priority text not null default 'normal',
  due_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_team_status_idx on tasks(team_id, status, due_at nulls first);

create table if not exists document_templates (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  provider text not null default 'docusign',
  provider_template_id text,
  name text not null,
  document_type text not null,
  required_fields jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists signing_requests (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  provider text not null default 'docusign',
  provider_request_id text,
  document_type text not null,
  status text not null default 'draft',
  subject text,
  message text,
  payload jsonb not null default '{}'::jsonb,
  missing_fields jsonb not null default '[]'::jsonb,
  ai_summary text,
  requires_human_review boolean not null default true,
  signing_url text,
  sent_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists signing_requests_team_status_idx on signing_requests(team_id, status, created_at desc);

create table if not exists signing_recipients (
  id uuid primary key default gen_random_uuid(),
  signing_request_id uuid not null references signing_requests(id) on delete cascade,
  role text not null,
  name text not null,
  email text,
  phone text,
  provider_recipient_id text,
  status text not null default 'pending',
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists signing_events (
  id uuid primary key default gen_random_uuid(),
  signing_request_id uuid references signing_requests(id) on delete set null,
  provider text not null,
  provider_event_id text,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists signed_documents (
  id uuid primary key default gen_random_uuid(),
  signing_request_id uuid not null references signing_requests(id) on delete cascade,
  file_name text not null,
  storage_key text not null,
  provider_document_id text,
  document_hash text,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  actor_user_id uuid references users(id) on delete set null,
  actor_type text not null default 'system',
  action text not null,
  entity_type text,
  entity_id uuid,
  summary text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_team_created_idx on audit_log(team_id, created_at desc);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists teams_set_updated_at on teams;
create trigger teams_set_updated_at before update on teams for each row execute function set_updated_at();

drop trigger if exists users_set_updated_at on users;
create trigger users_set_updated_at before update on users for each row execute function set_updated_at();

drop trigger if exists leads_set_updated_at on leads;
create trigger leads_set_updated_at before update on leads for each row execute function set_updated_at();

drop trigger if exists messages_set_updated_at on messages;
create trigger messages_set_updated_at before update on messages for each row execute function set_updated_at();

drop trigger if exists tasks_set_updated_at on tasks;
create trigger tasks_set_updated_at before update on tasks for each row execute function set_updated_at();

drop trigger if exists document_templates_set_updated_at on document_templates;
create trigger document_templates_set_updated_at before update on document_templates for each row execute function set_updated_at();

drop trigger if exists signing_requests_set_updated_at on signing_requests;
create trigger signing_requests_set_updated_at before update on signing_requests for each row execute function set_updated_at();

drop trigger if exists signing_recipients_set_updated_at on signing_recipients;
create trigger signing_recipients_set_updated_at before update on signing_recipients for each row execute function set_updated_at();
