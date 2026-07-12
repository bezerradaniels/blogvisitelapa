-- =====================================================================
-- Conecta Lapa — 0022 — Privacidade granular (por campo) + preferências
-- Introduz visibilidade por campo do perfil (Público / Só amigos / Só eu),
-- preferências de privacidade (busca, indexação, listas, atividade) e a
-- camada de RESOLUÇÃO no banco: a regra mais restritiva sempre vence
-- (a visibilidade global do perfil limita a visibilidade de cada campo).
--
-- Reaproveita o enum profile_visibility ('publico','amigos','oculto') e os
-- helpers de 0014/0015 (current_profile_id, are_friends, is_blocked, is_admin).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Enum de público-alvo para permissões de interação (fases futuras).
-- ---------------------------------------------------------------------
do $$ begin
  create type interaction_audience as enum ('todos', 'amigos_de_amigos', 'amigos', 'ninguem');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- user_privacy_settings — preferências globais 1:1 por perfil.
-- A visibilidade GLOBAL do perfil continua em profile_details.visibility
-- (já integrada à RLS de todo o app); aqui ficam os controles adicionais.
-- ---------------------------------------------------------------------
create table if not exists public.user_privacy_settings (
  profile_id                uuid primary key references public.profiles(id) on delete cascade,
  -- Descoberta / busca
  search_visibility         profile_visibility   not null default 'publico',
  allow_search_indexing     boolean              not null default true,
  -- Listas
  friend_list_visibility    profile_visibility   not null default 'amigos',
  community_list_visibility profile_visibility   not null default 'publico',
  -- Atividade / presença
  activity_visibility       profile_visibility   not null default 'amigos',
  online_status_visibility  profile_visibility   not null default 'amigos',
  -- Permissões de interação (aplicadas em fases seguintes)
  friend_request_permission interaction_audience not null default 'todos',
  message_permission        interaction_audience not null default 'amigos',
  created_at                timestamptz          not null default now(),
  updated_at                timestamptz          not null default now()
);

drop trigger if exists trg_user_privacy_settings_updated on public.user_privacy_settings;
create trigger trg_user_privacy_settings_updated before update on public.user_privacy_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- user_field_visibility — visibilidade por campo do perfil.
-- Ausência de linha = usa o padrão seguro do campo (field_default_visibility).
-- field_key é validado por CHECK para impedir chaves inválidas.
-- ---------------------------------------------------------------------
create table if not exists public.user_field_visibility (
  profile_id uuid               not null references public.profiles(id) on delete cascade,
  field_key  text               not null,
  visibility profile_visibility not null,
  updated_at timestamptz        not null default now(),
  primary key (profile_id, field_key),
  constraint user_field_visibility_key_chk check (field_key in (
    'full_name', 'nickname', 'avatar_url', 'cover_url', 'bio',
    'about', 'interests', 'city', 'relationship', 'birth_date', 'phone'
  ))
);
create index if not exists user_field_visibility_profile_idx
  on public.user_field_visibility (profile_id);

drop trigger if exists trg_user_field_visibility_updated on public.user_field_visibility;
create trigger trg_user_field_visibility_updated before update on public.user_field_visibility
  for each row execute function public.set_updated_at();

-- =====================================================================
-- Camada de resolução de privacidade (SECURITY DEFINER)
-- =====================================================================

-- Padrão seguro por campo (usado quando não há linha em user_field_visibility).
create or replace function public.field_default_visibility(p_key text)
returns profile_visibility language sql immutable set search_path = public as $$
  select case p_key
    when 'full_name'    then 'publico'
    when 'nickname'     then 'publico'
    when 'avatar_url'   then 'publico'
    when 'cover_url'    then 'publico'
    when 'bio'          then 'publico'
    when 'about'        then 'amigos'
    when 'interests'    then 'amigos'
    when 'city'         then 'amigos'
    when 'relationship' then 'amigos'
    when 'birth_date'   then 'amigos'
    when 'phone'        then 'oculto'
    else 'amigos'
  end::profile_visibility;
$$;

-- Regra mais restritiva entre dois valores (publico < amigos < oculto).
create or replace function public.most_restrictive(a profile_visibility, b profile_visibility)
returns profile_visibility language sql immutable set search_path = public as $$
  select case
    when a = 'oculto'  or b = 'oculto'  then 'oculto'
    when a = 'amigos'  or b = 'amigos'  then 'amigos'
    else 'publico'
  end::profile_visibility;
