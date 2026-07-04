-- =====================================================================
-- Visite Lapa — 0008 — Row Level Security (RLS)
-- Nunca confie apenas no frontend: a autorização real vive aqui.
-- =====================================================================

-- Habilita RLS em todas as tabelas do schema public.
alter table public.profiles              enable row level security;
alter table public.categories            enable row level security;
alter table public.tags                  enable row level security;
alter table public.posts                 enable row level security;
alter table public.post_tags             enable row level security;
alter table public.post_images           enable row level security;
alter table public.post_gallery          enable row level security;
alter table public.related_posts         enable row level security;
alter table public.comments              enable row level security;
alter table public.ratings               enable row level security;
alter table public.favorites             enable row level security;
alter table public.contacts              enable row level security;
alter table public.advertiser_contacts   enable row level security;
alter table public.commercial_clients    enable row level security;
alter table public.client_history        enable row level security;
alter table public.ad_contracts          enable row level security;
alter table public.ad_assets             enable row level security;
alter table public.contract_history      enable row level security;
alter table public.ad_impressions        enable row level security;
alter table public.ad_clicks             enable row level security;
alter table public.sponsored_articles    enable row level security;
alter table public.sponsored_events      enable row level security;
alter table public.standalone_products   enable row level security;
alter table public.page_views            enable row level security;
alter table public.post_views            enable row level security;
alter table public.audit_logs            enable row level security;
alter table public.settings              enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
-- Leitura pública de perfis ativos (páginas de autor).
create policy profiles_public_read on public.profiles
  for select using (status = 'active' or auth.uid() = user_id or public.is_admin());

-- Usuário atualiza o próprio perfil (mudança de role/status é bloqueada por trigger abaixo).
create policy profiles_self_update on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Admin gerencia todos os perfis.
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- Guarda: impede que um não-admin altere o próprio role/status.
create or replace function public.guard_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role or new.status is distinct from old.status then
      raise exception 'Alteração de role/status permitida apenas para administradores.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_guard on public.profiles;
create trigger trg_profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_privileged_fields();

-- ---------------------------------------------------------------------
-- categories / tags — leitura pública, escrita admin
-- ---------------------------------------------------------------------
create policy categories_public_read on public.categories
  for select using (status = 'active' or public.is_admin());
create policy categories_admin_write on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy tags_public_read on public.tags
  for select using (true);
create policy tags_admin_write on public.tags
  for all using (public.is_admin()) with check (public.is_admin());
-- Publishers também podem criar tags ao escrever posts.
create policy tags_publisher_insert on public.tags
  for insert with check (public.is_publisher_or_admin());

-- ---------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------
-- Público: apenas publicados e aprovados.
create policy posts_public_read on public.posts
  for select using (
    (status = 'publicado' and moderation_status = 'aprovado')
    or author_id in (select id from public.profiles where user_id = auth.uid())
    or public.is_admin()
  );

-- Publisher/admin cria post (autor deve ser o próprio perfil).
create policy posts_author_insert on public.posts
  for insert with check (
    public.is_publisher_or_admin()
    and author_id in (select id from public.profiles where user_id = auth.uid())
  );

-- Autor edita o próprio post; admin edita qualquer um.
create policy posts_author_update on public.posts
  for update using (
    public.is_admin()
    or author_id in (select id from public.profiles where user_id = auth.uid())
  ) with check (
    public.is_admin()
    or author_id in (select id from public.profiles where user_id = auth.uid())
  );

-- Exclusão: admin (autores usam status 'removido').
create policy posts_admin_delete on public.posts
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------
-- Tabelas dependentes do post (tags, imagens, galeria, relacionados)
-- Leitura acompanha a visibilidade do post; escrita é do autor/admin.
-- ---------------------------------------------------------------------
create policy post_tags_read on public.post_tags for select using (
  exists (select 1 from public.posts p where p.id = post_id
    and ((p.status='publicado' and p.moderation_status='aprovado')
      or p.author_id in (select id from public.profiles where user_id = auth.uid())
      or public.is_admin())));
create policy post_tags_write on public.post_tags for all using (
  exists (select 1 from public.posts p where p.id = post_id
    and (public.is_admin() or p.author_id in (select id from public.profiles where user_id = auth.uid())))
) with check (
  exists (select 1 from public.posts p where p.id = post_id
    and (public.is_admin() or p.author_id in (select id from public.profiles where user_id = auth.uid()))));

create policy post_images_read on public.post_images for select using (
  exists (select 1 from public.posts p where p.id = post_id
    and ((p.status='publicado' and p.moderation_status='aprovado')
      or p.author_id in (select id from public.profiles where user_id = auth.uid())
      or public.is_admin())));
create policy post_images_write on public.post_images for all using (
  exists (select 1 from public.posts p where p.id = post_id
    and (public.is_admin() or p.author_id in (select id from public.profiles where user_id = auth.uid())))
) with check (
  exists (select 1 from public.posts p where p.id = post_id
    and (public.is_admin() or p.author_id in (select id from public.profiles where user_id = auth.uid()))));

create policy post_gallery_read on public.post_gallery for select using (
  exists (select 1 from public.posts p where p.id = post_id
    and ((p.status='publicado' and p.moderation_status='aprovado')
      or p.author_id in (select id from public.profiles where user_id = auth.uid())
      or public.is_admin())));
create policy post_gallery_write on public.post_gallery for all using (
  exists (select 1 from public.posts p where p.id = post_id
    and (public.is_admin() or p.author_id in (select id from public.profiles where user_id = auth.uid())))
) with check (
  exists (select 1 from public.posts p where p.id = post_id
    and (public.is_admin() or p.author_id in (select id from public.profiles where user_id = auth.uid()))));

