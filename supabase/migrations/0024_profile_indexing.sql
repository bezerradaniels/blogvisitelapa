-- =====================================================================
-- Conecta Lapa — 0024 — Acessor público da preferência de indexação
-- user_privacy_settings é privado (RLS: só dono/admin). O metadata de
-- /u/[slug] roda na sessão do visitante (muitas vezes anônimo) e precisa
-- saber apenas se o perfil permite indexação — exposto como booleano seguro.
-- =====================================================================
create or replace function public.profile_allows_indexing(p_target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select allow_search_indexing from public.user_privacy_settings where profile_id = p_target),
    true
  );
$$;

grant execute on function public.profile_allows_indexing(uuid) to anon, authenticated;
