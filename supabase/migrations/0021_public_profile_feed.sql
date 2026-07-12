-- =====================================================================
-- Visite Lapa — 0021 — Feed em perfis públicos
-- Permite leitura anônima somente quando can_view_profile autoriza o perfil.
-- =====================================================================

grant select on table public.social_posts to anon;

drop policy if exists social_posts_public_profile_read on public.social_posts;
create policy social_posts_public_profile_read on public.social_posts
  for select
  to anon
  using ((select public.can_view_profile(author_id)));
