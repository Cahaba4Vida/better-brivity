insert into teams (id, name, owner_phone, owner_email, settings)
values (
  '00000000-0000-0000-0000-000000000001',
  'Demo Real Estate Team',
  '+15555555555',
  'agent@example.com',
  '{"timezone":"America/Los_Angeles","business_hours":{"start":"08:00","end":"18:00"}}'::jsonb
)
on conflict (id) do update set name = excluded.name, updated_at = now();

insert into users (id, team_id, name, email, phone, role)
values (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Demo Agent',
  'agent@example.com',
  '+15555555555',
  'owner'
)
on conflict (id) do update set name = excluded.name, updated_at = now();

insert into document_templates (id, team_id, provider, provider_template_id, name, document_type, required_fields)
values (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000001',
  'docusign',
  null,
  'Basic Buyer Agreement Review Packet',
  'buyer_agreement',
  '["lead.name","lead.email"]'::jsonb
)
on conflict (id) do update set name = excluded.name, updated_at = now();

insert into leads (id, team_id, name, phone, email, source, buyer_or_seller, stage, status, location, notes, sms_consent_status, email_consent_status, next_follow_up_at)
values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', 'Sarah Johnson', '+15555550101', 'sarah@example.com', 'manual', 'buyer', 'new', 'active', 'Meridian, ID', 'Looking under $500k. Asked about weekend showings.', 'opted_in', 'opted_in', now()),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000001', 'Mike Chen', '+15555550102', 'mike@example.com', 'manual', 'seller', 'new', 'active', 'Boise, ID', 'Considering listing in 60 days.', 'unknown', 'opted_in', now()),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000001', 'Priya Patel', '+15555550103', 'priya@example.com', 'open_house', 'buyer', 'nurture', 'active', 'Nampa, ID', 'Liked 3-bedroom homes. Has not replied in 4 days.', 'opted_in', 'opted_in', now())
on conflict (id) do update set next_follow_up_at = excluded.next_follow_up_at, updated_at = now();
