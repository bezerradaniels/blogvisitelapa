-- =====================================================================
-- Visite Lapa — 0016 — Fotos privadas (respeitam a visibilidade do perfil)
-- =====================================================================
-- Problema: o bucket `user-photos` era público, então os arquivos das fotos
-- ficavam acessíveis/listáveis por URL direta, ignorando a visibilidade do
-- perfil (amigos/oculto) garantida na RLS das tabelas.
--
-- Correção: tornar o bucket privado e remover a leitura pública. O app passa a
-- servir as fotos via signed URLs geradas no servidor, apenas depois de a RLS
-- (can_view_profile) já ter liberado as linhas correspondentes.
--
-- Requisito de deploy: aplicar junto com a versão do app que assina as URLs
-- (features/photos/queries.ts). O código assina em buckets públicos e privados,
-- então pode ser publicado antes desta migração sem quebrar as imagens.
-- =====================================================================

-- Torna o bucket privado.
update storage.buckets set public = false where id = 'user-photos';

-- Remove a leitura pública (permitia SELECT/list de qualquer objeto do bucket).
drop policy if exists "storage_photos_read" on storage.objects;

-- Leitura restrita: apenas o dono (pasta = auth.uid) lê diretamente via RLS.
-- A visualização por terceiros autorizados acontece por signed URL emitida
-- pelo servidor (service role), após a checagem de can_view_profile no app.
create policy "storage_photos_owner_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'user-photos' and (storage.foldername(name))[1] = auth.uid()::text);
