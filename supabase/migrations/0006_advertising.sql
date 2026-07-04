-- =====================================================================
-- Visite Lapa — 0006 — Publicidade: contratos, criativos, métricas, patrocínios
-- =====================================================================

-- ---------------------------------------------------------------------
-- ad_contracts — contratos manuais de publicidade (recurso central)
-- ---------------------------------------------------------------------
create table if not exists public.ad_contracts (
  id               uuid primary key default gen_random_uuid(),
  contract_type    text,                       -- ex.: banner, publieditorial, patrocínio
  ad_type          text,                       -- descrição do tipo de anúncio
  title            text not null,
  client_id        uuid references public.commercial_clients(id) on delete set null,
  company_name     text,
  start_date       date not null,
  end_date         date not null,
  negotiated_value numeric(12,2),
  payment_method   text,
  payment_status   payment_status not null default 'pendente',
  payment_notes    text,
  internal_notes   text,
  placement        ad_placement not null,
  banner_url       text,                       -- criativo principal
  link_url         text,                       -- destino do clique
  status           ad_contract_status not null default 'rascunho',
  priority         int not null default 0,     -- maior = exibido primeiro
  renewal_enabled  boolean not null default false,
  created_by       uuid references public.profiles(id) on delete set null,
  updated_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (end_date >= start_date)
);
create index if not exists ad_contracts_active_idx
  on public.ad_contracts (placement, status, start_date, end_date, priority desc);
create index if not exists ad_contracts_client_idx on public.ad_contracts (client_id);
create index if not exists ad_contracts_end_date_idx on public.ad_contracts (end_date);

drop trigger if exists trg_ad_contracts_updated on public.ad_contracts;
create trigger trg_ad_contracts_updated before update on public.ad_contracts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- ad_assets — criativos adicionais de um contrato (variações/tamanhos)
-- ---------------------------------------------------------------------
create table if not exists public.ad_assets (
  id          uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.ad_contracts(id) on delete cascade,
  image_url   text not null,
  alt         text,
  width       int,
  height      int,
  created_at  timestamptz not null default now()
);
create index if not exists ad_assets_contract_idx on public.ad_assets (contract_id);

-- ---------------------------------------------------------------------
-- contract_history — histórico de mudanças/ações do contrato
-- ---------------------------------------------------------------------
create table if not exists public.contract_history (
  id          uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.ad_contracts(id) on delete cascade,
  action      text not null,     -- criado, ativado, pausado, expirado, renovado...
  notes       text,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists contract_history_contract_idx on public.contract_history (contract_id, created_at desc);

-- ---------------------------------------------------------------------
-- ad_impressions / ad_clicks — métricas (com UTM opcional)
-- ---------------------------------------------------------------------
create table if not exists public.ad_impressions (
  id          uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.ad_contracts(id) on delete cascade,
  placement   ad_placement not null,
  utm         jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists ad_impressions_contract_idx on public.ad_impressions (contract_id, created_at);

create table if not exists public.ad_clicks (
  id          uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.ad_contracts(id) on delete cascade,
  placement   ad_placement not null,
  utm         jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists ad_clicks_contract_idx on public.ad_clicks (contract_id, created_at);

-- ---------------------------------------------------------------------
-- sponsored_articles / sponsored_events — vínculo de patrocínio a posts
-- ---------------------------------------------------------------------
create table if not exists public.sponsored_articles (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.posts(id) on delete cascade,
  contract_id  uuid references public.ad_contracts(id) on delete set null,
  client_id    uuid references public.commercial_clients(id) on delete set null,
  label        text not null default 'Conteúdo patrocinado',
  start_date   date,
  end_date     date,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists sponsored_articles_post_idx on public.sponsored_articles (post_id);

drop trigger if exists trg_sponsored_articles_updated on public.sponsored_articles;
create trigger trg_sponsored_articles_updated before update on public.sponsored_articles
  for each row execute function public.set_updated_at();

create table if not exists public.sponsored_events (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.posts(id) on delete cascade,
  contract_id  uuid references public.ad_contracts(id) on delete set null,
  client_id    uuid references public.commercial_clients(id) on delete set null,
  label        text not null default 'Evento patrocinado',
  start_date   date,
  end_date     date,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists sponsored_events_post_idx on public.sponsored_events (post_id);

drop trigger if exists trg_sponsored_events_updated on public.sponsored_events;
create trigger trg_sponsored_events_updated before update on public.sponsored_events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- standalone_products — produtos comerciais avulsos
-- ---------------------------------------------------------------------
create table if not exists public.standalone_products (
  id              uuid primary key default gen_random_uuid(),
  product_name    text not null,
  description     text,
  price           numeric(12,2),
  client_id       uuid references public.commercial_clients(id) on delete set null,
  company_name    text,
  payment_method  text,
  payment_status  payment_status not null default 'pendente',
  delivery_status delivery_status not null default 'pendente',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists standalone_products_client_idx on public.standalone_products (client_id);

drop trigger if exists trg_standalone_products_updated on public.standalone_products;
create trigger trg_standalone_products_updated before update on public.standalone_products
  for each row execute function public.set_updated_at();
