-- =====================================================================
-- Conecta Lapa — 0029 — Seções editoriais dinâmicas da home
-- =====================================================================

create table if not exists public.home_sections (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 2 and 120),
  subtitle text,
  description text,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'inactive' check (status in ('active', 'inactive')),
  display_order integer not null default 0 check (display_order >= 0),
  placement_zone text not null default 'after-latest-news'
    check (placement_zone in ('after-hero', 'after-latest-news', 'before-events', 'before-footer')),
  selection_mode text not null default 'manual' check (selection_mode in ('manual', 'automatic')),
  show_view_all boolean not null default true,
  view_all_mode text not null default 'internal' check (view_all_mode in ('internal', 'custom', 'hidden')),
  custom_view_all_url text,
  cover_image_url text,
  cover_image_alt text,
  automatic_rules jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (view_all_mode <> 'custom' or custom_view_all_url is not null),
  check (custom_view_all_url is null or custom_view_all_url ~* '^(https?://|/)')
);

create table if not exists public.home_section_posts (
  section_id uuid not null references public.home_sections(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (section_id, post_id)
);

create index if not exists home_sections_public_order_idx
  on public.home_sections (placement_zone, display_order, id) where status = 'active' and deleted_at is null;
create index if not exists home_sections_admin_order_idx on public.home_sections (display_order, created_at desc);
create index if not exists home_section_posts_order_idx on public.home_section_posts (section_id, display_order, post_id);

drop trigger if exists trg_home_sections_updated on public.home_sections;
create trigger trg_home_sections_updated before update on public.home_sections
  for each row execute function public.set_updated_at();
drop trigger if exists trg_home_section_posts_updated on public.home_section_posts;
create trigger trg_home_section_posts_updated before update on public.home_section_posts
  for each row execute function public.set_updated_at();

alter table public.home_sections enable row level security;
alter table public.home_section_posts enable row level security;

create policy home_sections_public_read on public.home_sections for select
  using (status = 'active' and deleted_at is null);
create policy home_sections_admin_all on public.home_sections for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy home_section_posts_public_read on public.home_section_posts for select using (
  exists (
    select 1 from public.home_sections s join public.posts p on p.id = post_id
    where s.id = section_id and s.status = 'active' and s.deleted_at is null
      and p.status = 'publicado' and p.moderation_status = 'aprovado'
      and p.published_at <= now()
  )
);
create policy home_section_posts_admin_all on public.home_section_posts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Substitui a lista manual em uma transação, preservando a ordem recebida.
-- A função é SECURITY INVOKER: RLS continua sendo aplicada e o papel é conferido.
create or replace function public.replace_home_section_posts(p_section_id uuid, p_post_ids uuid[])
returns void language plpgsql security invoker set search_path = public as $$
declare
  eligible_count integer;
begin
  if not public.is_admin() then raise exception 'Acesso restrito.'; end if;
  if cardinality(p_post_ids) > 100 then raise exception 'Máximo de 100 posts por seção.'; end if;
  if cardinality(p_post_ids) <> cardinality(array(select distinct unnest(p_post_ids))) then
    raise exception 'Um post não pode ser adicionado duas vezes.';
  end if;
  if not exists (select 1 from home_sections where id = p_section_id and deleted_at is null) then
    raise exception 'Seção não encontrada.';
  end if;
  select count(*) into eligible_count from posts
    where id = any(p_post_ids) and status = 'publicado' and moderation_status = 'aprovado'
      and published_at <= now();
  if eligible_count <> coalesce(cardinality(p_post_ids), 0) then
    raise exception 'A seleção inclui post indisponível publicamente.';
  end if;
  delete from home_section_posts where section_id = p_section_id;
  insert into home_section_posts (section_id, post_id, display_order)
    select p_section_id, post_id, ordinality - 1
    from unnest(p_post_ids) with ordinality as posts(post_id, ordinality);
end;
$$;
revoke all on function public.replace_home_section_posts(uuid, uuid[]) from public;
grant execute on function public.replace_home_section_posts(uuid, uuid[]) to authenticated;

-- Bucket público, com escrita exclusiva de administradores.
insert into storage.buckets (id, name, public) values ('section-covers', 'section-covers', true)
on conflict (id) do nothing;
create policy "storage_section_covers_admin" on storage.objects for all to authenticated
  using (bucket_id = 'section-covers' and public.is_admin())
  with check (bucket_id = 'section-covers' and public.is_admin());