create policy related_posts_read on public.related_posts for select using (true);
create policy related_posts_write on public.related_posts for all using (
  exists (select 1 from public.posts p where p.id = post_id
    and (public.is_admin() or p.author_id in (select id from public.profiles where user_id = auth.uid())))
) with check (
  exists (select 1 from public.posts p where p.id = post_id
    and (public.is_admin() or p.author_id in (select id from public.profiles where user_id = auth.uid()))));

-- ---------------------------------------------------------------------
-- comments — moderação: todos exigem aprovação
-- ---------------------------------------------------------------------
create policy comments_public_read on public.comments
  for select using (
    status = 'aprovado'
    or user_id in (select id from public.profiles where user_id = auth.uid())
    or public.is_admin()
  );
-- Usuário autenticado comenta (status inicial 'pendente' vem do default).
create policy comments_user_insert on public.comments
  for insert with check (
    user_id in (select id from public.profiles where user_id = auth.uid())
  );
-- Usuário edita/remove o próprio comentário; admin modera todos.
create policy comments_user_update on public.comments
  for update using (
    public.is_admin() or user_id in (select id from public.profiles where user_id = auth.uid())
  ) with check (
    public.is_admin() or user_id in (select id from public.profiles where user_id = auth.uid())
  );
create policy comments_admin_delete on public.comments
  for delete using (public.is_admin() or user_id in (select id from public.profiles where user_id = auth.uid()));

-- ---------------------------------------------------------------------
-- ratings — leitura pública; usuário gerencia a própria (unique impede duplicidade)
-- ---------------------------------------------------------------------
create policy ratings_public_read on public.ratings for select using (true);
create policy ratings_user_write on public.ratings
  for all using (
    public.is_admin() or user_id in (select id from public.profiles where user_id = auth.uid())
  ) with check (
    public.is_admin() or user_id in (select id from public.profiles where user_id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- favorites — privados do usuário
-- ---------------------------------------------------------------------
create policy favorites_user_all on public.favorites
  for all using (
    user_id in (select id from public.profiles where user_id = auth.uid())
  ) with check (
    user_id in (select id from public.profiles where user_id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- contatos — qualquer visitante envia; só admin lê/gerencia
-- ---------------------------------------------------------------------
create policy contacts_anon_insert on public.contacts for insert with check (true);
create policy contacts_admin_read on public.contacts for select using (public.is_admin());
create policy contacts_admin_update on public.contacts for update using (public.is_admin()) with check (public.is_admin());
create policy contacts_admin_delete on public.contacts for delete using (public.is_admin());

create policy adv_contacts_anon_insert on public.advertiser_contacts for insert with check (true);
create policy adv_contacts_admin_read on public.advertiser_contacts for select using (public.is_admin());
create policy adv_contacts_admin_update on public.advertiser_contacts for update using (public.is_admin()) with check (public.is_admin());
create policy adv_contacts_admin_delete on public.advertiser_contacts for delete using (public.is_admin());

-- ---------------------------------------------------------------------
-- Comercial / publicidade / produtos — somente admin
-- ---------------------------------------------------------------------
create policy commercial_clients_admin on public.commercial_clients for all using (public.is_admin()) with check (public.is_admin());
create policy client_history_admin on public.client_history for all using (public.is_admin()) with check (public.is_admin());
create policy ad_contracts_admin on public.ad_contracts for all using (public.is_admin()) with check (public.is_admin());
create policy ad_assets_admin on public.ad_assets for all using (public.is_admin()) with check (public.is_admin());
create policy contract_history_admin on public.contract_history for all using (public.is_admin()) with check (public.is_admin());
create policy standalone_products_admin on public.standalone_products for all using (public.is_admin()) with check (public.is_admin());

-- Patrocínios: leitura pública (para exibir rótulo), escrita admin.
create policy sponsored_articles_read on public.sponsored_articles for select using (true);
create policy sponsored_articles_admin on public.sponsored_articles for all using (public.is_admin()) with check (public.is_admin());
create policy sponsored_events_read on public.sponsored_events for select using (true);
create policy sponsored_events_admin on public.sponsored_events for all using (public.is_admin()) with check (public.is_admin());

-- Métricas de anúncio: inserção anônima (registro de impressão/clique), leitura admin.
create policy ad_impressions_insert on public.ad_impressions for insert with check (true);
create policy ad_impressions_admin_read on public.ad_impressions for select using (public.is_admin());
create policy ad_clicks_insert on public.ad_clicks for insert with check (true);
create policy ad_clicks_admin_read on public.ad_clicks for select using (public.is_admin());

-- ---------------------------------------------------------------------
-- Métricas de página/post — inserção via RPC security definer; leitura admin
-- ---------------------------------------------------------------------
create policy page_views_admin_read on public.page_views for select using (public.is_admin());
create policy post_views_admin_read on public.post_views for select using (public.is_admin());

-- ---------------------------------------------------------------------
-- audit_logs — leitura admin (inserção via service role no servidor)
-- ---------------------------------------------------------------------
create policy audit_logs_admin_read on public.audit_logs for select using (public.is_admin());

-- ---------------------------------------------------------------------
-- settings — leitura pública, escrita admin
-- ---------------------------------------------------------------------
create policy settings_public_read on public.settings for select using (true);
create policy settings_admin_write on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- newsletter — inscrição anônima, leitura admin
-- ---------------------------------------------------------------------
create policy newsletter_anon_insert on public.newsletter_subscribers for insert with check (true);
create policy newsletter_admin_read on public.newsletter_subscribers for select using (public.is_admin());
create policy newsletter_admin_update on public.newsletter_subscribers for update using (public.is_admin()) with check (public.is_admin());
