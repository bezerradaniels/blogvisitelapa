-- =====================================================================
-- Visite Lapa — 0004 — Comentários, avaliações e favoritos
-- =====================================================================

-- ---------------------------------------------------------------------
-- comments
-- ---------------------------------------------------------------------
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  parent_id  uuid references public.comments(id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 4000),
  status     comment_status not null default 'pendente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, status);
create index if not exists comments_user_idx on public.comments (user_id);

drop trigger if exists trg_comments_updated on public.comments;
create trigger trg_comments_updated before update on public.comments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- ratings — 1 avaliação por usuário por post (impede duplicidade)
-- ---------------------------------------------------------------------
create table if not exists public.ratings (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, user_id)
);
create index if not exists ratings_post_idx on public.ratings (post_id);

drop trigger if exists trg_ratings_updated on public.ratings;
create trigger trg_ratings_updated before update on public.ratings
  for each row execute function public.set_updated_at();

-- Recalcula média e contagem no post afetado
create or replace function public.recalc_post_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.post_id, old.post_id);
begin
  update public.posts p
  set rating_avg = coalesce((select round(avg(rating)::numeric, 2) from public.ratings where post_id = target), 0),
      rating_count = coalesce((select count(*) from public.ratings where post_id = target), 0)
  where p.id = target;
  return null;
end;
$$;

drop trigger if exists trg_ratings_recalc on public.ratings;
create trigger trg_ratings_recalc
  after insert or update or delete on public.ratings
  for each row execute function public.recalc_post_rating();

-- ---------------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------------
create table if not exists public.favorites (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);
create index if not exists favorites_user_idx on public.favorites (user_id);
