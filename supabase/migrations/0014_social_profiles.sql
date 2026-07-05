-- =====================================================================
-- Visite Lapa — 0014 — Perfis públicos + camada social (Orkut)
-- Perfil social por usuário com "mostrar/ocultar" (visibilidade global),
-- amizades, mural/recados (só amigos) e depoimentos (com aprovação do dono).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
do $$ begin
  create type profile_visibility as enum ('publico', 'amigos', 'oculto');
exception when duplicate_object then null; end $$;

do $$ begin
  create type friendship_status as enum ('pendente', 'aceito');
exception when duplicate_object then null; end $$;

do $$ begin
  create type testimonial_status as enum ('pendente', 'aprovado', 'oculto');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- profile_details — extensão social 1:1 de profiles, com RLS própria.
-- Separado de profiles para honrar "oculto" sem afetar a RLS de profiles.
-- ---------------------------------------------------------------------
create table if not exists public.profile_details (
  profile_id   uuid primary key references public.profiles(id) on delete cascade,
  visibility   profile_visibility not null default 'publico',
  nickname     text check (char_length(nickname) <= 60),
  city         text check (char_length(city) <= 120),
  birth_date   date,
  relationship text check (char_length(relationship) <= 60),
  interests    text check (char_length(interests) <= 2000),
  about        text check (char_length(about) <= 4000),
  cover_url    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists trg_profile_details_updated on public.profile_details;
create trigger trg_profile_details_updated before update on public.profile_details
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- friendships — pedido/aceite; simétrica quando 'aceito'.
-- ---------------------------------------------------------------------
create table if not exists public.friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status       friendship_status not null default 'pendente',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);
create index if not exists friendships_requester_idx on public.friendships (requester_id, status);
create index if not exists friendships_addressee_idx on public.friendships (addressee_id, status);

drop trigger if exists trg_friendships_updated on public.friendships;
create trigger trg_friendships_updated before update on public.friendships
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- scraps — mural/recados (texto puro).
-- ---------------------------------------------------------------------
create table if not exists public.scraps (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists scraps_profile_idx on public.scraps (profile_id, created_at desc);

-- ---------------------------------------------------------------------
-- testimonials — depoimentos (exigem aprovação do dono).
-- ---------------------------------------------------------------------
create table if not exists public.testimonials (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 2000),
  status     testimonial_status not null default 'pendente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, author_id)
);
create index if not exists testimonials_profile_idx on public.testimonials (profile_id, status);

drop trigger if exists trg_testimonials_updated on public.testimonials;
create trigger trg_testimonials_updated before update on public.testimonials
  for each row execute function public.set_updated_at();

-- =====================================================================
-- Helpers de autorização (SECURITY DEFINER — usados nas policies)
-- =====================================================================
create or replace function public.current_profile_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.profiles where user_id = auth.uid() limit 1;
$$;

create or replace function public.are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'aceito'
      and ((f.requester_id = a and f.addressee_id = b)
        or (f.requester_id = b and f.addressee_id = a))
  );
$$;

create or replace function public.can_view_profile(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    coalesce((select visibility from public.profile_details where profile_id = target), 'publico') = 'publico'
    or target = public.current_profile_id()
    or public.is_admin()
    or (
      coalesce((select visibility from public.profile_details where profile_id = target), 'publico') = 'amigos'
      and public.are_friends(target, public.current_profile_id())
    );
$$;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profile_details enable row level security;
alter table public.friendships     enable row level security;
alter table public.scraps          enable row level security;
alter table public.testimonials    enable row level security;

-- profile_details
create policy profile_details_read on public.profile_details
  for select using (public.can_view_profile(profile_id));

create policy profile_details_self_write on public.profile_details
  for insert with check (profile_id = public.current_profile_id() or public.is_admin());

create policy profile_details_self_update on public.profile_details
  for update using (profile_id = public.current_profile_id() or public.is_admin())
  with check (profile_id = public.current_profile_id() or public.is_admin());

-- friendships
create policy friendships_read on public.friendships
  for select using (
    status = 'aceito'
    or requester_id = public.current_profile_id()
    or addressee_id = public.current_profile_id()
    or public.is_admin()
  );

create policy friendships_request on public.friendships
  for insert with check (requester_id = public.current_profile_id());

create policy friendships_update on public.friendships
  for update using (
    requester_id = public.current_profile_id()
    or addressee_id = public.current_profile_id()
    or public.is_admin()
  ) with check (
    requester_id = public.current_profile_id()
    or addressee_id = public.current_profile_id()
    or public.is_admin()
  );

create policy friendships_delete on public.friendships
  for delete using (
    requester_id = public.current_profile_id()
    or addressee_id = public.current_profile_id()
    or public.is_admin()
  );

-- scraps (mural) — só amigos postam; leitura segue visibilidade do perfil.
create policy scraps_read on public.scraps
  for select using (public.can_view_profile(profile_id));

create policy scraps_insert on public.scraps
  for insert with check (
    author_id = public.current_profile_id()
    and (
      profile_id = public.current_profile_id()
      or public.are_friends(public.current_profile_id(), profile_id)
    )
  );

create policy scraps_delete on public.scraps
  for delete using (
    profile_id = public.current_profile_id()
    or author_id = public.current_profile_id()
    or public.is_admin()
  );

-- testimonials (depoimentos) — só amigos escrevem; dono aprova/oculta.
create policy testimonials_read on public.testimonials
  for select using (
    (status = 'aprovado' and public.can_view_profile(profile_id))
    or author_id = public.current_profile_id()
    or profile_id = public.current_profile_id()
    or public.is_admin()
  );

create policy testimonials_insert on public.testimonials
  for insert with check (
    author_id = public.current_profile_id()
    and author_id <> profile_id
    and public.are_friends(public.current_profile_id(), profile_id)
  );

create policy testimonials_update on public.testimonials
  for update using (
    profile_id = public.current_profile_id()
    or author_id = public.current_profile_id()
    or public.is_admin()
  ) with check (
    profile_id = public.current_profile_id()
    or author_id = public.current_profile_id()
    or public.is_admin()
  );

create policy testimonials_delete on public.testimonials
  for delete using (
    profile_id = public.current_profile_id()
    or author_id = public.current_profile_id()
    or public.is_admin()
  );

-- =====================================================================
-- Backfill: garante slug para perfis ativos (necessário p/ /u/[slug]).
-- =====================================================================
do $$
declare
  r record;
  base text;
  candidate text;
  n int;
begin
  for r in select id, full_name from public.profiles where slug is null loop
    base := regexp_replace(
              lower(translate(coalesce(r.full_name, 'usuario'),
                'àáâãäçèéêëìíîïñòóôõöùúûü', 'aaaaaceeeeiiiinooooouuuu')),
              '[^a-z0-9]+', '-', 'g');
    base := trim(both '-' from base);
    if base = '' then base := 'usuario'; end if;
    candidate := base;
    n := 1;
    while exists (select 1 from public.profiles where slug = candidate) loop
      n := n + 1;
      candidate := base || '-' || substr(r.id::text, 1, 4) || case when n > 2 then '-' || n::text else '' end;
    end loop;
    update public.profiles set slug = candidate where id = r.id;
  end loop;
end $$;
