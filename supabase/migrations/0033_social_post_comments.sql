-- =====================================================================
-- Visite Lapa — 0033 — Respostas (comentários) nos posts do feed social
-- =====================================================================

create table if not exists public.social_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists social_post_comments_post_created_idx
  on public.social_post_comments (post_id, created_at);
create index if not exists social_post_comments_author_idx
  on public.social_post_comments (author_id, created_at desc);

alter table public.social_posts
  add column if not exists comment_count integer not null default 0 check (comment_count >= 0);

drop trigger if exists trg_social_post_comments_updated on public.social_post_comments;
create trigger trg_social_post_comments_updated before update on public.social_post_comments
  for each row execute function public.set_updated_at();

create or replace function public.update_social_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.social_posts
  set comment_count = greatest(0, comment_count + case when tg_op = 'INSERT' then 1 else -1 end)
  where id = coalesce(new.post_id, old.post_id);
  return null;
end;
$$;

drop trigger if exists trg_social_post_comment_count on public.social_post_comments;
create trigger trg_social_post_comment_count
  after insert or delete on public.social_post_comments
  for each row execute function public.update_social_post_comment_count();

revoke execute on function public.update_social_post_comment_count() from public, anon, authenticated;

alter table public.social_post_comments enable row level security;

create policy social_post_comments_read on public.social_post_comments
  for select to authenticated
  using (
    exists (
      select 1 from public.social_posts p
      where p.id = post_id and (select public.can_view_profile(p.author_id))
    )
  );

create policy social_post_comments_insert on public.social_post_comments
  for insert to authenticated
  with check (
    author_id = (select public.current_profile_id())
    and exists (
      select 1 from public.social_posts p
      where p.id = post_id and (select public.can_view_profile(p.author_id))
    )
  );

create policy social_post_comments_delete on public.social_post_comments
  for delete to authenticated
  using (
    author_id = (select public.current_profile_id())
    or (select public.is_admin())
    or exists (
      select 1 from public.social_posts p
      where p.id = post_id and p.author_id = (select public.current_profile_id())
    )
  );

revoke all on table public.social_post_comments from anon;
grant select, insert, delete on table public.social_post_comments to authenticated;
