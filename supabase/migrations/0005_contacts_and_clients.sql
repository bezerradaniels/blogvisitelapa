-- =====================================================================
-- Visite Lapa — 0005 — Contatos, anunciantes e clientes comerciais (CRM)
-- =====================================================================

-- ---------------------------------------------------------------------
-- contacts — contato público geral
-- ---------------------------------------------------------------------
create table if not exists public.contacts (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  whatsapp   text,
  subject    text,
  message    text not null,
  status     contact_status not null default 'novo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contacts_status_idx on public.contacts (status, created_at desc);

drop trigger if exists trg_contacts_updated on public.contacts;
create trigger trg_contacts_updated before update on public.contacts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- advertiser_contacts — leads de anunciantes
-- ---------------------------------------------------------------------
create table if not exists public.advertiser_contacts (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  company_name  text,
  segment       text,
  email         text not null,
  whatsapp      text,
  ad_type       text,        -- tipo de anúncio desejado
  budget_range  text,        -- faixa de orçamento
  message       text,
  status        contact_status not null default 'novo',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists advertiser_contacts_status_idx on public.advertiser_contacts (status, created_at desc);

drop trigger if exists trg_advertiser_contacts_updated on public.advertiser_contacts;
create trigger trg_advertiser_contacts_updated before update on public.advertiser_contacts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- commercial_clients — cadastro comercial
-- ---------------------------------------------------------------------
create table if not exists public.commercial_clients (
  id           uuid primary key default gen_random_uuid(),
  client_name  text not null,
  company_name text,
  segment      text,
  email        text,
  whatsapp     text,
  document     text,        -- CPF/CNPJ
  notes        text,
  status       commercial_status not null default 'prospecto',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists commercial_clients_status_idx on public.commercial_clients (status);

drop trigger if exists trg_commercial_clients_updated on public.commercial_clients;
create trigger trg_commercial_clients_updated before update on public.commercial_clients
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- client_history — histórico estilo CRM por cliente
-- ---------------------------------------------------------------------
create table if not exists public.client_history (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.commercial_clients(id) on delete cascade,
  entry_type text not null default 'nota',   -- nota, contato, contrato, pagamento
  title      text,
  content    text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists client_history_client_idx on public.client_history (client_id, created_at desc);
