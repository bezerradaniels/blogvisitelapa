-- =====================================================================
-- Visite Lapa — 0031 — Comercial unificado
--
-- Migração ADITIVA: preserva contratos, anúncios, patrocínios e produtos
-- legados. ad_contracts passa a representar o acordo comercial; campanhas,
-- itens, parcelas e arquivos vivem em tabelas próprias.
-- =====================================================================

-- Estados adicionais mantêm compatibilidade com o enum legado.
alter type public.ad_contract_status add value if not exists 'pendente_aprovacao';
alter type public.ad_contract_status add value if not exists 'aprovado';
alter type public.ad_contract_status add value if not exists 'concluido';

-- ---------------------------------------------------------------------
-- Clientes e marcas
-- ---------------------------------------------------------------------
alter table public.commercial_clients
  add column if not exists client_type text not null default 'empresa',
  add column if not exists legal_name text,
  add column if not exists trade_name text,
  add column if not exists primary_contact_name text,
  add column if not exists billing_email text,
  add column if not exists website text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists postal_code text,
  add column if not exists is_active boolean not null default true,
  add column if not exists archived_at timestamptz;

update public.commercial_clients
set
  legal_name = coalesce(legal_name, company_name, client_name),
  trade_name = coalesce(trade_name, company_name, client_name),
  is_active = case when status = 'inativo' then false else is_active end
where legal_name is null or trade_name is null or status = 'inativo';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'commercial_clients_type_check'
      and conrelid = 'public.commercial_clients'::regclass
  ) then
    alter table public.commercial_clients add constraint commercial_clients_type_check
      check (client_type in ('pessoa_fisica', 'empresa', 'agencia', 'instituicao_publica'));
  end if;
end $$;

-- Dados legados podem conter CPF/CNPJ ou e-mail duplicados. Criar um índice
-- único incondicional aqui interromperia a migração e não preservaria os
-- registros. Mantemos índices de busca sempre disponíveis e criamos a
-- garantia única somente quando a base já estiver consistente.
create index if not exists commercial_clients_document_normalized_idx
  on public.commercial_clients (regexp_replace(document, '[^0-9]', '', 'g'))
  where document is not null and regexp_replace(document, '[^0-9]', '', 'g') <> '';
create index if not exists commercial_clients_email_normalized_idx
  on public.commercial_clients (lower(btrim(email)))
  where email is not null and btrim(email) <> '';

