-- =====================================================================
-- Conecta Lapa — 0027 — Preferências de conteúdo/feed + privacidade de mídia
-- Adiciona: preferências de conteúdo (palavras silenciadas, autoplay, conteúdo
-- sensível, visibilidade padrão de novos álbuns) e visibilidade POR ÁLBUM,
-- limitada (mais restritiva) pela visibilidade do perfil.
-- =====================================================================

-- ---------------------------------------------------------------------
-- user_content_prefs — preferências de feed/mídia 1:1 por perfil.
-- ---------------------------------------------------------------------
create table if not exists public.user_content_prefs (
  profile_id               uuid primary key references public.profiles(id) on delete cascade,
  muted_words              text[]             not null default '{}',
  autoplay_videos          boolean            not null default true,
  hide_sensitive           boolean            not null default false,
  default_album_visibility profile_visibility not null default 'amigos',
  created_at               timestamptz        not null default now(),
  updated_at               timestamptz        not null default now()
);

drop trigger if exists trg_user_content_prefs_updated on public.user_content_prefs;
create trigger trg_user_content_prefs_updated before update on public.user_content_prefs
  for each row execute function public.set_updated_at();

alter table public.user_content_prefs enable row level security;

create policy user_content_prefs_read on public.user_content_prefs
  for select using (profile_id = public.current_profile_id() or public.is_admin());
create policy user_content_prefs_insert on public.user_content_prefs
  for insert with check (profile_id = public.current_profile_id());
create policy user_content_prefs_update on public.user_content_prefs
  for update using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());

-- Estende a semente por perfil (0025/0026) para incluir preferências de conteúdo.
create or replace function public.seed_privacy_settings()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_privacy_settings (profile_id) values (new.id) on conflict (profile_id) do nothing;
  insert into public.user_notification_prefs (profile_id) values (new.id) on conflict (profile_id) do nothing;
  insert into public.user_content_prefs (profile_id) values (new.id) on conflict (profile_id) do nothing;
  return new;
end;
$$;

insert into public.user_content_prefs (profile_id)
select p.id from public.profiles p
where not exists (select 1 from public.user_content_prefs c where c.profile_id = p.id)
on conflict (profile_id) do nothing;

-- ---------------------------------------------------------------------
-- Visibilidade por álbum. Default 'publico' na coluna preserva o
-- comportamento atual dos álbuns existentes (seguiam só o perfil); álbuns
-- NOVOS recebem a preferência do usuário (default_album_visibility) via app.
-- ---------------------------------------------------------------------
alter table public.photo_albums
  add column if not exists visibility profile_visibility not null default 'publico';

-- can_view_album: exige ver o perfil (que já aplica a visibilidade GLOBAL e,
-- portanto, o limite mais restritivo) E a visibilidade específica do álbum.
create or replace function public.can_view_album(p_album uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when a.profile_id = public.current_profile_id() then true
    when public.is_admin() then true
    when not public.can_view_profile(a.profile_id) then false
    when a.visibility = 'publico' then true
    when a.visibility = 'amigos' then public.are_friends(a.profile_id, public.current_profile_id())
    else false -- oculto
  end
  from public.photo_albums a
  where a.id = p_album;
$$;

grant execute on function public.can_view_album(uuid) to anon, authenticated;

-- Leitura de álbuns/fotos passa a respeitar a visibilidade do álbum.
drop policy if exists photo_albums_read on public.photo_albums;
create policy photo_albums_read on public.photo_albums
  for select using (public.can_view_album(id));

drop policy if exists photos_read on public.photos;
create policy photos_read on public.photos
  for select using (public.can_view_album(album_id));
