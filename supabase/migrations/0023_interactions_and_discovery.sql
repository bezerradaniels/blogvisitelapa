-- =====================================================================
-- Conecta Lapa — 0023 — Permissões de interação + prévia por audiência
-- Aplica as permissões de user_privacy_settings (pedido de amizade / mensagem)
-- na camada de banco e adiciona a prévia "Ver como" (dono/admin) usando as
-- MESMAS regras de visibilidade efetiva de 0022.
-- =====================================================================

-- Amigos em comum (amigo-de-amigo) entre a e b.
create or replace function public.are_friends_of_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from (
      select case when requester_id = a then addressee_id else requester_id end as fof
      from public.friendships
      where status = 'aceito' and (requester_id = a or addressee_id = a)
    ) af
    join (
      select case when requester_id = b then addressee_id else requester_id end as fof
      from public.friendships
      where status = 'aceito' and (requester_id = b or addressee_id = b)
    ) bf on af.fof = bf.fof
    where af.fof <> a and af.fof <> b
  );
$$;

-- O viewer atual pode ENVIAR pedido de amizade ao alvo?
-- Respeita friend_request_permission (todos / amigos_de_amigos / ninguem),
-- bloqueio e amizade existente.
create or replace function public.can_request_friendship(p_target uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  v_viewer uuid := public.current_profile_id();
  v_perm interaction_audience;
begin
  if v_viewer is null or v_viewer = p_target then return false; end if;
  if public.is_blocked(p_target, v_viewer) then return false; end if;
  if public.are_friends(v_viewer, p_target) then return false; end if;

  v_perm := coalesce(
    (select friend_request_permission from public.user_privacy_settings where profile_id = p_target),
    'todos'
  );
  if v_perm = 'ninguem' then
    return false;
  elsif v_perm = 'amigos_de_amigos' then
    return public.are_friends_of_friends(v_viewer, p_target);
  else
    return true; -- 'todos' (default)
  end if;
end;
$$;

-- O viewer atual pode INICIAR conversa com o alvo?
-- Piso da arquitetura atual: mensagens são entre amigos; 'ninguem' bloqueia tudo.
create or replace function public.can_message(p_target uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  v_viewer uuid := public.current_profile_id();
  v_perm interaction_audience;
begin
  if v_viewer is null or v_viewer = p_target then return false; end if;
  if public.is_blocked(p_target, v_viewer) then return false; end if;

  v_perm := coalesce(
    (select message_permission from public.user_privacy_settings where profile_id = p_target),
    'amigos'
  );
  if v_perm = 'ninguem' then return false; end if;
  return public.are_friends(v_viewer, p_target);
end;
$$;

-- Uma audiência (dono/amigos/publico) enxerga um campo com dada visibilidade efetiva?
create or replace function public.audience_can_see(p_eff profile_visibility, p_audience text)
returns boolean language sql immutable set search_path = public as $$
  select case p_audience
    when 'dono'   then true
    when 'amigos' then p_eff in ('publico', 'amigos')
    else               p_eff = 'publico'
  end;
$$;

-- Prévia "Ver como": detalhes do perfil como uma audiência os veria.
-- Só o DONO (ou admin) pode pré-visualizar. Usa effective_field_visibility (0022).
create or replace function public.visible_profile_details_as(p_target uuid, p_audience text)
returns jsonb language sql stable security definer set search_path = public as $$
  select case
    when public.current_profile_id() is null then null
    when public.current_profile_id() <> p_target and not public.is_admin() then null
    else (
      select jsonb_build_object(
        'nickname',     case when public.audience_can_see(public.effective_field_visibility(p_target,'nickname'),     p_audience) then d.nickname end,
        'city',         case when public.audience_can_see(public.effective_field_visibility(p_target,'city'),         p_audience) then d.city end,
        'birth_date',   case when public.audience_can_see(public.effective_field_visibility(p_target,'birth_date'),   p_audience) then d.birth_date end,
        'relationship', case when public.audience_can_see(public.effective_field_visibility(p_target,'relationship'), p_audience) then d.relationship end,
        'interests',    case when public.audience_can_see(public.effective_field_visibility(p_target,'interests'),    p_audience) then d.interests end,
        'about',        case when public.audience_can_see(public.effective_field_visibility(p_target,'about'),        p_audience) then d.about end,
        'cover_url',    case when public.audience_can_see(public.effective_field_visibility(p_target,'cover_url'),    p_audience) then d.cover_url end
      )
      from public.profile_details d
      where d.profile_id = p_target
    )
  end;
$$;

grant execute on function public.are_friends_of_friends(uuid, uuid) to anon, authenticated;
grant execute on function public.can_request_friendship(uuid) to anon, authenticated;
grant execute on function public.can_message(uuid) to anon, authenticated;
grant execute on function public.audience_can_see(profile_visibility, text) to anon, authenticated;
grant execute on function public.visible_profile_details_as(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Reforço na RLS: pedido de amizade agora respeita a permissão do alvo.
-- (A action valida antes p/ mensagem amigável; a RLS é a garantia real.)
-- ---------------------------------------------------------------------
drop policy if exists friendships_request on public.friendships;
create policy friendships_request on public.friendships
  for insert with check (
    requester_id = public.current_profile_id()
    and public.can_request_friendship(addressee_id)
  );
