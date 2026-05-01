-- ================================================================
-- Seed: Built-in skills and starter templates
-- Run via: npm run db:seed
-- ================================================================

-- ────────────────────────────────────────────────────────────
-- BUILT-IN SKILLS
-- ────────────────────────────────────────────────────────────
INSERT INTO skills (name, slug, type, description, config, is_builtin) VALUES

('Send email via Resend', 'send-email-resend', 'email',
 'Send a templated email using Resend API',
 '{"provider":"resend","requires":["to_email","subject","body"]}', true),

('Send iMessage via Bluesend', 'send-imessage-bluesend', 'sms',
 'Send an iMessage to a client phone number',
 '{"provider":"bluesend","requires":["to_phone","body"]}', true),

('Send SMS via Twilio', 'send-sms-twilio', 'sms',
 'SMS fallback for non-iMessage recipients',
 '{"provider":"twilio","requires":["to_phone","body"]}', true),

('Send DocuSign envelope', 'send-docusign-envelope', 'document',
 'Generate PDF from template and send for e-signature via DocuSign',
 '{"provider":"docusign","requires":["to_email","to_name","template_id","variables"]}', true),

('AI draft message', 'ai-draft-message', 'ai_generate',
 'Use Ollama to draft a personalized email or text from a prompt and client context',
 '{"model":"ollama","requires":["prompt","client_id"]}', true),

('AI extract client info', 'ai-extract-client-info', 'ai_generate',
 'Parse a conversation and extract structured fields into captured_fields',
 '{"model":"ollama","requires":["client_id","conversation_text"]}', true),

('AI generate listing description', 'ai-listing-description', 'ai_generate',
 'Generate MLS listing description from agent notes and photo descriptions',
 '{"model":"ollama","requires":["notes","features","photos_description"]}', true),

('AI generate social posts', 'ai-social-posts', 'ai_generate',
 'Create Facebook, Instagram, and LinkedIn posts for a new listing',
 '{"model":"ollama","requires":["property_address","listing_description","list_price"]}', true),

('Condition: check if field exists', 'condition-field-exists', 'condition',
 'Branch workflow based on whether a client field has been captured',
 '{"requires":["field_name"]}', true),

('Delay: wait N minutes', 'delay-minutes', 'delay',
 'Pause workflow execution for a configurable number of minutes',
 '{"requires":["minutes"]}', true),

('Delay: wait until date', 'delay-until-date', 'delay',
 'Pause workflow until a specific date/time (e.g. listing go-live date)',
 '{"requires":["target_date"]}', true)

ON CONFLICT (slug) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- STARTER TEMPLATES
-- ────────────────────────────────────────────────────────────
INSERT INTO templates (name, type, subject, body, variables) VALUES

('New buyer welcome text', 'sms', NULL,
'Hi {{client_name}}! This is Zack''s assistant at [Brokerage]. Thanks for reaching out about buying a home. I''m going to help get you connected with Zack and make sure we find exactly what you''re looking for. Reply STOP anytime to opt out.',
'["client_name"]'),

('New seller welcome text', 'sms', NULL,
'Hi {{client_name}}! This is Zack''s assistant. I''d love to help you get your home at {{property_address}} sold for top dollar. Let me ask you a few quick questions to get started. Reply STOP to opt out.',
'["client_name","property_address"]'),

('Showing confirmation text', 'sms', NULL,
'Hi {{client_name}}! Your showing at {{property_address}} is confirmed for {{showing_date}} at {{showing_time}}. Zack will meet you there. Questions? Just reply here.',
'["client_name","property_address","showing_date","showing_time"]'),

('Offer submitted text', 'sms', NULL,
'Great news {{client_name}} — Zack just submitted your offer on {{property_address}} for {{offer_price}}. We''ll hear back by {{response_deadline}}. I''ll keep you posted the moment we get a response!',
'["client_name","property_address","offer_price","response_deadline"]'),

('Under contract congrats text', 'sms', NULL,
'Congrats {{client_name}}! Your offer was ACCEPTED on {{property_address}}! Your inspection deadline is {{inspection_deadline}} and closing is set for {{close_date}}. Zack will be in touch with next steps.',
'["client_name","property_address","inspection_deadline","close_date"]'),

('Listing live announcement email', 'email',
'Your home at {{property_address}} is officially LIVE!',
'Hi {{client_name}},

Great news — your listing at {{property_address}} is now live on the MLS!

Here''s the summary:
• List Price: {{list_price}}
• MLS #: {{mls_number}}
• Listing Link: {{listing_url}}

{{listing_description}}

Zack and his team are already working to get maximum exposure. We''ll send you showing feedback as it comes in.

Questions? Reply to this email or text Zack directly.

— Zack''s Team',
'["client_name","property_address","list_price","mls_number","listing_url","listing_description"]'),

