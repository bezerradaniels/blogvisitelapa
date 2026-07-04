-- =====================================================================
-- Visite Lapa — 0009 — Storage: buckets e políticas
-- =====================================================================

-- Buckets públicos para leitura (imagens servidas via next/image).
insert into storage.buckets (id, name, public)
values
  ('post-covers', 'post-covers', true),
  ('post-gallery', 'post-gallery', true),
  ('ad-banners', 'ad-banners', true),
  ('user-avatars', 'user-avatars', true),
  ('sponsored-content', 'sponsored-content', true)
on conflict (id) do nothing;

-- Leitura pública de todos os buckets acima.
create policy "storage_public_read"
  on storage.objects for select
  using (bucket_id in ('post-covers','post-gallery','ad-banners','user-avatars','sponsored-content'));

-- Upload de capas/galeria: publishers e admins.
create policy "storage_posts_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('post-covers','post-gallery') and public.is_publisher_or_admin());

create policy "storage_posts_update"
  on storage.objects for update to authenticated
  using (bucket_id in ('post-covers','post-gallery') and public.is_publisher_or_admin());

create policy "storage_posts_delete"
  on storage.objects for delete to authenticated
  using (bucket_id in ('post-covers','post-gallery') and public.is_publisher_or_admin());

-- Banners e conteúdo patrocinado: somente admin.
create policy "storage_ads_write"
  on storage.objects for all to authenticated
  using (bucket_id in ('ad-banners','sponsored-content') and public.is_admin())
  with check (bucket_id in ('ad-banners','sponsored-content') and public.is_admin());

-- Avatar: cada usuário gerencia arquivos na sua própria pasta (prefixo = user id).
create policy "storage_avatar_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'user-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "storage_avatar_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'user-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "storage_avatar_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'user-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
