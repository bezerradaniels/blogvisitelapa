-- =====================================================================
-- Visite Lapa — 0007 — Métricas de acesso, auditoria, settings, newsletter
-- =====================================================================

-- ---------------------------------------------------------------------
-- page_views / post_views — contagem simples de acessos
-- ---------------------------------------------------------------------
create table if not exists public.page_views (
  id         uuid primary key default gen_random_uuid(),
  path       text not null,
  referrer   text,
  created_at timestamptz not null default now()
);
create index if not exists page_views_path_idx on public.page_views (path, created_at);

create table if not exists public.post_views (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists post_views_post_idx on public.post_views (post_id, created_at);

-- Incrementa o contador denormalizado no post e registra o acesso.
create or replace function public.register_post_view(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.post_views (post_id) values (p_post_id);
  update public.posts set views_count = views_count + 1 where id = p_post_id;
end;
$$;

-- ---------------------------------------------------------------------
-- audit_logs — trilha de auditoria administrativa
-- ---------------------------------------------------------------------
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,          -- ex.: post.publicado, contrato.pausado
  entity      text,                   -- ex.: posts, ad_contracts
  entity_id   uuid,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity, entity_id);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);

-- ---------------------------------------------------------------------
-- settings — configurações chave/valor do site
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  description text,
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_settings_updated on public.settings;
create trigger trg_settings_updated before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- newsletter_subscribers — estrutura pronta (envio ativado no futuro)
-- ---------------------------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  name          text,
  confirmed     boolean not null default false,
  unsubscribed  boolean not null default false,
  created_at    timestamptz not null default now()
);