('Buyer hot property alert email', 'email',
'New listing that matches your search: {{property_address}}',
'Hi {{client_name}},

A new property just hit the market that matches what you''re looking for:

📍 {{property_address}}
💰 {{list_price}}
🛏 {{bedrooms}} bed / {{bathrooms}} bath
📐 {{square_feet}} sq ft

{{property_description}}

Want to schedule a showing? Just reply to this email or text us back and we''ll get you in ASAP — homes like this move fast.

— Zack''s Team',
'["client_name","property_address","list_price","bedrooms","bathrooms","square_feet","property_description"]'),

('Counter offer cover text', 'sms', NULL,
'Hi {{other_agent_name}}, Zack here. Just sent over a counter on {{property_address}} — counter price is {{counter_price}}, responding to your {{their_offer_price}} offer. Check your DocuSign. Good until {{expiration}}.',
'["other_agent_name","property_address","counter_price","their_offer_price","expiration"]'),

('Closing reminder text', 'sms', NULL,
'Hey {{client_name}}! Just a reminder — closing on {{property_address}} is in {{days_until_close}} days on {{close_date}}. Make sure your wire transfer is ready and bring a valid ID. Zack will see you there!',
'["client_name","property_address","days_until_close","close_date"]'),

('Post-close thank you text', 'sms', NULL,
'Congrats {{client_name}} — you are officially a homeowner! 🎉 It was a pleasure working with you on {{property_address}}. If you ever need anything or know someone buying or selling, Zack would love to help. Thanks for trusting us!',
'["client_name","property_address"]')

ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- STARTER WORKFLOWS
-- ────────────────────────────────────────────────────────────
INSERT INTO workflows (name, slug, description, trigger, steps) VALUES

('Buyer intake', 'buyer-intake', 'Triggered when AI determines client wants to buy', 'intake_complete',
'[
  {"id":"step-1","name":"Send welcome text","skill_slug":"send-imessage-bluesend","template":"new-buyer-welcome-text","parallel":false},
  {"id":"step-2","name":"Draft follow-up questions","skill_slug":"ai-draft-message","prompt":"Ask the buyer their budget, preferred zip codes, and timeline","parallel":false},
  {"id":"step-3","name":"Create buyer task","skill_slug":"condition-field-exists","field":"budget","on_true":"step-4","on_false":"step-2"},
  {"id":"step-4","name":"Notify Zack","skill_slug":"send-imessage-bluesend","to":"zack","message":"New qualified buyer: {{client_name}}, budget {{budget}}, looking in {{zip_codes}}","parallel":false}
]'),

('Listing launch', 'listing-launch', 'Full listing launch sequence from notes to live', 'manual',
'[
  {"id":"step-1","name":"Generate listing description","skill_slug":"ai-listing-description","parallel":false},
  {"id":"step-2a","name":"Upload to Navica MLS","skill_slug":"browser-navica-upload","parallel":true},
  {"id":"step-2b","name":"Email buyer list","skill_slug":"send-email-resend","template":"listing-live-announcement-email","parallel":true},
  {"id":"step-2c","name":"Text hot buyers","skill_slug":"send-imessage-bluesend","template":"buyer-hot-property-alert-email","parallel":true},
  {"id":"step-3","name":"Generate social posts","skill_slug":"ai-social-posts","parallel":false},
  {"id":"step-4","name":"Notify Zack listing is live","skill_slug":"send-imessage-bluesend","to":"zack","message":"Listing live: {{property_address}} — MLS# {{mls_number}}","parallel":false}
]'),

('Offer workflow', 'offer-workflow', 'From offer submission through acceptance or counter', 'manual',
'[
  {"id":"step-1","name":"Draft offer docs","skill_slug":"ai-draft-message","prompt":"Draft purchase agreement summary for {{property_address}} at {{offer_price}}","parallel":false},
  {"id":"step-2","name":"Send for signature","skill_slug":"send-docusign-envelope","parallel":false},
  {"id":"step-3","name":"Text client offer submitted","skill_slug":"send-imessage-bluesend","template":"offer-submitted-text","parallel":false},
  {"id":"step-4","name":"Wait for response","skill_slug":"delay-until-date","target":"response_deadline","parallel":false},
  {"id":"step-5","name":"Follow up if no response","skill_slug":"ai-draft-message","prompt":"Follow up on offer submitted for {{property_address}}","parallel":false}
]')

ON CONFLICT (slug) DO NOTHING;
