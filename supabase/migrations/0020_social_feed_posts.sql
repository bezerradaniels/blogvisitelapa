-- =====================================================================
-- Visite Lapa — 0020 — Posts curtos e feed social
-- =====================================================================

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  repost_of uuid references public.social_posts(id) on delete cascade,
  like_count integer not null default 0 check (like_count >= 0),
  repost_count integer not null default 0 check (repost_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (repost_of is null and char_length(btrim(content)) between 1 and 180)
    or (repost_of is not null and content is null)
  ),
  unique (author_id, repost_of)
);

create index if not exists social_posts_author_created_idx
  on public.social_posts (author_id, created_at desc);
create index if not exists social_posts_feed_idx
  on public.social_posts (created_at desc, id desc);
create index if not exists social_posts_repost_of_idx
  on public.social_posts (repost_of) where repost_of is not null;

create table if not exists public.social_post_likes (
  post_id uuid not null references public.social_posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);
create index if not exists social_post_likes_profile_idx
  on public.social_post_likes (profile_id, created_at desc);

create table if not exists public.social_post_mentions (
  post_id uuid not null references public.social_posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);
create index if not exists social_post_mentions_profile_idx
  on public.social_post_mentions (profile_id, created_at desc);

create table if not exists public.social_post_hashtags (
  post_id uuid not null references public.social_posts(id) on delete cascade,
  tag text not null check (char_length(tag) between 1 and 50 and tag = lower(tag)),
  created_at timestamptz not null default now(),
  primary key (post_id, tag)
);
create index if not exists social_post_hashtags_tag_created_idx
  on public.social_post_hashtags (tag, created_at desc);

drop trigger if exists trg_social_posts_updated on public.social_posts;
create trigger trg_social_posts_updated before update on public.social_posts
  for each row execute function public.set_updated_at();

create or replace function public.update_social_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.social_posts
  set like_count = greatest(0, like_count + case when tg_op = 'INSERT' then 1 else -1 end)
  where id = coalesce(new.post_id, old.post_id);
  return null;
end;
$$;

drop trigger if exists trg_social_post_like_count on public.social_post_likes;
create trigger trg_social_post_like_count
  after insert or delete on public.social_post_likes
  for each row execute function public.update_social_post_like_count();

create or replace function public.update_social_post_repost_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.repost_of, old.repost_of);
begin
  if target is not null then
    update public.social_posts
    set repost_count = greatest(0, repost_count + case when tg_op = 'INSERT' then 1 else -1 end)
    where id = target;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_social_post_repost_count on public.social_posts;
create trigger trg_social_post_repost_count
  after insert or delete on public.social_posts
  for each row execute function public.update_social_post_repost_count();

revoke execute on function public.update_social_post_like_count() from public, anon, authenticated;
revoke execute on function public.update_social_post_repost_count() from public, anon, authenticated;

alter table public.social_posts enable row level security;
alter table public.social_post_likes enable row level security;
alter table public.social_post_mentions enable row level security;
alter table public.social_post_hashtags enable row level security;

create policy social_posts_read on public.social_posts
  for select to authenticated
  using ((select public.can_view_profile(author_id)));

create policy social_posts_insert on public.social_posts
  for insert to authenticated
  with check (author_id = (select public.current_profile_id()));

create policy social_posts_delete on public.social_posts
  for delete to authenticated
  using (author_id = (select public.current_profile_id()) or (select public.is_admin()));

create policy social_post_likes_read on public.social_post_likes
  for select to authenticated
  using (exists (select 1 from public.social_posts p where p.id = post_id));

create policy social_post_likes_insert on public.social_post_likes
  for insert to authenticated
  with check (
    profile_id = (select public.current_profile_id())
    and exists (select 1 from public.social_posts p where p.id = post_id)
  );

create policy social_post_likes_delete on public.social_post_likes
  for delete to authenticated
  using (profile_id = (select public.current_profile_id()));

create policy social_post_mentions_read on public.social_post_mentions
  for select to authenticated
  using (exists (select 1 from public.social_posts p where p.id = post_id));

create policy social_post_mentions_insert on public.social_post_mentions
  for insert to authenticated
  with check (
    exists (
      select 1 from public.social_posts p
      where p.id = post_id and p.author_id = (select public.current_profile_id())
    )
  );

create policy social_post_hashtags_read on public.social_post_hashtags
  for select to authenticated
  using (exists (select 1 from public.social_posts p where p.id = post_id));

create policy social_post_hashtags_insert on public.social_post_hashtags
  for insert to authenticated
  with check (
    exists (
      select 1 from public.social_posts p
      where p.id = post_id and p.author_id = (select public.current_profile_id())
    )
  );

revoke all on table public.social_posts, public.social_post_likes,
  public.social_post_mentions, public.social_post_hashtags from anon;
grant select, insert, delete on table public.social_posts to authenticated;
grant select, insert, delete on table public.social_post_likes to authenticated;
grant select, insert on table public.social_post_mentions, public.social_post_hashtags to authenticated;