do $$
begin
  if not exists (
    select 1
    from public.commercial_clients
    where document is not null
      and regexp_replace(document, '[^0-9]', '', 'g') <> ''
    group by regexp_replace(document, '[^0-9]', '', 'g')
    having count(*) > 1
  ) then
    execute 'create unique index if not exists commercial_clients_document_unique_idx
      on public.commercial_clients (regexp_replace(document, ''[^0-9]'', '''', ''g''))
      where document is not null and regexp_replace(document, ''[^0-9]'', '''', ''g'') <> ''''';
  else
    raise notice 'Índice único de documento não criado: há documentos duplicados em commercial_clients.';
  end if;

  if not exists (
    select 1
    from public.commercial_clients
    where email is not null and btrim(email) <> ''
    group by lower(btrim(email))
    having count(*) > 1
  ) then
    execute 'create unique index if not exists commercial_clients_email_unique_idx
      on public.commercial_clients (lower(btrim(email)))
      where email is not null and btrim(email) <> ''''';
  else
    raise notice 'Índice único de e-mail não criado: há e-mails duplicados em commercial_clients.';
  end if;
end $$;
create index if not exists commercial_clients_name_search_idx
  on public.commercial_clients (lower(coalesce(trade_name, client_name)));

create table if not exists public.commercial_brands (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.commercial_clients(id) on delete restrict,
  name           text not null,
  logo_url       text,
  website        text,
  contact_name   text,
  contact_email  text,
  contact_phone  text,
  notes          text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (client_id, name)
);
create index if not exists commercial_brands_client_idx on public.commercial_brands (client_id, is_active);

drop trigger if exists trg_commercial_brands_updated on public.commercial_brands;
create trigger trg_commercial_brands_updated before update on public.commercial_brands
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Catálogo de produtos e inventário de posições
-- ---------------------------------------------------------------------
create table if not exists public.advertising_placements (
  id                    uuid primary key default gen_random_uuid(),
  code                  public.ad_placement not null unique,
  name                  text not null,
  page_context          text not null,
  position              text not null,
  desktop_dimensions    text,
  mobile_dimensions     text,
  accepted_formats      text[] not null default array['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  maximum_file_size     integer not null default 5242880 check (maximum_file_size > 0),
  maximum_active_items  integer not null default 1 check (maximum_active_items > 0),
  rotation_enabled      boolean not null default false,
  is_active             boolean not null default true,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

insert into public.advertising_placements
  (code, name, page_context, position, desktop_dimensions, mobile_dimensions, maximum_active_items, rotation_enabled)
values
  ('home_top', 'Home — topo', 'home', 'topo', '728x90', '320x50', 1, false),
  ('home_middle', 'Home — meio', 'home', 'meio', '728x90', '320x100', 1, false),
  ('home_carousel', 'Home — carrossel', 'home', 'carrossel', '1200x500', '320x320', 3, true),
  ('post_sidebar', 'Post — sidebar', 'post', 'sidebar', '300x300', null, 3, true),
  ('post_inline_mobile', 'Post — mobile', 'post', 'topo_mobile', null, '728x90', 1, false),
  ('category_top', 'Categoria — topo', 'categoria', 'topo', '728x90', '320x100', 1, false),
  ('event_sidebar', 'Evento — sidebar', 'evento', 'sidebar', '300x300', null, 2, true),
  ('fixed_carousel_sponsor', 'Patrocínio do carrossel', 'home', 'carrossel_fixo', '300x300', '300x300', 1, false)
on conflict (code) do nothing;

drop trigger if exists trg_advertising_placements_updated on public.advertising_placements;
create trigger trg_advertising_placements_updated before update on public.advertising_placements
  for each row execute function public.set_updated_at();

create table if not exists public.commercial_products (
  id                       uuid primary key default gen_random_uuid(),
  name                     text not null,
  slug                     text not null unique,
  product_type             text not null default 'servico',
  description              text,
  default_price            numeric(12,2) not null default 0 check (default_price >= 0),
  billing_model            text not null default 'valor_fixo',
  default_duration_days    integer check (default_duration_days is null or default_duration_days > 0),
  placement_id             uuid references public.advertising_placements(id) on delete set null,
  requires_media_upload    boolean not null default false,
  requires_destination_url boolean not null default false,
  requires_content_creation boolean not null default false,
  is_recurring             boolean not null default false,
  is_active                boolean not null default true,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  check (product_type in ('banner', 'conteudo_patrocinado', 'evento_patrocinado', 'social', 'newsletter', 'guia', 'servico', 'pacote', 'customizado')),
  check (billing_model in ('valor_fixo', 'diario', 'semanal', 'mensal', 'publicacao', 'impressao', 'clique', 'negociado'))
);
create index if not exists commercial_products_active_idx on public.commercial_products (is_active, product_type);
create index if not exists commercial_products_placement_idx
  on public.commercial_products (placement_id) where placement_id is not null;

drop trigger if exists trg_commercial_products_updated on public.commercial_products;
create trigger trg_commercial_products_updated before update on public.commercial_products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Contrato: expansão compatível do registro legado
-- ---------------------------------------------------------------------
alter table public.ad_contracts
  alter column placement drop not null,
  add column if not exists contract_number text,
  add column if not exists description text,
  add column if not exists advertiser_id uuid references public.commercial_brands(id) on delete set null,
  add column if not exists subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  add column if not exists contract_discount_type text,
  add column if not exists contract_discount_value numeric(12,2) not null default 0 check (contract_discount_value >= 0),
  add column if not exists additional_costs numeric(12,2) not null default 0 check (additional_costs >= 0),
  add column if not exists total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  add column if not exists payment_terms text,
  add column if not exists installment_count integer not null default 1 check (installment_count > 0),
  add column if not exists billing_due_date date,
  add column if not exists renewal_period_days integer check (renewal_period_days is null or renewal_period_days > 0),
  add column if not exists renewal_notice_days integer not null default 30 check (renewal_notice_days >= 0),
  add column if not exists client_notes text,
  add column if not exists contract_file_url text,
  add column if not exists approved_by uuid references public.profiles(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists previous_contract_id uuid references public.ad_contracts(id) on delete restrict,
  add column if not exists archived_at timestamptz,
  add column if not exists currency char(3) not null default 'BRL';

update public.ad_contracts
set contract_number = 'LEG-' || to_char(created_at at time zone 'America/Bahia', 'YYYYMMDD') || '-' || upper(substr(replace(id::text, '-', ''), 1, 8))
where contract_number is null;

update public.ad_contracts
set
  subtotal = coalesce(negotiated_value, 0),
  total_amount = coalesce(negotiated_value, 0)
where subtotal = 0 and total_amount = 0;

create unique index if not exists ad_contracts_contract_number_unique_idx
  on public.ad_contracts (contract_number) where contract_number is not null;

-- A sequência evita corrida entre dois operadores criando contratos ao mesmo
-- tempo. Os números LEG- acima continuam intactos; apenas novos contratos
-- recebem o formato COM-AAAA-000001.
create sequence if not exists public.commercial_contract_number_seq as bigint start with 1 minvalue 1;

do $$
declare
  v_last bigint;
begin
  select max((regexp_match(contract_number, '^COM-[0-9]{4}-([0-9]+)$'))[1]::bigint)
    into v_last
  from public.ad_contracts
  where contract_number ~ '^COM-[0-9]{4}-[0-9]+$';

  if v_last is not null then
    perform setval('public.commercial_contract_number_seq', v_last, true);
  end if;
end $$;

create or replace function public.assign_commercial_contract_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.contract_number is null or btrim(new.contract_number) = '' then
    new.contract_number :=
      'COM-' || to_char(timezone('America/Bahia', now()), 'YYYY') || '-' ||
      lpad(nextval('public.commercial_contract_number_seq'::regclass)::text, 6, '0');
  end if;
  return new;
end;
$$;

revoke all on function public.assign_commercial_contract_number() from public, anon, authenticated;
drop trigger if exists trg_ad_contracts_contract_number on public.ad_contracts;
create trigger trg_ad_contracts_contract_number
  before insert on public.ad_contracts
  for each row execute function public.assign_commercial_contract_number();

create index if not exists ad_contracts_status_dates_idx
  on public.ad_contracts (status, start_date, end_date);
create index if not exists ad_contracts_advertiser_idx on public.ad_contracts (advertiser_id);
create index if not exists ad_contracts_previous_idx on public.ad_contracts (previous_contract_id) where previous_contract_id is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'ad_contracts_discount_type_check'
      and conrelid = 'public.ad_contracts'::regclass
  ) then
    alter table public.ad_contracts add constraint ad_contracts_discount_type_check
      check (contract_discount_type is null or contract_discount_type in ('valor', 'percentual'));
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Itens, campanhas, recebíveis e arquivos
-- ---------------------------------------------------------------------
create table if not exists public.contract_items (
  id                        uuid primary key default gen_random_uuid(),
  contract_id               uuid not null references public.ad_contracts(id) on delete restrict,
  product_id                uuid references public.commercial_products(id) on delete set null,
  legacy_source_contract_id uuid unique references public.ad_contracts(id) on delete restrict,
  custom_name               text not null,
  description               text,
  quantity                  numeric(12,2) not null default 1 check (quantity > 0),
  unit_price                numeric(12,2) not null default 0 check (unit_price >= 0),
  discount_amount           numeric(12,2) not null default 0 check (discount_amount >= 0),
  line_total                numeric(12,2) generated always as ((quantity * unit_price) - discount_amount) stored,
  start_date                date,
  end_date                  date,
  placement                 public.ad_placement,
  placement_id              uuid references public.advertising_placements(id) on delete set null,
  requires_media_upload     boolean not null default false,
  requires_content_creation boolean not null default false,
  delivery_status           text not null default 'nao_configurado',
  notes                     text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  check (discount_amount <= quantity * unit_price),
  check (end_date is null or start_date is null or end_date >= start_date),
  check (delivery_status in ('nao_configurado', 'aguardando_materiais', 'pronto', 'agendado', 'em_andamento', 'entregue', 'pausado', 'cancelado'))
);
create index if not exists contract_items_contract_idx on public.contract_items (contract_id, start_date, end_date);
create index if not exists contract_items_product_idx on public.contract_items (product_id) where product_id is not null;
create index if not exists contract_items_placement_idx on public.contract_items (placement, start_date, end_date) where placement is not null;
create index if not exists contract_items_placement_id_idx
  on public.contract_items (placement_id) where placement_id is not null;

drop trigger if exists trg_contract_items_updated on public.contract_items;
create trigger trg_contract_items_updated before update on public.contract_items
  for each row execute function public.set_updated_at();

create table if not exists public.ad_campaigns (
  id                         uuid primary key default gen_random_uuid(),
  contract_id                uuid not null references public.ad_contracts(id) on delete restrict,
  contract_item_id           uuid references public.contract_items(id) on delete set null,
  legacy_contract_id         uuid unique references public.ad_contracts(id) on delete restrict,
  client_id                  uuid references public.commercial_clients(id) on delete set null,
  advertiser_id              uuid references public.commercial_brands(id) on delete set null,
  campaign_name              text not null,
  placement                  public.ad_placement not null,
  placement_id               uuid references public.advertising_placements(id) on delete set null,
  desktop_media_url          text,
  mobile_media_url           text,
  alternative_text           text,
  destination_url            text,
  open_in_new_tab            boolean not null default true,
  start_at                   timestamptz not null,
  end_at                     timestamptz not null,
  priority                   integer not null default 0 check (priority >= 0),
  rotation_weight            integer not null default 1 check (rotation_weight > 0),
  status                     text not null default 'rascunho',
  is_visible                 boolean not null default true,
  click_tracking_enabled     boolean not null default false,
  impression_tracking_enabled boolean not null default false,
  published_at               timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  check (end_at >= start_at),
  check (status in ('rascunho', 'aguardando_midia', 'em_revisao', 'agendada', 'ativa', 'pausada', 'expirada', 'rejeitada', 'cancelada'))
);
create index if not exists ad_campaigns_placement_status_dates_idx
  on public.ad_campaigns (placement, status, start_at, end_at, priority desc);
create index if not exists ad_campaigns_contract_idx on public.ad_campaigns (contract_id, status);
create index if not exists ad_campaigns_item_idx on public.ad_campaigns (contract_item_id) where contract_item_id is not null;
create index if not exists ad_campaigns_client_idx on public.ad_campaigns (client_id) where client_id is not null;
create index if not exists ad_campaigns_advertiser_idx on public.ad_campaigns (advertiser_id) where advertiser_id is not null;
create index if not exists ad_campaigns_placement_id_idx on public.ad_campaigns (placement_id) where placement_id is not null;

drop trigger if exists trg_ad_campaigns_updated on public.ad_campaigns;
create trigger trg_ad_campaigns_updated before update on public.ad_campaigns
  for each row execute function public.set_updated_at();

create table if not exists public.contract_payments (
  id                  uuid primary key default gen_random_uuid(),
  contract_id         uuid not null references public.ad_contracts(id) on delete restrict,
  legacy_contract_id  uuid unique references public.ad_contracts(id) on delete restrict,
  installment_number  integer not null default 1 check (installment_number > 0),
  description         text,
  amount              numeric(12,2) not null check (amount >= 0),
  paid_amount         numeric(12,2) not null default 0 check (paid_amount >= 0 and paid_amount <= amount),
  due_date            date not null,
  paid_at             timestamptz,
  payment_method      text,
  status              text not null default 'pendente',
  transaction_reference text,
  receipt_url         text,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (contract_id, installment_number),
  check (status in ('pendente', 'parcial', 'pago', 'atrasado', 'cancelado', 'estornado'))
);
-- Também cobre instalações que tenham recebido uma versão parcial desta
-- migração antes da tabela ser finalizada.
alter table public.contract_payments
  add column if not exists paid_amount numeric(12,2) not null default 0 check (paid_amount >= 0 and paid_amount <= amount);
create index if not exists contract_payments_contract_idx on public.contract_payments (contract_id, due_date);
create index if not exists contract_payments_status_due_idx on public.contract_payments (status, due_date);
create index if not exists contract_payments_open_due_idx
  on public.contract_payments (due_date, contract_id)
  where status in ('pendente', 'parcial', 'atrasado');

drop trigger if exists trg_contract_payments_updated on public.contract_payments;
create trigger trg_contract_payments_updated before update on public.contract_payments
  for each row execute function public.set_updated_at();

create or replace function public.normalize_contract_payment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'pago' then
    new.paid_amount := new.amount;
    new.paid_at := coalesce(new.paid_at, now());
  elsif new.status = 'pendente' then
    new.paid_amount := 0;
    new.paid_at := null;
  elsif new.status = 'parcial' then
    -- O legado registrava o estado "parcial", mas não o montante recebido.
    -- Para novos recebíveis, zero não é aceito; para a importação, zero
    -- representa explicitamente "valor histórico não informado".
    if new.paid_amount >= new.amount
      or (new.legacy_contract_id is null and new.paid_amount <= 0) then
      raise exception 'Um pagamento parcial deve ter valor maior que zero e menor que a parcela.' using errcode = '23514';
    end if;
    if new.paid_amount > 0 then
      new.paid_at := coalesce(new.paid_at, now());
    end if;
  elsif new.status = 'atrasado' and new.paid_amount >= new.amount then
    raise exception 'Uma parcela totalmente recebida não pode permanecer atrasada.' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.normalize_contract_payment() from public, anon, authenticated;
drop trigger if exists trg_contract_payments_normalize on public.contract_payments;
create trigger trg_contract_payments_normalize
  before insert or update of amount, paid_amount, paid_at, status on public.contract_payments
  for each row execute function public.normalize_contract_payment();

create or replace function public.recalculate_contract_payment_status(p_contract_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total integer := 0;
  v_paid integer := 0;
  v_partial integer := 0;
  v_late integer := 0;
  v_cancelled integer := 0;
  v_status public.payment_status;
begin
  if p_contract_id is null then
    return;
  end if;

  select
    count(*),
    count(*) filter (where status = 'pago'),
    count(*) filter (where status = 'parcial' or (paid_amount > 0 and paid_amount < amount)),
    count(*) filter (where status = 'atrasado'),
    count(*) filter (where status in ('cancelado', 'estornado'))
  into v_total, v_paid, v_partial, v_late, v_cancelled
  from public.contract_payments
  where contract_id = p_contract_id;

  if v_total = 0 then
    return;
  end if;

  v_status := case
    when v_paid = v_total then 'pago'::public.payment_status
    when v_cancelled = v_total then 'cancelado'::public.payment_status
    when v_late > 0 then 'atrasado'::public.payment_status
    when v_paid > 0 or v_partial > 0 then 'parcial'::public.payment_status
    else 'pendente'::public.payment_status
  end;

  update public.ad_contracts
  set payment_status = v_status
  where id = p_contract_id
    and payment_status is distinct from v_status;
end;
$$;

revoke all on function public.recalculate_contract_payment_status(uuid) from public, anon, authenticated;

create or replace function public.trg_recalculate_contract_payment_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.recalculate_contract_payment_status(coalesce(new.contract_id, old.contract_id));
  return coalesce(new, old);
end;
$$;

revoke all on function public.trg_recalculate_contract_payment_status() from public, anon, authenticated;
drop trigger if exists trg_contract_payments_status on public.contract_payments;
create trigger trg_contract_payments_status
  after insert or update or delete on public.contract_payments
  for each row execute function public.trg_recalculate_contract_payment_status();

create table if not exists public.contract_files (
  id            uuid primary key default gen_random_uuid(),
  contract_id   uuid not null references public.ad_contracts(id) on delete restrict,
  file_type     text not null default 'outro',
  file_url      text not null,
  file_name     text,
  uploaded_by   uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  check (file_type in ('contrato_assinado', 'briefing', 'proposta', 'recibo', 'midia', 'outro'))
);
create index if not exists contract_files_contract_idx on public.contract_files (contract_id, created_at desc);
create index if not exists contract_files_uploaded_by_idx on public.contract_files (uploaded_by) where uploaded_by is not null;

alter table public.contract_history
  add column if not exists previous_data jsonb,
  add column if not exists new_data jsonb;
create index if not exists contract_history_created_by_idx on public.contract_history (created_by) where created_by is not null;
create index if not exists client_history_created_by_idx on public.client_history (created_by) where created_by is not null;

-- Métricas passam a poder identificar a campanha, sem perder o vínculo legado.
alter table public.ad_impressions add column if not exists campaign_id uuid references public.ad_campaigns(id) on delete set null;
alter table public.ad_clicks add column if not exists campaign_id uuid references public.ad_campaigns(id) on delete set null;
create index if not exists ad_impressions_campaign_created_idx on public.ad_impressions (campaign_id, created_at) where campaign_id is not null;
create index if not exists ad_clicks_campaign_created_idx on public.ad_clicks (campaign_id, created_at) where campaign_id is not null;

alter table public.sponsored_articles add column if not exists contract_item_id uuid references public.contract_items(id) on delete set null;
alter table public.sponsored_events add column if not exists contract_item_id uuid references public.contract_items(id) on delete set null;
create index if not exists sponsored_articles_contract_idx on public.sponsored_articles (contract_id) where contract_id is not null;
create index if not exists sponsored_articles_client_idx on public.sponsored_articles (client_id) where client_id is not null;
create index if not exists sponsored_events_contract_idx on public.sponsored_events (contract_id) where contract_id is not null;
create index if not exists sponsored_events_client_idx on public.sponsored_events (client_id) where client_id is not null;

-- ---------------------------------------------------------------------
-- Backfill seguro do legado: um item, campanha e recebível por contrato.
-- ---------------------------------------------------------------------
insert into public.contract_items (
  contract_id, legacy_source_contract_id, custom_name, description, quantity,
  unit_price, discount_amount, start_date, end_date, placement,
  requires_media_upload, delivery_status, notes
)
select
  c.id, c.id, c.title, c.ad_type, 1,
  coalesce(c.negotiated_value, 0), 0, c.start_date, c.end_date, c.placement,
  c.banner_url is not null,
  case c.status
    when 'ativo' then 'em_andamento'
    when 'pausado' then 'pausado'
    when 'cancelado' then 'cancelado'
    when 'expirado' then 'entregue'
    else 'nao_configurado'
  end,
  c.internal_notes
from public.ad_contracts c
where not exists (
  select 1 from public.contract_items i where i.legacy_source_contract_id = c.id
);

insert into public.ad_campaigns (
  contract_id, contract_item_id, legacy_contract_id, client_id, advertiser_id,
  campaign_name, placement, placement_id, desktop_media_url, alternative_text,
  destination_url, start_at, end_at, priority, status, is_visible, published_at
)
select
  c.id, i.id, c.id, c.client_id, c.advertiser_id,
  c.title, c.placement, p.id, c.banner_url, c.title, c.link_url,
  (c.start_date::timestamp at time zone 'America/Bahia'),
  ((c.end_date + 1)::timestamp at time zone 'America/Bahia') - interval '1 second',
  greatest(c.priority, 0),
  case c.status
    when 'ativo' then 'ativa'
    when 'pausado' then 'pausada'
    when 'cancelado' then 'cancelada'
    when 'expirado' then 'expirada'
    when 'agendado' then 'agendada'
    else 'rascunho'
  end,
  c.status not in ('cancelado', 'removido'),
  case when c.status = 'ativo' then c.created_at else null end
from public.ad_contracts c
join public.contract_items i on i.legacy_source_contract_id = c.id
left join public.advertising_placements p on p.code = c.placement
where c.placement is not null and c.banner_url is not null
  and not exists (select 1 from public.ad_campaigns a where a.legacy_contract_id = c.id);

insert into public.contract_payments (
  contract_id, legacy_contract_id, installment_number, description, amount, paid_amount,
  due_date, payment_method, status, notes
)
select
  c.id, c.id, 1, 'Recebível migrado do contrato legado', c.negotiated_value,
  case when c.payment_status = 'pago' then c.negotiated_value else 0 end,
  coalesce(c.billing_due_date, c.end_date), c.payment_method,
  case c.payment_status
    when 'pago' then 'pago'
    when 'parcial' then 'parcial'
    when 'atrasado' then 'atrasado'
    when 'cancelado' then 'cancelado'
    else 'pendente'
  end,
  c.payment_notes
from public.ad_contracts c
where c.negotiated_value is not null
  and not exists (select 1 from public.contract_payments p where p.legacy_contract_id = c.id);

-- O esquema legado não guardava quanto havia sido recebido em pagamentos
-- parciais; não inventamos esse valor. Para os pagos, ele é determinístico.
update public.contract_payments
set paid_amount = amount
where status = 'pago' and paid_amount <> amount;

update public.ad_impressions metric
set campaign_id = campaign.id
from public.ad_campaigns campaign
where metric.campaign_id is null
  and campaign.legacy_contract_id = metric.contract_id
  and campaign.placement = metric.placement;

update public.ad_clicks metric
set campaign_id = campaign.id
from public.ad_campaigns campaign
where metric.campaign_id is null
  and campaign.legacy_contract_id = metric.contract_id
  and campaign.placement = metric.placement;

-- ---------------------------------------------------------------------
-- Cálculos, auditoria e transições idempotentes
-- ---------------------------------------------------------------------
create or replace function public.recalculate_contract_totals(p_contract_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subtotal numeric(12,2);
  v_discount_type text;
  v_discount numeric(12,2);
  v_additional numeric(12,2);
  v_total numeric(12,2);
begin
  -- Serializa o recálculo por contrato para não perder um item em inserções
  -- concorrentes. O lock é curto e só cobre um único contrato.
  perform 1
  from public.ad_contracts
  where id = p_contract_id
  for update;

  if not found then
    return;
  end if;

  select
    contract_discount_type,
    contract_discount_value,
    additional_costs
  into v_discount_type, v_discount, v_additional
  from public.ad_contracts
  where id = p_contract_id;

  select coalesce(sum(i.line_total), 0)
    into v_subtotal
  from public.contract_items i
  where i.contract_id = p_contract_id;

  v_total := round(v_subtotal + coalesce(v_additional, 0) - case
    when v_discount_type = 'percentual' then round(v_subtotal * coalesce(v_discount, 0) / 100, 2)
    else coalesce(v_discount, 0)
  end, 2);

  if (case
    when v_discount_type = 'percentual' then round(v_subtotal * coalesce(v_discount, 0) / 100, 2)
    else coalesce(v_discount, 0)
  end) > v_subtotal then
    raise exception 'O desconto do contrato não pode ultrapassar o subtotal.';
  end if;

  update public.ad_contracts
  set subtotal = v_subtotal,
      total_amount = v_total,
      negotiated_value = v_total
  where id = p_contract_id
    and (subtotal, total_amount, negotiated_value) is distinct from (v_subtotal, v_total, v_total);
end;
$$;

revoke all on function public.recalculate_contract_totals(uuid) from public, anon, authenticated;

create or replace function public.trg_recalculate_contract_totals()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- O RPC de criação insere vários itens e só deve validar o desconto de
  -- contrato contra o subtotal final, não contra cada item intermediário.
  if current_setting('app.commercial_defer_total_recalc', true) = 'on' then
    return coalesce(new, old);
  end if;
  perform public.recalculate_contract_totals(coalesce(new.contract_id, old.contract_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_contract_items_totals on public.contract_items;
create trigger trg_contract_items_totals
  after insert or update or delete on public.contract_items
  for each row execute function public.trg_recalculate_contract_totals();

create or replace function public.trg_recalculate_contract_totals_from_contract()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.recalculate_contract_totals(new.id);
  return new;
end;
$$;

revoke all on function public.trg_recalculate_contract_totals_from_contract() from public, anon, authenticated;
drop trigger if exists trg_ad_contracts_totals on public.ad_contracts;
create trigger trg_ad_contracts_totals
  after update of contract_discount_type, contract_discount_value, additional_costs
  on public.ad_contracts
  for each row execute function public.trg_recalculate_contract_totals_from_contract();

-- Reservas de mídia não podem exceder a capacidade definida para a posição.
-- Um lock transacional por placement evita a corrida entre dois operadores
-- agendando o último espaço no mesmo instante.
create or replace function public.guard_campaign_inventory_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_capacity integer;
  v_occupied integer;
begin
  if new.status not in ('agendada', 'ativa') or not new.is_visible then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext(new.placement::text));

  select maximum_active_items into v_capacity
  from public.advertising_placements
  where code = new.placement and is_active;

  if v_capacity is null then
    return new;
  end if;

  select count(*) into v_occupied
  from public.ad_campaigns campaign
  where campaign.id is distinct from new.id
    and campaign.placement = new.placement
    and campaign.status in ('agendada', 'ativa')
    and campaign.is_visible
    and campaign.start_at <= new.end_at
    and campaign.end_at >= new.start_at;

  if v_occupied >= v_capacity then
    raise exception 'A posição % já atingiu a capacidade de % campanha(s) no período selecionado.', new.placement, v_capacity
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_campaign_inventory_capacity() from public, anon, authenticated;
drop trigger if exists trg_ad_campaigns_inventory_capacity on public.ad_campaigns;
create trigger trg_ad_campaigns_inventory_capacity
  before insert or update of placement, start_at, end_at, status, is_visible on public.ad_campaigns
  for each row execute function public.guard_campaign_inventory_capacity();

create or replace function public.sync_commercial_statuses()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (timezone('America/Bahia', now()))::date;
  v_now timestamptz := now();
  v_contracts integer := 0;
  v_campaigns integer := 0;
  v_payments integer := 0;
  v_affected integer := 0;
begin
  update public.ad_contracts
  set status = 'expirado'
  -- O cast para texto evita usar um label de enum recém-adicionado no
  -- mesmo transaction block da migração.
  where status::text in ('ativo', 'agendado', 'aprovado')
    and end_date < v_today;
  get diagnostics v_contracts = row_count;

  update public.ad_contracts
  set status = case when start_date > v_today then 'agendado' else 'ativo' end
  where status::text in ('aprovado', 'agendado')
    and end_date >= v_today;
  get diagnostics v_affected = row_count;
  v_contracts := v_contracts + v_affected;

  update public.ad_campaigns
  set status = 'expirada', is_visible = false
  where status in ('ativa', 'agendada') and end_at < v_now;
  get diagnostics v_campaigns = row_count;

  update public.ad_campaigns campaign
  set status = case when campaign.start_at > v_now then 'agendada' else 'ativa' end,
      published_at = case when campaign.start_at <= v_now then coalesce(campaign.published_at, v_now) else campaign.published_at end
  from public.ad_contracts contract
  where contract.id = campaign.contract_id
    and campaign.status in ('agendada', 'em_revisao')
    and coalesce(campaign.desktop_media_url, campaign.mobile_media_url) is not null
    and campaign.end_at >= v_now
    and contract.status::text in ('agendado', 'ativo', 'aprovado');
  get diagnostics v_affected = row_count;
  v_campaigns := v_campaigns + v_affected;

  update public.contract_payments
  set status = 'atrasado'
  where status in ('pendente', 'parcial')
    and paid_at is null
    and due_date < v_today;
  get diagnostics v_payments = row_count;

  return jsonb_build_object(
    'contracts_updated', v_contracts,
    'campaigns_updated', v_campaigns,
    'payments_updated', v_payments
  );
end;
$$;

revoke all on function public.sync_commercial_statuses() from public, anon, authenticated;

create or replace function public.audit_contract_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
begin
  -- Jobs e chamadas service-role não têm JWT; nesse caso o histórico é
  -- preservado com created_by nulo em vez de falhar ao tentar resolver perfil.
  if auth.uid() is not null then
    select p.id into v_actor_id
    from public.profiles p
    where p.user_id = auth.uid()
    limit 1;
  end if;

  if new.status is distinct from old.status then
    insert into public.contract_history (contract_id, action, notes, previous_data, new_data, created_by)
    values (
      new.id,
      'status_alterado',
      old.status::text || ' → ' || new.status::text,
      jsonb_build_object('status', old.status),
      jsonb_build_object('status', new.status),
      v_actor_id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ad_contract_status_audit on public.ad_contracts;
create trigger trg_ad_contract_status_audit
after update of status on public.ad_contracts
for each row execute function public.audit_contract_status_change();

-- Toda mudança feita pela nova interface passa por esta função. Ela mantém a
-- máquina de estados explícita sem impedir a leitura dos contratos legados.
create or replace function public.transition_commercial_contract_status(
  p_contract_id uuid,
  p_new_status text,
  p_notes text default null
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_current_status text;
  v_actor_id uuid;
  v_allowed boolean := false;
begin
  if not (select public.is_admin()) then
    raise exception 'Acesso restrito a administradores.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from unnest(enum_range(null::public.ad_contract_status)) as value
    where value::text = p_new_status
  ) then
    raise exception 'Status de contrato inválido: %', p_new_status using errcode = '22023';
  end if;

  select c.status::text
    into v_current_status
  from public.ad_contracts c
  where c.id = p_contract_id
  for update;

  if not found then
    raise exception 'Contrato não encontrado.' using errcode = 'P0002';
  end if;

  select p.id into v_actor_id
  from public.profiles p
  where p.user_id = (select auth.uid())
  limit 1;

  v_allowed := case v_current_status
    when 'rascunho' then p_new_status in ('pendente_aprovacao', 'cancelado', 'removido')
    when 'pendente_aprovacao' then p_new_status in ('rascunho', 'aprovado', 'cancelado', 'removido')
    when 'aprovado' then p_new_status in ('agendado', 'ativo', 'pausado', 'cancelado')
    when 'agendado' then p_new_status in ('ativo', 'pausado', 'cancelado')
    when 'ativo' then p_new_status in ('pausado', 'cancelado', 'expirado', 'concluido')
    when 'pausado' then p_new_status in ('agendado', 'ativo', 'cancelado', 'expirado')
    when 'expirado' then p_new_status in ('concluido', 'removido')
    when 'concluido' then p_new_status = 'removido'
    else false
  end;

  if not v_allowed then
    raise exception 'Transição de status não permitida: % → %.', v_current_status, p_new_status
      using errcode = '22023';
  end if;

  if p_new_status = 'aprovado' then
    if not exists (
      select 1
      from public.ad_contracts c
      join public.commercial_clients client on client.id = c.client_id
      where c.id = p_contract_id
        and client.is_active
        and client.archived_at is null
    ) then
      raise exception 'A aprovação exige um cliente comercial ativo.' using errcode = '23514';
    end if;

    if not exists (select 1 from public.contract_items where contract_id = p_contract_id) then
      raise exception 'A aprovação exige ao menos um item de contrato.' using errcode = '23514';
    end if;
  end if;

  -- Cancelamento é atômico: nenhuma campanha continua visível e itens ainda
  -- não entregues passam a registrar a interrupção da entrega.
  if p_new_status = 'cancelado' then
    update public.ad_campaigns
    set status = 'cancelada', is_visible = false
    where contract_id = p_contract_id
      and status not in ('cancelada', 'expirada');

    update public.contract_items
    set delivery_status = 'cancelado'
    where contract_id = p_contract_id
      and delivery_status <> 'entregue';
  end if;

  update public.ad_contracts
  set status = p_new_status::public.ad_contract_status,
      approved_by = case when p_new_status = 'aprovado' then v_actor_id else approved_by end,
      approved_at = case when p_new_status = 'aprovado' then now() else approved_at end,
      archived_at = case when p_new_status = 'removido' then coalesce(archived_at, now()) else archived_at end,
      updated_by = v_actor_id
  where id = p_contract_id;

  if nullif(btrim(p_notes), '') is not null then
    insert into public.contract_history (contract_id, action, notes, created_by)
    values (p_contract_id, 'nota_transicao', btrim(p_notes), v_actor_id);
  end if;
end;
$$;

revoke all on function public.transition_commercial_contract_status(uuid, text, text) from public, anon;
grant execute on function public.transition_commercial_contract_status(uuid, text, text) to authenticated;

-- Criação atômica do contrato. A interface envia somente IDs de clientes e
-- marcas já existentes; o valor, as parcelas e os vínculos de campanha são
-- recalculados/validados no banco antes do commit.
--
-- Formato resumido de p_payload:
-- {
--   client_id, advertiser_id?, title, start_date, end_date,
--   contract_discount_type?, contract_discount_value?, additional_costs?,
--   items: [{ product_id?, custom_name?, quantity, unit_price, discount_amount?, ... }],
--   payments: [{ installment_number, amount, due_date, payment_method, status?, paid_amount? }],
--   campaigns?: [{ contract_item_index, campaign_name, placement, ... }]
-- }
create or replace function public.create_commercial_contract(p_payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_contract_id uuid;
  v_client_id uuid;
  v_advertiser_id uuid;
  v_previous_contract_id uuid;
  v_actor_id uuid;
  v_company_name text;
  v_title text;
  v_status text;
  v_currency text;
  v_start_date date;
  v_end_date date;
  v_billing_due_date date;
  v_discount_type text;
  v_discount_value numeric(12,2) := 0;
  v_additional_costs numeric(12,2) := 0;
  v_subtotal numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
  v_renewal_enabled boolean := false;
  v_renewal_period_days integer;
  v_renewal_notice_days integer := 30;
  v_items jsonb;
  v_payments jsonb;
  v_campaigns jsonb;
  v_item jsonb;
  v_payment jsonb;
  v_campaign jsonb;
  v_item_ids uuid[] := array[]::uuid[];
  v_installment_numbers integer[] := array[]::integer[];
  v_item_index integer := 0;
  v_campaign_index integer := 0;
  v_contract_item_id uuid;
  v_product_id uuid;
  v_product_name text;
  v_product_placement_id uuid;
  v_product_placement public.ad_placement;
  v_product_requires_media boolean := false;
  v_product_requires_content boolean := false;
  v_placement public.ad_placement;
  v_placement_from_id public.ad_placement;
  v_placement_id uuid;
  v_item_name text;
  v_quantity numeric(12,2);
  v_unit_price numeric(12,2);
  v_item_discount numeric(12,2);
  v_item_start_date date;
  v_item_end_date date;
  v_requires_media boolean;
  v_requires_content boolean;
  v_delivery_status text;
  v_payment_amount numeric(12,2);
  v_paid_amount numeric(12,2);
  v_payment_total numeric(12,2) := 0;
  v_payment_count integer := 0;
  v_requested_installment_count integer := 1;
  v_generated_installment_index integer;
  v_total_cents bigint;
  v_base_installment_cents bigint;
  v_remainder_cents bigint;
  v_generated_payment_amount numeric(12,2);
  v_paid_count integer := 0;
  v_partial_count integer := 0;
  v_payment_status text;
  v_payment_method text;
  v_first_payment_method text;
  v_installment_number integer;
  v_due_date date;
  v_paid_at timestamptz;
  v_campaign_status text;
  v_campaign_start_at timestamptz;
  v_campaign_end_at timestamptz;
  v_campaign_item_index integer;
  v_campaign_priority integer;
  v_rotation_weight integer;
  v_raw text;
begin
  if jsonb_typeof(p_payload) is distinct from 'object' then
    raise exception 'O contrato deve ser enviado como um objeto JSON.' using errcode = '22023';
  end if;

  if not (select public.is_admin()) then
    raise exception 'Acesso restrito a administradores.' using errcode = '42501';
  end if;

  v_raw := nullif(btrim(p_payload ->> 'client_id'), '');
  if v_raw is null or v_raw !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'Selecione um cliente comercial cadastrado.' using errcode = '22023';
  end if;
  v_client_id := v_raw::uuid;

  select coalesce(c.trade_name, c.company_name, c.client_name)
    into v_company_name
  from public.commercial_clients c
  where c.id = v_client_id
    and c.is_active
    and c.archived_at is null
  for key share;

  if not found then
    raise exception 'O cliente selecionado não existe ou está arquivado.' using errcode = '23503';
  end if;

  v_advertiser_id := null;
  v_raw := nullif(btrim(p_payload ->> 'advertiser_id'), '');
  if v_raw is not null then
    if v_raw !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'Marca/anunciante inválido.' using errcode = '22023';
    end if;
    v_advertiser_id := v_raw::uuid;
    if not exists (
      select 1
      from public.commercial_brands b
      where b.id = v_advertiser_id
        and b.client_id = v_client_id
        and b.is_active
    ) then
      raise exception 'A marca selecionada não pertence ao cliente informado.' using errcode = '23503';
    end if;
  end if;

  v_previous_contract_id := null;
  v_raw := nullif(btrim(p_payload ->> 'previous_contract_id'), '');
  if v_raw is not null then
    if v_raw !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'Contrato anterior inválido.' using errcode = '22023';
    end if;
    v_previous_contract_id := v_raw::uuid;
    if not exists (
      select 1
      from public.ad_contracts previous_contract
      where previous_contract.id = v_previous_contract_id
        and previous_contract.client_id = v_client_id
    ) then
      raise exception 'O contrato anterior deve pertencer ao mesmo cliente.' using errcode = '23503';
    end if;
  end if;

  select p.id into v_actor_id
  from public.profiles p
  where p.user_id = (select auth.uid())
  limit 1;

  v_title := nullif(btrim(p_payload ->> 'title'), '');
  if v_title is null or char_length(v_title) > 180 then
    raise exception 'Informe um título de contrato de até 180 caracteres.' using errcode = '22023';
  end if;

  v_raw := nullif(btrim(p_payload ->> 'start_date'), '');
  if v_raw is null or v_raw !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    raise exception 'Informe a data de início no formato AAAA-MM-DD.' using errcode = '22023';
  end if;
  v_start_date := v_raw::date;

  v_raw := nullif(btrim(p_payload ->> 'end_date'), '');
  if v_raw is null or v_raw !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    raise exception 'Informe a data de fim no formato AAAA-MM-DD.' using errcode = '22023';
  end if;
  v_end_date := v_raw::date;
  if v_end_date < v_start_date then
    raise exception 'A data de fim não pode ser anterior à data de início.' using errcode = '23514';
  end if;

  v_status := coalesce(nullif(btrim(p_payload ->> 'status'), ''), 'rascunho');
  if v_status not in ('rascunho', 'pendente_aprovacao') then
    raise exception 'Um novo contrato deve começar como rascunho ou pendente de aprovação.' using errcode = '22023';
  end if;

  v_currency := upper(coalesce(nullif(btrim(p_payload ->> 'currency'), ''), 'BRL'));
  if v_currency !~ '^[A-Z]{3}$' then
    raise exception 'Moeda inválida.' using errcode = '22023';
  end if;

  v_discount_type := nullif(btrim(p_payload ->> 'contract_discount_type'), '');
  if v_discount_type is not null and v_discount_type not in ('valor', 'percentual') then
    raise exception 'Tipo de desconto inválido.' using errcode = '22023';
  end if;

  v_raw := coalesce(nullif(btrim(p_payload ->> 'contract_discount_value'), ''), '0');
  if v_raw !~ '^[0-9]+([.][0-9]{1,2})?$' then
    raise exception 'Valor de desconto inválido.' using errcode = '22023';
  end if;
  v_discount_value := v_raw::numeric(12,2);
  if v_discount_type is null and v_discount_value <> 0 then
    raise exception 'Informe o tipo de desconto.' using errcode = '23514';
  end if;
  if v_discount_type = 'percentual' and v_discount_value > 100 then
    raise exception 'O desconto percentual não pode ser maior que 100%%.' using errcode = '23514';
  end if;

  v_raw := coalesce(nullif(btrim(p_payload ->> 'additional_costs'), ''), '0');
  if v_raw !~ '^[0-9]+([.][0-9]{1,2})?$' then
    raise exception 'Custos adicionais inválidos.' using errcode = '22023';
  end if;
  v_additional_costs := v_raw::numeric(12,2);

  v_raw := nullif(btrim(p_payload ->> 'billing_due_date'), '');
  if v_raw is not null then
    if v_raw !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
      raise exception 'Data de cobrança inválida.' using errcode = '22023';
    end if;
    v_billing_due_date := v_raw::date;
  end if;
  v_billing_due_date := coalesce(v_billing_due_date, v_start_date);

  v_renewal_enabled := coalesce(nullif(btrim(p_payload ->> 'renewal_enabled'), '')::boolean, false);
  v_raw := nullif(btrim(p_payload ->> 'renewal_period_days'), '');
  if v_raw is not null then
    if v_raw !~ '^[0-9]+$' or v_raw::integer <= 0 then
      raise exception 'Período de renovação inválido.' using errcode = '22023';
    end if;
    v_renewal_period_days := v_raw::integer;
  end if;
  if v_renewal_enabled and v_renewal_period_days is null then
    raise exception 'Informe o período da renovação automática.' using errcode = '23514';
  end if;

  v_raw := coalesce(nullif(btrim(p_payload ->> 'renewal_notice_days'), ''), '30');
  if v_raw !~ '^[0-9]+$' then
    raise exception 'Antecedência de renovação inválida.' using errcode = '22023';
  end if;
  v_renewal_notice_days := v_raw::integer;

  v_items := coalesce(p_payload -> 'items', '[]'::jsonb);
  if jsonb_typeof(v_items) <> 'array' then
    raise exception 'A lista de itens é inválida.' using errcode = '22023';
  end if;
  if jsonb_array_length(v_items) = 0 or jsonb_array_length(v_items) > 100 then
    raise exception 'Informe entre 1 e 100 itens de contrato.' using errcode = '22023';
  end if;

  -- Valida os itens antes de criar qualquer registro dependente.
  for v_item in select value from jsonb_array_elements(v_items) as item(value) loop
    if jsonb_typeof(v_item) <> 'object' then
      raise exception 'Cada item do contrato deve ser um objeto.' using errcode = '22023';
    end if;

    v_product_id := null;
    v_product_name := null;
    v_product_placement_id := null;
    v_product_placement := null;
    v_product_requires_media := false;
    v_product_requires_content := false;
    v_raw := nullif(btrim(v_item ->> 'product_id'), '');
    if v_raw is not null then
      if v_raw !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        raise exception 'Produto de item inválido.' using errcode = '22023';
      end if;
      v_product_id := v_raw::uuid;
      select product.name, product.placement_id, placement.code,
             product.requires_media_upload, product.requires_content_creation
        into v_product_name, v_product_placement_id, v_product_placement,
             v_product_requires_media, v_product_requires_content
      from public.commercial_products product
      left join public.advertising_placements placement on placement.id = product.placement_id
      where product.id = v_product_id and product.is_active;
      if not found then
        raise exception 'O produto selecionado não existe ou está inativo.' using errcode = '23503';
      end if;
    end if;

    v_item_name := coalesce(nullif(btrim(v_item ->> 'custom_name'), ''), v_product_name);
    if v_item_name is null or char_length(v_item_name) > 180 then
      raise exception 'Cada item precisa de um nome de até 180 caracteres.' using errcode = '22023';
    end if;

    v_raw := coalesce(nullif(btrim(v_item ->> 'quantity'), ''), '1');
    if v_raw !~ '^[0-9]+([.][0-9]{1,2})?$' or v_raw::numeric <= 0 then
      raise exception 'Quantidade de item inválida.' using errcode = '22023';
    end if;
    v_quantity := v_raw::numeric(12,2);

    v_raw := coalesce(nullif(btrim(v_item ->> 'unit_price'), ''), '0');
    if v_raw !~ '^[0-9]+([.][0-9]{1,2})?$' then
      raise exception 'Preço unitário inválido.' using errcode = '22023';
    end if;
    v_unit_price := v_raw::numeric(12,2);

    v_raw := coalesce(nullif(btrim(v_item ->> 'discount_amount'), ''), '0');
    if v_raw !~ '^[0-9]+([.][0-9]{1,2})?$' then
      raise exception 'Desconto do item inválido.' using errcode = '22023';
    end if;
    v_item_discount := v_raw::numeric(12,2);
    if v_item_discount > v_quantity * v_unit_price then
      raise exception 'O desconto de um item não pode ultrapassar seu total.' using errcode = '23514';
    end if;

    v_item_start_date := v_start_date;
    v_raw := nullif(btrim(v_item ->> 'start_date'), '');
    if v_raw is not null then
      if v_raw !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
        raise exception 'Data inicial de item inválida.' using errcode = '22023';
      end if;
      v_item_start_date := v_raw::date;
    end if;
    v_item_end_date := v_end_date;
    v_raw := nullif(btrim(v_item ->> 'end_date'), '');
    if v_raw is not null then
      if v_raw !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
        raise exception 'Data final de item inválida.' using errcode = '22023';
      end if;
      v_item_end_date := v_raw::date;
    end if;
    if v_item_start_date < v_start_date or v_item_end_date > v_end_date or v_item_end_date < v_item_start_date then
      raise exception 'O período de cada item deve estar dentro do período do contrato.' using errcode = '23514';
    end if;

    v_placement := null;
    v_placement_id := null;
    v_raw := nullif(btrim(v_item ->> 'placement'), '');
    if v_raw is not null then
      if not exists (
        select 1 from unnest(enum_range(null::public.ad_placement)) as value where value::text = v_raw
      ) then
        raise exception 'Posição de item inválida.' using errcode = '22023';
      end if;
      v_placement := v_raw::public.ad_placement;
    end if;

    v_raw := nullif(btrim(v_item ->> 'placement_id'), '');
    if v_raw is not null then
      if v_raw !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        raise exception 'Inventário de posição inválido.' using errcode = '22023';
      end if;
      select placement.id, placement.code
        into v_placement_id, v_placement_from_id
      from public.advertising_placements placement
      where placement.id = v_raw::uuid and placement.is_active;
      if not found then
        raise exception 'A posição selecionada não existe ou está inativa.' using errcode = '23503';
      end if;
      if v_placement is not null and v_placement <> v_placement_from_id then
        raise exception 'A posição e o inventário do item não coincidem.' using errcode = '23514';
      end if;
      v_placement := v_placement_from_id;
    end if;

    if v_placement is null and v_product_placement is not null then
      v_placement := v_product_placement;
      v_placement_id := v_product_placement_id;
    elsif v_placement_id is null and v_placement is not null then
      select placement.id into v_placement_id
      from public.advertising_placements placement
      where placement.code = v_placement and placement.is_active;
    end if;

    v_requires_media := coalesce(nullif(btrim(v_item ->> 'requires_media_upload'), '')::boolean, v_product_requires_media, false);
    v_requires_content := coalesce(nullif(btrim(v_item ->> 'requires_content_creation'), '')::boolean, v_product_requires_content, false);
    v_delivery_status := coalesce(nullif(btrim(v_item ->> 'delivery_status'), ''), 'nao_configurado');
    if v_delivery_status not in ('nao_configurado', 'aguardando_materiais', 'pronto', 'agendado', 'em_andamento', 'entregue', 'pausado', 'cancelado') then
      raise exception 'Status de entrega de item inválido.' using errcode = '22023';
    end if;

    v_item_index := v_item_index + 1;
    v_subtotal := v_subtotal + (v_quantity * v_unit_price) - v_item_discount;
  end loop;

  v_total := round(v_subtotal + v_additional_costs - case
    when v_discount_type = 'percentual' then round(v_subtotal * v_discount_value / 100, 2)
    else v_discount_value
  end, 2);
  if (case
    when v_discount_type = 'percentual' then round(v_subtotal * v_discount_value / 100, 2)
    else v_discount_value
  end) > v_subtotal then
    raise exception 'O desconto do contrato não pode ultrapassar o subtotal.' using errcode = '23514';
  end if;

  v_payments := coalesce(p_payload -> 'payments', '[]'::jsonb);
  if jsonb_typeof(v_payments) <> 'array' then
    raise exception 'A lista de parcelas é inválida.' using errcode = '22023';
  end if;
  if jsonb_array_length(v_payments) = 0 then
    -- Renovação e rascunhos podem pedir que o banco gere o cronograma. A
    -- divisão ocorre em centavos para preservar a soma exata.
    v_raw := coalesce(nullif(btrim(p_payload ->> 'installment_count'), ''), '1');
    if v_raw !~ '^[0-9]+$' or v_raw::integer < 1 or v_raw::integer > 120 then
      raise exception 'Quantidade de parcelas inválida.' using errcode = '22023';
    end if;
    v_requested_installment_count := v_raw::integer;
    v_payment_method := coalesce(nullif(btrim(p_payload ->> 'payment_method'), ''), 'a_combinar');
    if char_length(v_payment_method) > 80 then
      raise exception 'Forma de pagamento inválida.' using errcode = '22023';
    end if;
    v_total_cents := round(v_total * 100)::bigint;
    v_base_installment_cents := v_total_cents / v_requested_installment_count;
    v_remainder_cents := mod(v_total_cents, v_requested_installment_count);
    v_payments := '[]'::jsonb;
    for v_generated_installment_index in 1..v_requested_installment_count loop
      v_generated_payment_amount :=
        ((v_base_installment_cents + case when v_generated_installment_index <= v_remainder_cents then 1 else 0 end)::numeric / 100)::numeric(12,2);
      v_payments := v_payments || jsonb_build_array(jsonb_build_object(
        'installment_number', v_generated_installment_index,
        'amount', v_generated_payment_amount,
        'paid_amount', 0,
        'due_date', (v_billing_due_date + ((v_generated_installment_index - 1) * interval '1 month'))::date,
        'payment_method', v_payment_method,
        'status', 'pendente'
      ));
    end loop;
  end if;
  if jsonb_array_length(v_payments) > 120 then
    raise exception 'Informe no máximo 120 parcelas.' using errcode = '22023';
  end if;

  -- As parcelas são validadas antes do insert para garantir que sua soma bate
  -- exatamente com o contrato, inclusive nos centavos.
  for v_payment in select value from jsonb_array_elements(v_payments) as payment(value) loop
    if jsonb_typeof(v_payment) <> 'object' then
      raise exception 'Cada parcela deve ser um objeto.' using errcode = '22023';
    end if;
    v_raw := nullif(btrim(v_payment ->> 'installment_number'), '');
    if v_raw is null or v_raw !~ '^[0-9]+$' or v_raw::integer <= 0 then
      raise exception 'Número de parcela inválido.' using errcode = '22023';
    end if;
    v_installment_number := v_raw::integer;
    if v_installment_number = any(v_installment_numbers) then
      raise exception 'Não repita o número de uma parcela.' using errcode = '23514';
    end if;
    v_installment_numbers := array_append(v_installment_numbers, v_installment_number);

    v_raw := coalesce(nullif(btrim(v_payment ->> 'amount'), ''), '0');
    if v_raw !~ '^[0-9]+([.][0-9]{1,2})?$' then
      raise exception 'Valor de parcela inválido.' using errcode = '22023';
    end if;
    v_payment_amount := v_raw::numeric(12,2);
    v_payment_total := v_payment_total + v_payment_amount;

    v_raw := nullif(btrim(v_payment ->> 'due_date'), '');
    if v_raw is null or v_raw !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
      raise exception 'Vencimento de parcela inválido.' using errcode = '22023';
    end if;

    v_payment_method := coalesce(
      nullif(btrim(v_payment ->> 'payment_method'), ''),
      nullif(btrim(p_payload ->> 'payment_method'), ''),
      'a_combinar'
    );
    if char_length(v_payment_method) > 80 then
      raise exception 'Informe a forma de pagamento de cada parcela.' using errcode = '22023';
    end if;

    v_payment_status := coalesce(nullif(btrim(v_payment ->> 'status'), ''), 'pendente');
    if v_payment_status not in ('pendente', 'parcial', 'pago') then
      raise exception 'Status inicial de parcela inválido.' using errcode = '22023';
    end if;

    if v_payment_status = 'pago' then
      v_paid_amount := v_payment_amount;
      v_paid_count := v_paid_count + 1;
    elsif v_payment_status = 'parcial' then
      v_raw := nullif(btrim(v_payment ->> 'paid_amount'), '');
      if v_raw is null or v_raw !~ '^[0-9]+([.][0-9]{1,2})?$' then
        raise exception 'Informe o valor já recebido da parcela parcial.' using errcode = '22023';
      end if;
      v_paid_amount := v_raw::numeric(12,2);
      if v_paid_amount <= 0 or v_paid_amount >= v_payment_amount then
        raise exception 'O valor parcial deve ser maior que zero e menor que a parcela.' using errcode = '23514';
      end if;
      v_partial_count := v_partial_count + 1;
    else
      v_paid_amount := 0;
    end if;

    v_payment_count := v_payment_count + 1;
  end loop;

  if round(v_payment_total, 2) <> v_total then
    raise exception 'A soma das parcelas (%) deve ser igual ao total do contrato (%).', v_payment_total, v_total
      using errcode = '23514';
  end if;

  insert into public.ad_contracts (
    contract_type, ad_type, title, description, client_id, company_name, advertiser_id,
    start_date, end_date, negotiated_value, payment_status, payment_terms,
    contract_discount_type, contract_discount_value, additional_costs, subtotal,
    total_amount, installment_count, billing_due_date, renewal_enabled,
    renewal_period_days, renewal_notice_days, client_notes, internal_notes,
    status, previous_contract_id, created_by, updated_by, currency
  )
  values (
    coalesce(nullif(btrim(p_payload ->> 'contract_type'), ''), 'contrato_comercial'),
    coalesce(nullif(btrim(p_payload ->> 'ad_type'), ''), 'Contrato comercial'),
    v_title, nullif(btrim(p_payload ->> 'description'), ''), v_client_id, v_company_name, v_advertiser_id,
    v_start_date, v_end_date, v_total, 'pendente'::public.payment_status, nullif(btrim(p_payload ->> 'payment_terms'), ''),
    v_discount_type, v_discount_value, v_additional_costs, v_subtotal,
    v_total, v_payment_count, v_billing_due_date, v_renewal_enabled,
    v_renewal_period_days, v_renewal_notice_days, nullif(btrim(p_payload ->> 'client_notes'), ''), nullif(btrim(p_payload ->> 'internal_notes'), ''),
    v_status::public.ad_contract_status, v_previous_contract_id, v_actor_id, v_actor_id, v_currency
  )
  returning id into v_contract_id;

  -- Só agora os itens são gravados. O trigger de totais mantém a mesma regra
  -- também para edições futuras fora deste RPC. Durante este lote, adiamos o
  -- recálculo para que um desconto válido sobre o pacote completo não falhe
  -- ao passar pelo primeiro item intermediário.
  perform set_config('app.commercial_defer_total_recalc', 'on', true);
  for v_item in select value from jsonb_array_elements(v_items) as item(value) loop
    v_product_id := null;
    v_product_name := null;
    v_product_placement_id := null;
    v_product_placement := null;
    v_product_requires_media := false;
    v_product_requires_content := false;
    v_raw := nullif(btrim(v_item ->> 'product_id'), '');
    if v_raw is not null then
      v_product_id := v_raw::uuid;
      select product.name, product.placement_id, placement.code,
             product.requires_media_upload, product.requires_content_creation
        into v_product_name, v_product_placement_id, v_product_placement,
             v_product_requires_media, v_product_requires_content
      from public.commercial_products product
      left join public.advertising_placements placement on placement.id = product.placement_id
      where product.id = v_product_id and product.is_active;
    end if;
    v_item_name := coalesce(nullif(btrim(v_item ->> 'custom_name'), ''), v_product_name);
    v_quantity := coalesce(nullif(btrim(v_item ->> 'quantity'), ''), '1')::numeric(12,2);
    v_unit_price := coalesce(nullif(btrim(v_item ->> 'unit_price'), ''), '0')::numeric(12,2);
    v_item_discount := coalesce(nullif(btrim(v_item ->> 'discount_amount'), ''), '0')::numeric(12,2);
    v_item_start_date := coalesce(nullif(btrim(v_item ->> 'start_date'), '')::date, v_start_date);
    v_item_end_date := coalesce(nullif(btrim(v_item ->> 'end_date'), '')::date, v_end_date);

    v_placement := null;
    v_placement_id := null;
    v_raw := nullif(btrim(v_item ->> 'placement'), '');
    if v_raw is not null then
      v_placement := v_raw::public.ad_placement;
    end if;
    v_raw := nullif(btrim(v_item ->> 'placement_id'), '');
    if v_raw is not null then
      select placement.id, placement.code
        into v_placement_id, v_placement_from_id
      from public.advertising_placements placement
      where placement.id = v_raw::uuid and placement.is_active;
      v_placement := coalesce(v_placement, v_placement_from_id);
    end if;
    if v_placement is null and v_product_placement is not null then
      v_placement := v_product_placement;
      v_placement_id := v_product_placement_id;
    elsif v_placement_id is null and v_placement is not null then
      select placement.id into v_placement_id
      from public.advertising_placements placement
      where placement.code = v_placement and placement.is_active;
    end if;

    v_requires_media := coalesce(nullif(btrim(v_item ->> 'requires_media_upload'), '')::boolean, v_product_requires_media, false);
    v_requires_content := coalesce(nullif(btrim(v_item ->> 'requires_content_creation'), '')::boolean, v_product_requires_content, false);
    v_delivery_status := coalesce(nullif(btrim(v_item ->> 'delivery_status'), ''), 'nao_configurado');

    insert into public.contract_items (
      contract_id, product_id, custom_name, description, quantity, unit_price,
      discount_amount, start_date, end_date, placement, placement_id,
      requires_media_upload, requires_content_creation, delivery_status, notes
    ) values (
      v_contract_id, v_product_id, v_item_name, nullif(btrim(v_item ->> 'description'), ''), v_quantity, v_unit_price,
      v_item_discount, v_item_start_date, v_item_end_date, v_placement, v_placement_id,
      v_requires_media, v_requires_content, v_delivery_status, nullif(btrim(v_item ->> 'notes'), '')
    ) returning id into v_contract_item_id;
    v_item_ids := array_append(v_item_ids, v_contract_item_id);
  end loop;

  perform set_config('app.commercial_defer_total_recalc', 'off', true);
  -- Dispara o trigger protegido de total uma única vez, com todos os itens.
  update public.ad_contracts
  set contract_discount_value = contract_discount_value
  where id = v_contract_id;

  for v_payment in select value from jsonb_array_elements(v_payments) as payment(value) loop
    v_installment_number := (v_payment ->> 'installment_number')::integer;
    v_payment_amount := coalesce(nullif(btrim(v_payment ->> 'amount'), ''), '0')::numeric(12,2);
    v_payment_status := coalesce(nullif(btrim(v_payment ->> 'status'), ''), 'pendente');
    v_paid_at := nullif(btrim(v_payment ->> 'paid_at'), '')::timestamptz;
    if v_payment_status = 'pago' then
      v_paid_amount := v_payment_amount;
      v_paid_at := coalesce(v_paid_at, now());
    elsif v_payment_status = 'parcial' then
      v_paid_amount := (v_payment ->> 'paid_amount')::numeric(12,2);
      v_paid_at := coalesce(v_paid_at, now());
    else
      v_paid_amount := 0;
      v_paid_at := null;
    end if;

    v_payment_method := coalesce(
      nullif(btrim(v_payment ->> 'payment_method'), ''),
      nullif(btrim(p_payload ->> 'payment_method'), ''),
      'a_combinar'
    );

    if v_first_payment_method is null then
      v_first_payment_method := v_payment_method;
    end if;

    insert into public.contract_payments (
      contract_id, installment_number, description, amount, paid_amount, due_date,
      paid_at, payment_method, status, transaction_reference, receipt_url, notes
    ) values (
      v_contract_id, v_installment_number, nullif(btrim(v_payment ->> 'description'), ''), v_payment_amount, v_paid_amount,
      (v_payment ->> 'due_date')::date, v_paid_at, v_payment_method, v_payment_status,
      nullif(btrim(v_payment ->> 'transaction_reference'), ''), nullif(btrim(v_payment ->> 'receipt_url'), ''), nullif(btrim(v_payment ->> 'notes'), '')
    );
  end loop;

  update public.ad_contracts
  set payment_method = v_first_payment_method,
      payment_status = case
        when v_paid_count = v_payment_count then 'pago'::public.payment_status
        when v_paid_count > 0 or v_partial_count > 0 then 'parcial'::public.payment_status
        else 'pendente'::public.payment_status
      end
  where id = v_contract_id;

  v_campaigns := coalesce(p_payload -> 'campaigns', '[]'::jsonb);
  if jsonb_typeof(v_campaigns) <> 'array' then
    raise exception 'A lista de campanhas é inválida.' using errcode = '22023';
  end if;
  if jsonb_array_length(v_campaigns) > 100 then
    raise exception 'A lista de campanhas é inválida.' using errcode = '22023';
  end if;

  for v_campaign in select value from jsonb_array_elements(v_campaigns) as campaign(value) loop
    if jsonb_typeof(v_campaign) <> 'object' then
      raise exception 'Cada campanha deve ser um objeto.' using errcode = '22023';
    end if;
    v_campaign_index := v_campaign_index + 1;
    v_raw := nullif(btrim(v_campaign ->> 'contract_item_index'), '');
    if v_raw is null or v_raw !~ '^[0-9]+$' then
      raise exception 'Informe o item vinculado a cada campanha.' using errcode = '22023';
    end if;
    v_campaign_item_index := v_raw::integer;
    if v_campaign_item_index < 1 or v_campaign_item_index > cardinality(v_item_ids) then
      raise exception 'A campanha % aponta para um item inexistente.', v_campaign_index using errcode = '23503';
    end if;
    v_contract_item_id := v_item_ids[v_campaign_item_index];

    v_raw := nullif(btrim(v_campaign ->> 'placement'), '');
    if v_raw is null or not exists (
      select 1 from unnest(enum_range(null::public.ad_placement)) as value where value::text = v_raw
    ) then
      raise exception 'Informe uma posição válida para a campanha.' using errcode = '22023';
    end if;
    v_placement := v_raw::public.ad_placement;
    v_placement_id := null;
    v_raw := nullif(btrim(v_campaign ->> 'placement_id'), '');
    if v_raw is not null then
      if v_raw !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        raise exception 'Inventário de campanha inválido.' using errcode = '22023';
      end if;
      select placement.id, placement.code into v_placement_id, v_placement_from_id
      from public.advertising_placements placement
      where placement.id = v_raw::uuid and placement.is_active;
      if not found or v_placement_from_id <> v_placement then
        raise exception 'A posição e o inventário da campanha não coincidem.' using errcode = '23514';
      end if;
    else
      select placement.id into v_placement_id
      from public.advertising_placements placement
      where placement.code = v_placement and placement.is_active;
    end if;

    if nullif(btrim(v_campaign ->> 'campaign_name'), '') is null then
      raise exception 'Informe o nome da campanha.' using errcode = '22023';
    end if;
    v_campaign_start_at := coalesce(
      nullif(btrim(v_campaign ->> 'start_at'), '')::timestamptz,
      v_start_date::timestamp at time zone 'America/Bahia'
    );
    v_campaign_end_at := coalesce(
      nullif(btrim(v_campaign ->> 'end_at'), '')::timestamptz,
      ((v_end_date + 1)::timestamp at time zone 'America/Bahia') - interval '1 second'
    );
    if v_campaign_start_at > v_campaign_end_at
      or v_campaign_start_at < (v_start_date::timestamp at time zone 'America/Bahia')
      or v_campaign_end_at > (((v_end_date + 1)::timestamp at time zone 'America/Bahia') - interval '1 second') then
      raise exception 'O período da campanha deve estar dentro do contrato.' using errcode = '23514';
    end if;

    v_campaign_status := coalesce(nullif(btrim(v_campaign ->> 'status'), ''), 'rascunho');
    if v_campaign_status not in ('rascunho', 'aguardando_midia', 'em_revisao', 'agendada', 'ativa', 'pausada', 'expirada', 'rejeitada', 'cancelada') then
      raise exception 'Status inicial de campanha inválido.' using errcode = '22023';
    end if;
    if v_campaign_status in ('agendada', 'ativa')
      and coalesce(nullif(btrim(v_campaign ->> 'desktop_media_url'), ''), nullif(btrim(v_campaign ->> 'mobile_media_url'), '')) is null then
      raise exception 'Uma campanha agendada ou ativa precisa de mídia.' using errcode = '23514';
    end if;

    v_raw := coalesce(nullif(btrim(v_campaign ->> 'priority'), ''), '0');
    if v_raw !~ '^[0-9]+$' then
      raise exception 'Prioridade de campanha inválida.' using errcode = '22023';
    end if;
    v_campaign_priority := v_raw::integer;
    v_raw := coalesce(nullif(btrim(v_campaign ->> 'rotation_weight'), ''), '1');
    if v_raw !~ '^[0-9]+$' or v_raw::integer <= 0 then
      raise exception 'Peso de rotação inválido.' using errcode = '22023';
    end if;
    v_rotation_weight := v_raw::integer;

    if nullif(btrim(v_campaign ->> 'destination_url'), '') is not null
      and btrim(v_campaign ->> 'destination_url') !~* '^https?://' then
      raise exception 'Link de destino da campanha deve iniciar com http:// ou https://.' using errcode = '22023';
    end if;

    insert into public.ad_campaigns (
      contract_id, contract_item_id, client_id, advertiser_id, campaign_name,
      placement, placement_id, desktop_media_url, mobile_media_url, alternative_text,
      destination_url, open_in_new_tab, start_at, end_at, priority, rotation_weight,
      status, is_visible, click_tracking_enabled, impression_tracking_enabled
    ) values (
      v_contract_id, v_contract_item_id, v_client_id, v_advertiser_id, btrim(v_campaign ->> 'campaign_name'),
      v_placement, v_placement_id, nullif(btrim(v_campaign ->> 'desktop_media_url'), ''), nullif(btrim(v_campaign ->> 'mobile_media_url'), ''), nullif(btrim(v_campaign ->> 'alternative_text'), ''),
      nullif(btrim(v_campaign ->> 'destination_url'), ''), coalesce(nullif(btrim(v_campaign ->> 'open_in_new_tab'), '')::boolean, true), v_campaign_start_at, v_campaign_end_at, v_campaign_priority, v_rotation_weight,
      v_campaign_status, coalesce(nullif(btrim(v_campaign ->> 'is_visible'), '')::boolean, true), coalesce(nullif(btrim(v_campaign ->> 'click_tracking_enabled'), '')::boolean, false), coalesce(nullif(btrim(v_campaign ->> 'impression_tracking_enabled'), '')::boolean, false)
    );
  end loop;

  insert into public.contract_history (contract_id, action, notes, new_data, created_by)
  values (
    v_contract_id,
    'criado',
    'Contrato criado pelo fluxo comercial.',
    jsonb_build_object(
      'status', v_status,
      'client_id', v_client_id,
      'advertiser_id', v_advertiser_id,
      'previous_contract_id', v_previous_contract_id,
      'subtotal', v_subtotal,
      'discount', v_discount_value,
      'additional_costs', v_additional_costs,
      'total_amount', v_total,
      'items', cardinality(v_item_ids),
      'payments', v_payment_count,
      'campaigns', jsonb_array_length(v_campaigns)
    ),
    v_actor_id
  );

  return v_contract_id;
end;
$$;

revoke all on function public.create_commercial_contract(jsonb) from public, anon;
grant execute on function public.create_commercial_contract(jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- Compatibilidade: o resolvedor público passa a usar campanhas normalizadas
-- e preserva contratos legados sem campanha migrada.
-- ---------------------------------------------------------------------
create or replace view public.active_ads with (security_invoker = true) as
select
  campaign.id,
  contract.title,
  campaign.placement,
  coalesce(campaign.desktop_media_url, campaign.mobile_media_url) as banner_url,
  campaign.destination_url as link_url,
  coalesce(brand.name, client.trade_name, client.client_name, contract.company_name) as company_name,
  campaign.priority,
  (campaign.start_at at time zone 'America/Bahia')::date as start_date,
  (campaign.end_at at time zone 'America/Bahia')::date as end_date,
  campaign.contract_id
from public.ad_campaigns campaign
join public.ad_contracts contract on contract.id = campaign.contract_id
left join public.commercial_clients client on client.id = campaign.client_id
left join public.commercial_brands brand on brand.id = campaign.advertiser_id
where campaign.status in ('agendada', 'ativa')
  and campaign.is_visible
  and coalesce(campaign.desktop_media_url, campaign.mobile_media_url) is not null
  and campaign.start_at <= now()
  and campaign.end_at >= now()
  -- Evita a restrição de uso de label de enum recém-adicionado durante a
  -- própria migração; a comparação é estável após o commit.
  and contract.status::text in ('agendado', 'ativo', 'aprovado')
union all
select
  contract.id,
  contract.title,
  contract.placement,
  contract.banner_url,
  contract.link_url,
  coalesce(client.trade_name, client.client_name, contract.company_name) as company_name,
  contract.priority,
  contract.start_date,
  contract.end_date,
  contract.id as contract_id
from public.ad_contracts contract
left join public.commercial_clients client on client.id = contract.client_id
where not exists (select 1 from public.ad_campaigns campaign where campaign.contract_id = contract.id)
  and contract.placement is not null
  and contract.status = 'ativo'
  and contract.banner_url is not null
  and contract.start_date <= (timezone('America/Bahia', now()))::date
  and contract.end_date >= (timezone('America/Bahia', now()))::date;

revoke all on public.active_ads from public, anon, authenticated;

create or replace function public.get_active_ads(p_placement public.ad_placement)
returns table (
  id uuid,
  title text,
  placement public.ad_placement,
  banner_url text,
  link_url text,
  company_name text,
  priority integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with resolved_ads as (
    select
      campaign.id,
      contract.title,
      campaign.placement,
      coalesce(campaign.desktop_media_url, campaign.mobile_media_url) as banner_url,
      campaign.destination_url as link_url,
      coalesce(brand.name, client.trade_name, client.client_name, contract.company_name) as company_name,
      campaign.priority
    from public.ad_campaigns campaign
    join public.ad_contracts contract on contract.id = campaign.contract_id
    left join public.commercial_clients client on client.id = campaign.client_id
    left join public.commercial_brands brand on brand.id = campaign.advertiser_id
    where campaign.status in ('agendada', 'ativa')
      and campaign.is_visible
      and coalesce(campaign.desktop_media_url, campaign.mobile_media_url) is not null
      and campaign.start_at <= now()
      and campaign.end_at >= now()
      and contract.status::text in ('agendado', 'ativo', 'aprovado')

    union all

    select
      contract.id,
      contract.title,
      contract.placement,
      contract.banner_url,
      contract.link_url,
      coalesce(client.trade_name, client.client_name, contract.company_name) as company_name,
      contract.priority
    from public.ad_contracts contract
    left join public.commercial_clients client on client.id = contract.client_id
    where not exists (select 1 from public.ad_campaigns campaign where campaign.contract_id = contract.id)
      and contract.placement is not null
      and contract.status = 'ativo'
      and contract.banner_url is not null
      and contract.start_date <= (timezone('America/Bahia', now()))::date
      and contract.end_date >= (timezone('America/Bahia', now()))::date
  )
  select id, coalesce(title, 'Publicidade'), placement, banner_url, link_url, company_name, priority
  from resolved_ads
  where placement = p_placement
  order by priority desc, id;
$$;

revoke all on function public.get_active_ads(public.ad_placement) from public, anon, authenticated;
grant execute on function public.get_active_ads(public.ad_placement) to anon, authenticated;

-- Eventos não são inseridos diretamente pelo navegador. O RPC só aceita uma
-- campanha que esteja efetivamente ativa e limita o payload de UTM; assim um
-- visitante não consegue gravar métricas em contratos arbitrários.
create or replace function public.record_ad_event(
  p_campaign_id uuid,
  p_event text,
  p_utm jsonb default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_contract_id uuid;
  v_placement public.ad_placement;
begin
  if p_event not in ('impression', 'click') then
    raise exception 'Tipo de evento de anúncio inválido.' using errcode = '22023';
  end if;

  if p_utm is not null and octet_length(p_utm::text) > 2048 then
    raise exception 'Metadados UTM excedem o limite permitido.' using errcode = '22023';
  end if;

  select campaign.contract_id, campaign.placement
    into v_contract_id, v_placement
  from public.ad_campaigns campaign
  join public.ad_contracts contract on contract.id = campaign.contract_id
  where campaign.id = p_campaign_id
    and campaign.status in ('agendada', 'ativa')
    and campaign.is_visible
    and campaign.start_at <= now()
    and campaign.end_at >= now()
    and contract.status::text in ('agendado', 'ativo', 'aprovado')
    and (
      (p_event = 'impression' and campaign.impression_tracking_enabled)
      or (p_event = 'click' and campaign.click_tracking_enabled)
    );

  -- Não revelar se uma campanha não existe ou já não está pública.
  if not found then
    return;
  end if;

  if p_event = 'impression' then
    insert into public.ad_impressions (contract_id, campaign_id, placement, utm)
    values (v_contract_id, p_campaign_id, v_placement, p_utm);
  else
    insert into public.ad_clicks (contract_id, campaign_id, placement, utm)
    values (v_contract_id, p_campaign_id, v_placement, p_utm);
  end if;
end;
$$;

revoke all on function public.record_ad_event(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.record_ad_event(uuid, text, jsonb) to anon, authenticated;

-- Funções administrativas antigas não devem permanecer expostas diretamente.
do $$
begin
  -- Estas funções existiam apenas em algumas instalações anteriores.
  -- Verificá-las evita interromper a migração em bancos que nunca as criaram.
  if to_regprocedure('public.expire_contracts()') is not null then
    execute 'revoke all on function public.expire_contracts() from public, anon, authenticated';
    execute 'grant execute on function public.expire_contracts() to service_role';
  end if;

  if to_regprocedure('public.admin_metrics()') is not null then
    execute 'revoke all on function public.admin_metrics() from public, anon, authenticated';
  end if;

  if to_regprocedure('public.admin_metrics_guarded()') is not null then
    execute 'revoke all on function public.admin_metrics_guarded() from public, anon';
    execute 'grant execute on function public.admin_metrics_guarded() to authenticated';
  end if;
end;
$$;
-- Apenas o backend confiável pode disparar a sincronização periódica.
grant execute on function public.sync_commercial_statuses() to service_role;

-- ---------------------------------------------------------------------
-- RLS: novas tabelas administrativas. Políticas explícitas evitam exposição
-- automática da Data API e usam o helper apenas uma vez por consulta.
-- ---------------------------------------------------------------------
alter table public.commercial_clients enable row level security;
alter table public.client_history enable row level security;
alter table public.ad_contracts enable row level security;
alter table public.ad_assets enable row level security;
alter table public.contract_history enable row level security;
alter table public.ad_impressions enable row level security;
alter table public.ad_clicks enable row level security;
alter table public.commercial_brands enable row level security;
alter table public.advertising_placements enable row level security;
alter table public.commercial_products enable row level security;
alter table public.contract_items enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.contract_payments enable row level security;
alter table public.contract_files enable row level security;
alter table public.sponsored_articles enable row level security;
alter table public.sponsored_events enable row level security;

-- As políticas legadas não tinham TO authenticated e chamavam is_admin() por
-- linha. Recriamos as políticas comerciais com o papel e o initPlan explícitos.
drop policy if exists commercial_clients_admin on public.commercial_clients;
create policy commercial_clients_admin_all on public.commercial_clients
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists client_history_admin on public.client_history;
create policy client_history_admin_read on public.client_history
  for select to authenticated using ((select public.is_admin()));
create policy client_history_admin_insert on public.client_history
  for insert to authenticated with check ((select public.is_admin()));

drop policy if exists ad_contracts_admin on public.ad_contracts;
create policy ad_contracts_admin_all on public.ad_contracts
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists ad_assets_admin on public.ad_assets;
create policy ad_assets_admin_all on public.ad_assets
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists ad_impressions_insert on public.ad_impressions;
drop policy if exists ad_impressions_admin_read on public.ad_impressions;
create policy ad_impressions_admin_read on public.ad_impressions
  for select to authenticated using ((select public.is_admin()));

drop policy if exists ad_clicks_insert on public.ad_clicks;
drop policy if exists ad_clicks_admin_read on public.ad_clicks;
create policy ad_clicks_admin_read on public.ad_clicks
  for select to authenticated using ((select public.is_admin()));

drop policy if exists commercial_brands_admin_all on public.commercial_brands;
create policy commercial_brands_admin_all on public.commercial_brands
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists advertising_placements_admin_all on public.advertising_placements;
create policy advertising_placements_admin_all on public.advertising_placements
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists commercial_products_admin_all on public.commercial_products;
create policy commercial_products_admin_all on public.commercial_products
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists contract_items_admin_all on public.contract_items;
create policy contract_items_admin_all on public.contract_items
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists ad_campaigns_admin_all on public.ad_campaigns;
create policy ad_campaigns_admin_all on public.ad_campaigns
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists contract_payments_admin_all on public.contract_payments;
create policy contract_payments_admin_all on public.contract_payments
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists contract_files_admin_all on public.contract_files;
create policy contract_files_admin_all on public.contract_files
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- O site público recebe apenas o rótulo por uma função estreita. A tabela
-- completa contém client_id/contract_id e não deve ser consultável pelo anon.
drop policy if exists sponsored_articles_read on public.sponsored_articles;
drop policy if exists sponsored_articles_admin on public.sponsored_articles;
drop policy if exists sponsored_events_read on public.sponsored_events;
drop policy if exists sponsored_events_admin on public.sponsored_events;
create policy sponsored_articles_admin_all on public.sponsored_articles
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy sponsored_events_admin_all on public.sponsored_events
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Histórico de contratos é append-only; preserva a auditoria financeira.
drop policy if exists contract_history_admin on public.contract_history;
drop policy if exists contract_history_admin_read on public.contract_history;
drop policy if exists contract_history_admin_insert on public.contract_history;
create policy contract_history_admin_read on public.contract_history
  for select to authenticated using ((select public.is_admin()));
create policy contract_history_admin_insert on public.contract_history
  for insert to authenticated with check ((select public.is_admin()));

-- O Data API só recebe o mínimo necessário; RLS continua sendo a barreira por
-- linha. O anon não acessa tabelas comerciais diretamente.
revoke all on table
  public.commercial_clients,
  public.client_history,
  public.ad_contracts,
  public.ad_assets,
  public.contract_history,
  public.ad_impressions,
  public.ad_clicks,
  public.commercial_brands,
  public.advertising_placements,
  public.commercial_products,
  public.contract_items,
  public.ad_campaigns,
  public.contract_payments,
  public.contract_files
from public, anon;

revoke all on table public.sponsored_articles, public.sponsored_events from public, anon;

grant select, insert, update, delete on table
  public.commercial_clients,
  public.client_history,
  public.ad_contracts,
  public.ad_assets,
  public.contract_history,
  public.ad_impressions,
  public.ad_clicks,
  public.commercial_brands,
  public.advertising_placements,
  public.commercial_products,
  public.contract_items,
  public.ad_campaigns,
  public.contract_payments,
  public.contract_files
to authenticated, service_role;
grant select, insert, update, delete on table public.sponsored_articles, public.sponsored_events to authenticated, service_role;

create or replace function public.get_sponsor_label(p_post_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select label
  from (
    select label, coalesce(start_date, (timezone('America/Bahia', now()))::date) as starts, coalesce(end_date, (timezone('America/Bahia', now()))::date) as ends
    from public.sponsored_articles
    where post_id = p_post_id and is_active
    union all
    select label, coalesce(start_date, (timezone('America/Bahia', now()))::date), coalesce(end_date, (timezone('America/Bahia', now()))::date)
    from public.sponsored_events
    where post_id = p_post_id and is_active
  ) labels
  where starts <= (timezone('America/Bahia', now()))::date
    and ends >= (timezone('America/Bahia', now()))::date
  order by starts
  limit 1;
$$;
revoke all on function public.get_sponsor_label(uuid) from public, authenticated, anon;
grant execute on function public.get_sponsor_label(uuid) to public, authenticated, anon;

revoke all on sequence public.commercial_contract_number_seq from public, anon, authenticated;

-- Arquivos contratuais nunca ficam em bucket público. As quatro operações são
-- necessárias para upload com upsert e para gerar URLs assinadas no servidor.
insert into storage.buckets (id, name, public)
values ('commercial-files', 'commercial-files', false)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array[
      'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
where id = 'commercial-files';

-- O cliente valida novamente, mas o limite também precisa existir no Storage.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
where id = 'ad-banners';

drop policy if exists "storage_commercial_files_admin_read" on storage.objects;
drop policy if exists "storage_commercial_files_admin_insert" on storage.objects;
drop policy if exists "storage_commercial_files_admin_update" on storage.objects;
drop policy if exists "storage_commercial_files_admin_delete" on storage.objects;

create policy "storage_commercial_files_admin_read"
  on storage.objects for select to authenticated
  using (bucket_id = 'commercial-files' and (select public.is_admin()));
create policy "storage_commercial_files_admin_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'commercial-files' and (select public.is_admin()));
create policy "storage_commercial_files_admin_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'commercial-files' and (select public.is_admin()))
  with check (bucket_id = 'commercial-files' and (select public.is_admin()));
create policy "storage_commercial_files_admin_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'commercial-files' and (select public.is_admin()));

-- Os relacionamentos financeiros passam a impedir hard delete de contrato e
-- cliente, preservando referências históricas e métricas.
alter table public.client_history drop constraint if exists client_history_client_id_fkey;
alter table public.client_history add constraint client_history_client_id_fkey
  foreign key (client_id) references public.commercial_clients(id) on delete restrict;
alter table public.ad_contracts drop constraint if exists ad_contracts_client_id_fkey;
alter table public.ad_contracts add constraint ad_contracts_client_id_fkey
  foreign key (client_id) references public.commercial_clients(id) on delete restrict;
alter table public.contract_history drop constraint if exists contract_history_contract_id_fkey;
alter table public.contract_history add constraint contract_history_contract_id_fkey
  foreign key (contract_id) references public.ad_contracts(id) on delete restrict;
alter table public.ad_assets drop constraint if exists ad_assets_contract_id_fkey;
alter table public.ad_assets add constraint ad_assets_contract_id_fkey
  foreign key (contract_id) references public.ad_contracts(id) on delete restrict;
alter table public.ad_impressions drop constraint if exists ad_impressions_contract_id_fkey;
alter table public.ad_impressions add constraint ad_impressions_contract_id_fkey
  foreign key (contract_id) references public.ad_contracts(id) on delete restrict;
alter table public.ad_clicks drop constraint if exists ad_clicks_contract_id_fkey;
alter table public.ad_clicks add constraint ad_clicks_contract_id_fkey
  foreign key (contract_id) references public.ad_contracts(id) on delete restrict;
alter table public.sponsored_articles drop constraint if exists sponsored_articles_contract_id_fkey;
alter table public.sponsored_articles add constraint sponsored_articles_contract_id_fkey
  foreign key (contract_id) references public.ad_contracts(id) on delete restrict;
alter table public.sponsored_events drop constraint if exists sponsored_events_contract_id_fkey;
alter table public.sponsored_events add constraint sponsored_events_contract_id_fkey
  foreign key (contract_id) references public.ad_contracts(id) on delete restrict;

create or replace function public.prevent_ad_contract_hard_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Contratos não podem ser excluídos; use cancelamento ou arquivamento.' using errcode = '55000';
  return old;
end;
$$;

revoke all on function public.prevent_ad_contract_hard_delete() from public, anon, authenticated;
drop trigger if exists trg_ad_contracts_prevent_delete on public.ad_contracts;
create trigger trg_ad_contracts_prevent_delete
  before delete on public.ad_contracts
  for each row execute function public.prevent_ad_contract_hard_delete();
