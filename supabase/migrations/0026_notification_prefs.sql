-- =====================================================================
-- Conecta Lapa — 0026 — Preferências de notificação (por categoria)
-- Toggles por categoria para notificações no site (in-app). push_notification
-- passa a respeitar a preferência do destinatário. E-mail é um master guardado
-- para quando e-mails de notificação por evento forem ativados (hoje só há
-- e-mails de autenticação via Resend).
-- =====================================================================
create table if not exists public.user_notification_prefs (
  profile_id       uuid primary key references public.profiles(id) on delete cascade,
  inapp_amizade    boolean not null default true,
  inapp_recado     boolean not null default true,
  inapp_depoimento boolean not null default true,
  inapp_mensagem   boolean not null default true,
  email_enabled    boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists trg_user_notification_prefs_updated on public.user_notification_prefs;
create trigger trg_user_notification_prefs_updated before update on public.user_notification_prefs
  for each row execute function public.set_updated_at();

alter table public.user_notification_prefs enable row level security;

create policy user_notification_prefs_read on public.user_notification_prefs
  for select using (profile_id = public.current_profile_id() or public.is_admin());
create policy user_notification_prefs_insert on public.user_notification_prefs
  for insert with check (profile_id = public.current_profile_id());
create policy user_notification_prefs_update on public.user_notification_prefs
  for update using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());

-- Semente por perfil (estende a semente de privacidade de 0025).
create or replace function public.seed_privacy_settings()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_privacy_settings (profile_id) values (new.id)
  on conflict (profile_id) do nothing;
  insert into public.user_notification_prefs (profile_id) values (new.id)
  on conflict (profile_id) do nothing;
  return new;
end;
$$;

insert into public.user_notification_prefs (profile_id)
select p.id from public.profiles p
where not exists (select 1 from public.user_notification_prefs n where n.profile_id = p.id)
on conflict (profile_id) do nothing;

-- push_notification passa a respeitar a preferência in-app do destinatário.
create or replace function public.push_notification(
  p_recipient uuid, p_type notification_type, p_entity uuid
)
returns void language plpgsql security definer set search_path = public as $$
declare
  actor uuid := public.current_profile_id();
  allow boolean;
begin
  if p_recipient is null or p_recipient = actor then return; end if;
  if public.is_blocked(p_recipient, actor) then return; end if;

  select case p_type
    when 'amizade_pedido' then inapp_amizade
    when 'amizade_aceita' then inapp_amizade
    when 'recado'         then inapp_recado
    when 'depoimento'     then inapp_depoimento
    when 'mensagem'       then inapp_mensagem
    else true
  end
  into allow
  from public.user_notification_prefs
  where profile_id = p_recipient;

  -- Sem linha de preferência = padrão ligado.
  if allow is not null and not allow then return; end if;

  insert into public.notifications (recipient_id, actor_id, type, entity_id)
  values (p_recipient, actor, p_type, p_entity);
end;
$$;
