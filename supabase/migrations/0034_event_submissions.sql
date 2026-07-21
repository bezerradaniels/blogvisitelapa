-- =====================================================================
-- Conecta Lapa — 0034 — Envios públicos de eventos para moderação
-- =====================================================================

create table if not exists public.event_submissions (
  id                   uuid primary key default gen_random_uuid(),
  submitter_profile_id uuid references public.profiles(id) on delete set null,
  submitter_name       text,
  submitter_email      text,
  title                text not null check (char_length(btrim(title)) between 3 and 160),
  description          text not null check (char_length(btrim(description)) between 10 and 5000),
  event_start_date     timestamptz not null,
  event_end_date       timestamptz,
  event_location       text not null check (char_length(btrim(event_location)) between 2 and 160),
  event_address        text,
  event_ticket_url     text,
  event_organizer      text not null check (char_length(btrim(event_organizer)) between 2 and 160),
  event_is_free        boolean not null default false,
  status               moderation_status not null default 'pendente',
  reviewer_note        text,
  reviewed_by          uuid references public.profiles(id) on delete set null,
  reviewed_at          timestamptz,
  published_post_id    uuid references public.posts(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint event_submissions_dates_check
    check (event_end_date is null or event_end_date >= event_start_date),
  constraint event_submissions_contact_check
    check (
      submitter_profile_id is not null
      or (char_length(btrim(coalesce(submitter_name, ''))) >= 2
          and submitter_email ~* '^[^@[:space:]]+@[^@[:space:]]+\\.[^@[:space:]]+$')
    )
);

create index if not exists event_submissions_status_created_idx
  on public.event_submissions (status, created_at desc);
create index if not exists event_submissions_submitter_idx
  on public.event_submissions (submitter_profile_id, created_at desc);

drop trigger if exists trg_event_submissions_updated on public.event_submissions;
create trigger trg_event_submissions_updated before update on public.event_submissions
  for each row execute function public.set_updated_at();

alter table public.event_submissions enable row level security;

-- A criação é feita somente pela Server Action, usando service role. Assim a
-- tabela não fica gravável diretamente pelo navegador, inclusive para visitantes.
create policy event_submissions_admin_all on public.event_submissions
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy event_submissions_owner_read on public.event_submissions
  for select to authenticated
  using (submitter_profile_id = (select public.current_profile_id()));

revoke all on table public.event_submissions from anon, authenticated;
grant select, update on table public.event_submissions to authenticated;
