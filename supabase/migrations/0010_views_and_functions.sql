-- =====================================================================
-- Visite Lapa — 0010 — Views/funções: resolução de anúncios, métricas, admin
-- =====================================================================

-- ---------------------------------------------------------------------
-- active_ads — resolve quais anúncios PODEM ser exibidos.
-- Regras: status='ativo', dentro do período, com criativo (banner) presente.
-- (A view herda RLS de ad_contracts, mas expomos via função segura abaixo.)
-- ---------------------------------------------------------------------
create or replace view public.active_ads as
select
  c.id, c.title, c.placement, c.banner_url, c.link_url,
  c.company_name, c.priority, c.start_date, c.end_date
from public.ad_contracts c
where c.status = 'ativo'
  and c.banner_url is not null
  and c.start_date <= current_date
  and c.end_date >= current_date;

-- Função pública para buscar anúncios de um placement (respeita todas as regras).
-- SECURITY DEFINER para não exigir acesso direto do público à tabela de contratos.
create or replace function public.get_active_ads(p_placement ad_placement)
returns table (
  id uuid, title text, placement ad_placement, banner_url text,
  link_url text, company_name text, priority int
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.title, c.placement, c.banner_url, c.link_url, c.company_name, c.priority
  from public.ad_contracts c
  where c.placement = p_placement
    and c.status = 'ativo'
    and c.banner_url is not null
    and c.start_date <= current_date
    and c.end_date >= current_date
  order by c.priority desc, c.created_at desc;
$$;

grant execute on function public.get_active_ads(ad_placement) to anon, authenticated;
grant execute on function public.register_post_view(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- expire_contracts — marca como 'expirado' contratos ativos/agendados vencidos.
-- Rodar via cron (pg_cron) ou chamada administrativa periódica.
-- ---------------------------------------------------------------------
create or replace function public.expire_contracts()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare affected int;
begin
  update public.ad_contracts
  set status = 'expirado'
  where status in ('ativo', 'agendado', 'pausado')
    and end_date < current_date;
  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- ---------------------------------------------------------------------
-- admin_metrics — visão consolidada para o dashboard (somente admin via RLS das tabelas)
-- ---------------------------------------------------------------------
create or replace function public.admin_metrics()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'total_posts',        (select count(*) from public.posts),
    'published_posts',    (select count(*) from public.posts where status='publicado'),
    'draft_posts',        (select count(*) from public.posts where status='rascunho'),
    'pending_posts',      (select count(*) from public.posts where status='enviado_para_revisao'),
    'total_users',        (select count(*) from public.profiles),
    'total_publishers',   (select count(*) from public.profiles where role='publisher'),
    'pending_comments',   (select count(*) from public.comments where status='pendente'),
    'active_contracts',   (select count(*) from public.ad_contracts where status='ativo'),
    'expiring_contracts', (select count(*) from public.ad_contracts where status='ativo' and end_date between current_date and current_date + interval '7 days'),
    'expired_contracts',  (select count(*) from public.ad_contracts where status='expirado'),
    'sponsored_posts',    (select count(*) from public.posts where is_sponsored),
    'sponsored_events',   (select count(*) from public.sponsored_events where is_active),
    'recent_contacts',    (select count(*) from public.contacts where status='novo'),
    'recent_leads',       (select count(*) from public.advertiser_contacts where status='novo')
  );
$$;

revoke all on function public.admin_metrics() from public, anon;
grant execute on function public.admin_metrics() to authenticated;

-- Protege a função: só admins recebem os dados.
create or replace function public.admin_metrics_guarded()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito a administradores.';
  end if;
  return public.admin_metrics();
end;
$$;
grant execute on function public.admin_metrics_guarded() to authenticated;

-- ---------------------------------------------------------------------
-- promote_to_admin — promove um usuário a admin pelo e-mail (uso via SQL/service role).
-- Fluxo escolhido: usuário se cadastra no site e o operador roda esta função.
-- ---------------------------------------------------------------------
create or replace function public.promote_to_admin(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(p_email) limit 1;
  if uid is null then
    raise exception 'Nenhum usuário encontrado com o e-mail %', p_email;
  end if;
  update public.profiles
  set role = 'admin', status = 'active'
  where user_id = uid;
end;
$$;
-- Não conceder a anon/authenticated: execute apenas via SQL Editor / service role.
revoke all on function public.promote_to_admin(text) from public, anon, authenticated;