$$;

-- Visibilidade EFETIVA de um campo = mais restritiva entre o valor do campo
-- e a visibilidade global do perfil (herança: o global limita o campo).
create or replace function public.effective_field_visibility(p_owner uuid, p_key text)
returns profile_visibility language sql stable security definer set search_path = public as $$
  select public.most_restrictive(
    coalesce(
      (select visibility from public.user_field_visibility
        where profile_id = p_owner and field_key = p_key),
      public.field_default_visibility(p_key)
    ),
    coalesce(
      (select visibility from public.profile_details where profile_id = p_owner),
      'publico'
    )
  );
$$;

-- O viewer atual pode ver este campo do perfil-alvo?
-- Dono sempre vê; bloqueio nega; admin vê (moderação — exceção documentada).
create or replace function public.can_view_field(p_owner uuid, p_key text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  v_viewer uuid := public.current_profile_id();
  v_eff    profile_visibility;
begin
  if p_owner = v_viewer then return true; end if;
  if v_viewer is not null and public.is_blocked(p_owner, v_viewer) then return false; end if;
  if public.is_admin() then return true; end if;

  v_eff := public.effective_field_visibility(p_owner, p_key);
  if v_eff = 'publico' then
    return true;
  elsif v_eff = 'amigos' then
    return v_viewer is not null and public.are_friends(p_owner, v_viewer);
  else
    return false; -- oculto
  end if;
end;
$$;

-- Detalhes do perfil já filtrados por campo para o viewer atual.
-- Retorna apenas os campos autorizados: o servidor não envia dados privados.
create or replace function public.visible_profile_details(p_target uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'nickname',     case when public.can_view_field(p_target, 'nickname')     then d.nickname end,
    'city',         case when public.can_view_field(p_target, 'city')         then d.city end,
    'birth_date',   case when public.can_view_field(p_target, 'birth_date')   then d.birth_date end,
    'relationship', case when public.can_view_field(p_target, 'relationship') then d.relationship end,
    'interests',    case when public.can_view_field(p_target, 'interests')    then d.interests end,
    'about',        case when public.can_view_field(p_target, 'about')        then d.about end,
    'cover_url',    case when public.can_view_field(p_target, 'cover_url')    then d.cover_url end,
    'visibility',   d.visibility
  )
  from public.profile_details d
  where d.profile_id = p_target;
$$;

grant execute on function public.field_default_visibility(text) to anon, authenticated;
grant execute on function public.most_restrictive(profile_visibility, profile_visibility) to anon, authenticated;
grant execute on function public.effective_field_visibility(uuid, text) to anon, authenticated;
grant execute on function public.can_view_field(uuid, text) to anon, authenticated;
grant execute on function public.visible_profile_details(uuid) to anon, authenticated;

-- =====================================================================
-- Row Level Security
-- Configurações e mapa de visibilidade são privados ao dono (as funções
-- SECURITY DEFINER acima leem as tabelas para avaliar viewers externos).
-- =====================================================================
alter table public.user_privacy_settings enable row level security;
alter table public.user_field_visibility enable row level security;

-- user_privacy_settings
create policy user_privacy_settings_read on public.user_privacy_settings
  for select using (profile_id = public.current_profile_id() or public.is_admin());

create policy user_privacy_settings_insert on public.user_privacy_settings
  for insert with check (profile_id = public.current_profile_id());

create policy user_privacy_settings_update on public.user_privacy_settings
  for update using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());

-- user_field_visibility
create policy user_field_visibility_read on public.user_field_visibility
  for select using (profile_id = public.current_profile_id() or public.is_admin());

create policy user_field_visibility_insert on public.user_field_visibility
  for insert with check (profile_id = public.current_profile_id());

create policy user_field_visibility_update on public.user_field_visibility
  for update using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());

create policy user_field_visibility_delete on public.user_field_visibility
  for delete using (profile_id = public.current_profile_id());

-- =====================================================================
-- Backfill: uma linha de preferências (com padrões seguros) por perfil.
-- Campos sem linha em user_field_visibility herdam field_default_visibility,
-- preservando o padrão mais restritivo razoável para usuários existentes.
-- =====================================================================
insert into public.user_privacy_settings (profile_id)
select id from public.profiles
on conflict (profile_id) do nothing;
