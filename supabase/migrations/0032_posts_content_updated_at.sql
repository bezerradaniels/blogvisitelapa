-- =====================================================================
-- Visite Lapa — 0032 — updated_at de posts só muda em edição de conteúdo
-- =====================================================================
-- Antes, o trigger genérico set_updated_at() bumpava updated_at em QUALQUER
-- update (publicar, destacar, arquivar, moderar, métricas), fazendo o post
-- aparecer como "Atualizado" mesmo sem edição real do conteúdo.
-- Este trigger específico só atualiza updated_at quando um campo de conteúdo
-- efetivamente muda; ações de status/moderação/métricas não contam.

create or replace function public.set_posts_content_updated_at()
returns trigger
language plpgsql
as $$
begin
  if (
    new.title              is distinct from old.title
    or new.subtitle        is distinct from old.subtitle
    or new.slug            is distinct from old.slug
    or new.excerpt         is distinct from old.excerpt
    or new.content_html    is distinct from old.content_html
    or new.content_json    is distinct from old.content_json
    or new.cover_image_url is distinct from old.cover_image_url
    or new.cover_image_alt is distinct from old.cover_image_alt
    or new.category_id     is distinct from old.category_id
    or new.content_type    is distinct from old.content_type
    or new.is_sponsored    is distinct from old.is_sponsored
    or new.is_event        is distinct from old.is_event
    or new.event_start_date is distinct from old.event_start_date
    or new.event_end_date  is distinct from old.event_end_date
    or new.event_location  is distinct from old.event_location
    or new.event_address   is distinct from old.event_address
    or new.event_ticket_url is distinct from old.event_ticket_url
    or new.event_organizer is distinct from old.event_organizer
    or new.event_map_url   is distinct from old.event_map_url
    or new.source_note     is distinct from old.source_note
    or new.editorial_notes is distinct from old.editorial_notes
    or new.seo_title       is distinct from old.seo_title
    or new.seo_description is distinct from old.seo_description
    or new.focus_keyword   is distinct from old.focus_keyword
    or new.local_seo_keyword is distinct from old.local_seo_keyword
    or new.social_title    is distinct from old.social_title
    or new.social_description is distinct from old.social_description
    or new.social_image_url is distinct from old.social_image_url
    or new.allow_indexing  is distinct from old.allow_indexing
    or new.include_in_sitemap is distinct from old.include_in_sitemap
    or new.include_in_rss  is distinct from old.include_in_rss
  ) then
    new.updated_at = now();
  else
    new.updated_at = old.updated_at;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_posts_updated on public.posts;
create trigger trg_posts_updated before update on public.posts
  for each row execute function public.set_posts_content_updated_at();

-- Baseline dos posts existentes: quem só foi "atualizado" por moderação/publicação
-- (updated_at posterior à publicação) volta a refletir a data de publicação/criação,
-- eliminando o "Atualizado" falso. Edições reais de conteúdo futuras voltam a marcar.
-- O trigger é desativado durante o backfill, senão ele preservaria o updated_at antigo
-- (nenhuma coluna de conteúdo muda neste update) e anularia a correção.
alter table public.posts disable trigger trg_posts_updated;
update public.posts
set updated_at = coalesce(published_at, created_at)
where updated_at > coalesce(published_at, created_at);
alter table public.posts enable trigger trg_posts_updated;
