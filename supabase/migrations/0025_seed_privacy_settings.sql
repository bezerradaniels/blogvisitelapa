-- =====================================================================
-- Conecta Lapa — 0025 — Semear user_privacy_settings a cada novo perfil
-- O backfill de 0022 foi único; novos cadastros precisavam da linha de
-- preferências. As funções já usam defaults via coalesce, mas garantir a
-- linha mantém leituras/gravações consistentes (e o upsert idempotente).
-- =====================================================================
create or replace function public.seed_privacy_settings()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_privacy_settings (profile_id) values (new.id)
  on conflict (profile_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_profiles_seed_privacy on public.profiles;
create trigger trg_profiles_seed_privacy
  after insert on public.profiles
  for each row execute function public.seed_privacy_settings();

-- Backfill de qualquer perfil que ainda esteja sem a linha.
insert into public.user_privacy_settings (profile_id)
select p.id from public.profiles p
where not exists (select 1 from public.user_privacy_settings s where s.profile_id = p.id)
on conflict (profile_id) do nothing;
