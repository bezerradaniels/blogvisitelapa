-- =====================================================================
-- Visite Lapa — 0013 — Comunidades (área social estilo Orkut)
-- Comunidades + fóruns (tópicos e respostas). Criação livre por qualquer
-- usuário logado; pós-moderação + denúncia (sem aprovação prévia).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
do $$ begin
  create type community_status as enum ('ativa', 'suspensa', 'removida');
exception when duplicate_object then null; end $$;

do $$ begin
  create type community_role as enum ('dono', 'moderador', 'membro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type community_post_status as enum ('visivel', 'removido');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_reason as enum ('spam', 'ofensivo', 'off_topic', 'ilegal', 'outro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('aberta', 'resolvida', 'descartada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type community_category as enum (
    'cidade', 'religiosidade', 'cultura', 'esportes', 'gastronomia',
    'educacao', 'negocios', 'humor', 'outros'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- communities
-- ---------------------------------------------------------------------
create table if not exists public.communities (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  name            text not null check (char_length(name) between 3 and 120),
  slug            text not null unique,
  description     text check (char_length(description) <= 2000),
  category        community_category not null default 'outros',
  avatar_url      text,
  cover_image_url text,
  rules           text check (char_length(rules) <= 4000),
  member_count    integer not null default 0,
  topic_count     integer not null default 0,
  status          community_status not null default 'ativa',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists communities_slug_idx     on public.communities (slug);
create index if not exists communities_category_idx on public.communities (category);
create index if not exists communities_status_idx   on public.communities (status);

drop trigger if exists trg_communities_updated on public.communities;
create trigger trg_communities_updated before update on public.communities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- community_members
-- ---------------------------------------------------------------------
create table if not exists public.community_members (
  id           uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  role         community_role not null default 'membro',
  created_at   timestamptz not null default now(),
  unique (community_id, user_id)
);
create index if not exists community_members_community_idx on public.community_members (community_id);
create index if not exists community_members_user_idx      on public.community_members (user_id);

-- ---------------------------------------------------------------------
-- community_topics (tópicos do fórum)
-- ---------------------------------------------------------------------
create table if not exists public.community_topics (
  id               uuid primary key default gen_random_uuid(),
  community_id     uuid not null references public.communities(id) on delete cascade,
  author_id        uuid not null references public.profiles(id) on delete cascade,
  title            text not null check (char_length(title) between 3 and 200),
  slug             text not null,
  content          text not null check (char_length(content) between 1 and 10000),
  is_pinned        boolean not null default false,
  is_locked        boolean not null default false,
  reply_count      integer not null default 0,
  last_activity_at timestamptz not null default now(),
  status           community_post_status not null default 'visivel',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (community_id, slug)
);
create index if not exists community_topics_community_idx on public.community_topics (community_id, status);
create index if not exists community_topics_author_idx    on public.community_topics (author_id);

drop trigger if exists trg_community_topics_updated on public.community_topics;
create trigger trg_community_topics_updated before update on public.community_topics
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- community_replies (respostas nos tópicos)
-- ---------------------------------------------------------------------
create table if not exists public.community_replies (
  id         uuid primary key default gen_random_uuid(),
  topic_id   uuid not null references public.community_topics(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 10000),
  status     community_post_status not null default 'visivel',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_replies_topic_idx  on public.community_replies (topic_id, status);
create index if not exists community_replies_author_idx on public.community_replies (author_id);

drop trigger if exists trg_community_replies_updated on public.community_replies;
create trigger trg_community_replies_updated before update on public.community_replies
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- community_reports (denúncias de conteúdo)
-- ---------------------------------------------------------------------
create table if not exists public.community_reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('comunidade', 'topico', 'resposta')),
  target_id   uuid not null,
  reason      report_reason not null,
  details     text check (char_length(details) <= 2000),
  status      report_status not null default 'aberta',
  resolved_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists community_reports_status_idx on public.community_reports (status);
create index if not exists community_reports_target_idx on public.community_reports (target_type, target_id);

-- =====================================================================
-- Helpers de autorização (SECURITY DEFINER — usados nas policies)
-- =====================================================================
create or replace function public.is_community_member(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_members m
    join public.profiles p on p.id = m.user_id
    where m.community_id = cid and p.user_id = auth.uid()
  );
$$;

create or replace function public.is_community_owner(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_members m
    join public.profiles p on p.id = m.user_id
    where m.community_id = cid and m.role = 'dono' and p.user_id = auth.uid()
  );
$$;

create or replace function public.is_community_moderator(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1
    from public.community_members m
    join public.profiles p on p.id = m.user_id
    where m.community_id = cid
      and m.role in ('dono', 'moderador')
      and p.user_id = auth.uid()
  );
$$;

-- =====================================================================
-- Triggers de manutenção (contadores + auto-membro do dono)
-- =====================================================================

-- Ao criar a comunidade, o dono já entra como membro 'dono'.
create or replace function public.community_add_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.community_members (community_id, user_id, role)
  values (new.id, new.owner_id, 'dono')
  on conflict (community_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_community_owner_membership on public.communities;
create trigger trg_community_owner_membership
  after insert on public.communities
  for each row execute function public.community_add_owner_membership();

-- Recalcula member_count na comunidade afetada.
create or replace function public.recalc_community_members()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.community_id, old.community_id);
begin
  update public.communities c
  set member_count = (select count(*) from public.community_members where community_id = target)
  where c.id = target;
  return null;
end;
$$;

drop trigger if exists trg_community_members_count on public.community_members;
create trigger trg_community_members_count
  after insert or delete on public.community_members
  for each row execute function public.recalc_community_members();

-- Recalcula topic_count (apenas tópicos visíveis) na comunidade afetada.
create or replace function public.recalc_community_topics()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.community_id, old.community_id);
begin
  update public.communities c
  set topic_count = (
    select count(*) from public.community_topics
    where community_id = target and status = 'visivel'
  )
  where c.id = target;
  return null;
end;
$$;

drop trigger if exists trg_community_topics_count on public.community_topics;
create trigger trg_community_topics_count
  after insert or delete or update of status on public.community_topics
  for each row execute function public.recalc_community_topics();

-- Ao inserir resposta visível, incrementa reply_count e atualiza last_activity_at.
create or replace function public.bump_topic_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.topic_id, old.topic_id);
begin
  update public.community_topics t
  set reply_count = (
        select count(*) from public.community_replies
        where topic_id = target and status = 'visivel'
      ),
      last_activity_at = greatest(t.last_activity_at, coalesce(new.created_at, now()))
  where t.id = target;
  return null;
end;
$$;

drop trigger if exists trg_community_replies_activity on public.community_replies;
create trigger trg_community_replies_activity
  after insert or delete or update of status on public.community_replies
  for each row execute function public.bump_topic_activity();

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.communities       enable row level security;
alter table public.community_members enable row level security;
alter table public.community_topics  enable row level security;
alter table public.community_replies enable row level security;
alter table public.community_reports enable row level security;

-- ---------------------------------------------------------------------
-- communities
-- ---------------------------------------------------------------------
create policy communities_public_read on public.communities
  for select using (
    status = 'ativa'
    or owner_id in (select id from public.profiles where user_id = auth.uid())
    or public.is_admin()
  );

-- Qualquer usuário logado cria a própria comunidade (nasce ativa por default).
create policy communities_user_insert on public.communities
  for insert with check (
    owner_id in (select id from public.profiles where user_id = auth.uid())
  );

-- Dono/moderador editam a comunidade; admin idem.
create policy communities_moderator_update on public.communities
  for update using (public.is_community_moderator(id))
  with check (public.is_community_moderator(id));

-- Exclusão física apenas por admin (moderação usa status).
create policy communities_admin_delete on public.communities
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------
-- community_members
-- ---------------------------------------------------------------------
create policy community_members_public_read on public.community_members
  for select using (true);

-- Entrar: o próprio usuário se inscreve.
create policy community_members_self_join on public.community_members
  for insert with check (
    user_id in (select id from public.profiles where user_id = auth.uid())
  );

-- Sair (self) ou moderador/admin remove membro.
create policy community_members_delete on public.community_members
  for delete using (
    user_id in (select id from public.profiles where user_id = auth.uid())
    or public.is_community_moderator(community_id)
  );

-- Mudança de papel (promover moderador etc.): dono ou admin.
create policy community_members_role_update on public.community_members
  for update using (public.is_admin() or public.is_community_owner(community_id))
  with check (public.is_admin() or public.is_community_owner(community_id));

-- ---------------------------------------------------------------------
-- community_topics
-- ---------------------------------------------------------------------
create policy community_topics_public_read on public.community_topics
  for select using (
    status = 'visivel'
    or author_id in (select id from public.profiles where user_id = auth.uid())
    or public.is_community_moderator(community_id)
  );

-- Só membros de comunidade ativa criam tópico; autor = próprio perfil.
create policy community_topics_member_insert on public.community_topics
  for insert with check (
    author_id in (select id from public.profiles where user_id = auth.uid())
    and public.is_community_member(community_id)
    and exists (select 1 from public.communities c where c.id = community_id and c.status = 'ativa')
  );

-- Autor edita o próprio tópico; moderador modera (fixar/travar/remover).
create policy community_topics_update on public.community_topics
  for update using (
    author_id in (select id from public.profiles where user_id = auth.uid())
    or public.is_community_moderator(community_id)
  ) with check (
    author_id in (select id from public.profiles where user_id = auth.uid())
    or public.is_community_moderator(community_id)
  );

create policy community_topics_delete on public.community_topics
  for delete using (public.is_community_moderator(community_id));

-- ---------------------------------------------------------------------
-- community_replies
-- ---------------------------------------------------------------------
create policy community_replies_public_read on public.community_replies
  for select using (
    status = 'visivel'
    or author_id in (select id from public.profiles where user_id = auth.uid())
    or public.is_community_moderator(
         (select community_id from public.community_topics t where t.id = topic_id)
       )
  );

-- Só membros respondem, em tópico visível e destravado, comunidade ativa.
create policy community_replies_member_insert on public.community_replies
  for insert with check (
    author_id in (select id from public.profiles where user_id = auth.uid())
    and exists (
      select 1
      from public.community_topics t
      join public.communities c on c.id = t.community_id
      where t.id = topic_id
        and t.status = 'visivel'
        and t.is_locked = false
        and c.status = 'ativa'
        and public.is_community_member(t.community_id)
    )
  );

create policy community_replies_update on public.community_replies
  for update using (
    author_id in (select id from public.profiles where user_id = auth.uid())
    or public.is_community_moderator(
         (select community_id from public.community_topics t where t.id = topic_id)
       )
  ) with check (
    author_id in (select id from public.profiles where user_id = auth.uid())
    or public.is_community_moderator(
         (select community_id from public.community_topics t where t.id = topic_id)
       )
  );

create policy community_replies_delete on public.community_replies
  for delete using (
    public.is_community_moderator(
      (select community_id from public.community_topics t where t.id = topic_id)
    )
  );

-- ---------------------------------------------------------------------
-- community_reports — qualquer autenticado denuncia; só admin lê/resolve.
-- ---------------------------------------------------------------------
create policy community_reports_user_insert on public.community_reports
  for insert with check (
    reporter_id in (select id from public.profiles where user_id = auth.uid())
  );

create policy community_reports_admin_read on public.community_reports
  for select using (public.is_admin());

create policy community_reports_admin_update on public.community_reports
  for update using (public.is_admin()) with check (public.is_admin());
