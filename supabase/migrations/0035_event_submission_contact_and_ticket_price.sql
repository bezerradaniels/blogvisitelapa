-- =====================================================================
-- Conecta Lapa — 0035 — WhatsApp e valor de ingresso nos eventos
-- =====================================================================

alter table public.event_submissions
  add column if not exists submitter_whatsapp text,
  add column if not exists event_ticket_price text;

alter table public.posts
  add column if not exists event_ticket_price text;

alter table public.event_submissions
  add constraint event_submissions_whatsapp_check
  check (submitter_whatsapp is null or submitter_whatsapp ~ '^\\d{11}$');
