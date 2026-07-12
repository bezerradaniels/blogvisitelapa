-- =====================================================================
-- Conecta Lapa — 0028 — Ciclo de vida da conta (desativar / excluir) + dados
-- Desativação reversível (status 'deactivated') e exclusão com carência de 30
-- dias (status 'pending_deletion' + purga automática via pg_cron). Perfis não
-- ativos ficam ocultos para terceiros. Trilha de auditoria: dono lê os próprios
-- eventos; a inserção é feita no servidor (service role).
--
-- Pré-requisito (aplicado antes, fora de transação):
--   alter type account_status add value if not exists 'deactivated';
--   alter type account_status add value if not exists 'pending_deletion';
-- =====================================================================

alter table public.profiles
  add column if not exists deactivated_at       timestamptz,
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists deletion_reason       text;

-- can_view_profile passa a exigir conta ATIVA (exceto dono/admin): oculta
-- perfis desativados, em exclusão pendente, suspensos ou pendentes.
create or replace function public.can_view_profile(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when target = public.current_profile_id() then true
    when public.is_admin() then true
    when coalesce((select status from public.profiles where id = target), 'active') <> 'active' then false
    else (
      coalesce((select visibility from public.profile_details where profile_id = target), 'publico') = 'publico'
      or (
        coalesce((select visibility from public.profile_details where profile_id = target), 'publico') = 'amigos'
        and public.are_friends(target, public.current_profile_id())
      )
    )
  end;
$$;

-- Trilha de auditoria: cada usuário lê os próprios eventos (além do admin).
drop policy if exists audit_logs_self_read on public.audit_logs;
create policy audit_logs_self_read on public.audit_logs
  for select using (actor_id = public.current_profile_id());

-- Purga contas com exclusão pendente há mais de 30 dias. Apagar auth.users
-- cascateia para profiles e todo o conteúdo. Escopo estrito por segurança.
create or replace function public.purge_expired_deletions()
returns integer language plpgsql security definer set search_path = public, auth as $$
declare
  n integer;
begin
  with victims as (
    select user_id
    from public.profiles
    where status = 'pending_deletion'
      and deletion_requested_at is not null
      and deletion_requested_at < now() - interval '30 days'
      and user_id is not null
  ), deleted as (
    delete from auth.users where id in (select user_id from victims) returning 1
  )
  select count(*) into n from deleted;
  return n;
end;
$$;

revoke execute on function public.purge_expired_deletions() from public;

-- Agendamento diário (pg_cron). Aplicado em passo separado:
--   create extension if not exists pg_cron;
--   select cron.schedule('purge-deleted-accounts','0 3 * * *',
--                        'select public.purge_expired_deletions();');
