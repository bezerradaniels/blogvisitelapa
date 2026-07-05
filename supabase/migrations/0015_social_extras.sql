-- =====================================================================
-- Visite Lapa — 0015 — Bloqueio, mensagens privadas, notificações e fotos
-- Completa a camada social. Bloqueio é transversal (integrado a are_friends
-- e can_view_profile). Mensagens só entre amigos. Fotos seguem a visibilidade
-- do perfil. Notificações apenas no site.
-- =====================================================================

do $$ begin
  create type notification_type as enum (
    'amizade_pedido', 'amizade_aceita', 'recado', 'depoimento', 'mensagem'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- blocks (bloqueio de usuários)
-- ---------------------------------------------------------------------
create table if not exists public.blocks (
  id         uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists blocks_blocker_idx on public.blocks (blocker_id);
create index if not exists blocks_blocked_idx on public.blocks (blocked_id);

-- ---------------------------------------------------------------------
-- conversations + messages (mensagens privadas 1:1)
-- ---------------------------------------------------------------------
create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  participant_a   uuid not null references public.profiles(id) on delete cascade,
  participant_b   uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  unique (participant_a, participant_b),
  check (participant_a < participant_b)
);
create index if not exists conversations_a_idx on public.conversations (participant_a, last_message_at desc);
create index if not exists conversations_b_idx on public.conversations (participant_b, last_message_at desc);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  content         text not null check (char_length(content) between 1 and 4000),
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

-- ---------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id     uuid references public.profiles(id) on delete set null,
  type         notification_type not null,
  entity_id    uuid,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists notifications_recipient_idx on public.notifications (recipient_id, read_at);

-- ---------------------------------------------------------------------
-- photo_albums + photos (fotos seguem a visibilidade do perfil)
-- ---------------------------------------------------------------------
create table if not exists public.photo_albums (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 120),
  cover_url  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists photo_albums_profile_idx on public.photo_albums (profile_id, created_at desc);

drop trigger if exists trg_photo_albums_updated on public.photo_albums;
create trigger trg_photo_albums_updated before update on public.photo_albums
  for each row execute function public.set_updated_at();

create table if not exists public.photos (
  id         uuid primary key default gen_random_uuid(),
  album_id   uuid not null references public.photo_albums(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  url        text not null,
  caption    text check (char_length(caption) <= 500),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists photos_album_idx on public.photos (album_id, sort_order, created_at);

-- =====================================================================
-- Helpers (SECURITY DEFINER)
-- =====================================================================
create or replace function public.is_blocked(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function public.is_conversation_participant(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversations c
    where c.id = cid
      and public.current_profile_id() in (c.participant_a, c.participant_b)
  );
$$;

-- Cria notificação (contorna RLS). Ator é sempre quem chama (evita forjar).
create or replace function public.push_notification(
  p_recipient uuid, p_type notification_type, p_entity uuid
)
returns void language plpgsql security definer set search_path = public as $$
declare
  actor uuid := public.current_profile_id();
begin
  if p_recipient is null or p_recipient = actor then return; end if;
  if public.is_blocked(p_recipient, actor) then return; end if;
  insert into public.notifications (recipient_id, actor_id, type, entity_id)
  values (p_recipient, actor, p_type, p_entity);
end;
$$;

-- Redefinições: bloqueio anula amizade e visibilidade.
create or replace function public.are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'aceito'
      and ((f.requester_id = a and f.addressee_id = b)
        or (f.requester_id = b and f.addressee_id = a))
  ) and not public.is_blocked(a, b);
$$;

create or replace function public.can_view_profile(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    (target = public.current_profile_id() or public.is_admin())
    or (
      not public.is_blocked(target, public.current_profile_id())
      and (
        coalesce((select visibility from public.profile_details where profile_id = target), 'publico') = 'publico'
        or (
          coalesce((select visibility from public.profile_details where profile_id = target), 'publico') = 'amigos'
          and public.are_friends(target, public.current_profile_id())
        )
      )
    );
$$;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.blocks        enable row level security;
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;
alter table public.notifications enable row level security;
alter table public.photo_albums  enable row level security;
alter table public.photos        enable row level security;

-- blocks — cada um gerencia os próprios bloqueios.
create policy blocks_owner_all on public.blocks
  for all using (blocker_id = public.current_profile_id() or public.is_admin())
  with check (blocker_id = public.current_profile_id() or public.is_admin());

-- conversations — só participantes.
create policy conversations_participant_read on public.conversations
  for select using (
    public.current_profile_id() in (participant_a, participant_b) or public.is_admin()
  );
create policy conversations_participant_insert on public.conversations
  for insert with check (public.current_profile_id() in (participant_a, participant_b));
create policy conversations_participant_update on public.conversations
  for update using (public.current_profile_id() in (participant_a, participant_b))
  with check (public.current_profile_id() in (participant_a, participant_b));

-- messages — participantes leem; remetente escreve.
create policy messages_read on public.messages
  for select using (public.is_conversation_participant(conversation_id));
create policy messages_insert on public.messages
  for insert with check (
    sender_id = public.current_profile_id()
    and public.is_conversation_participant(conversation_id)
  );
create policy messages_update on public.messages
  for update using (public.is_conversation_participant(conversation_id))
  with check (public.is_conversation_participant(conversation_id));

-- notifications — só o destinatário lê/atualiza (insert só via push_notification).
create policy notifications_recipient_read on public.notifications
  for select using (recipient_id = public.current_profile_id());
create policy notifications_recipient_update on public.notifications
  for update using (recipient_id = public.current_profile_id())
  with check (recipient_id = public.current_profile_id());
create policy notifications_recipient_delete on public.notifications
  for delete using (recipient_id = public.current_profile_id());

-- photo_albums / photos — leitura segue visibilidade; dono gerencia.
create policy photo_albums_read on public.photo_albums
  for select using (public.can_view_profile(profile_id));
create policy photo_albums_owner_write on public.photo_albums
  for all using (profile_id = public.current_profile_id() or public.is_admin())
  with check (profile_id = public.current_profile_id() or public.is_admin());

create policy photos_read on public.photos
  for select using (public.can_view_profile(profile_id));
create policy photos_owner_write on public.photos
  for all using (profile_id = public.current_profile_id() or public.is_admin())
  with check (profile_id = public.current_profile_id() or public.is_admin());

-- =====================================================================
-- Storage: bucket user-photos (leitura pública; write na pasta do usuário)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('user-photos', 'user-photos', true)
on conflict (id) do nothing;

create policy "storage_photos_read" on storage.objects
  for select using (bucket_id = 'user-photos');
create policy "storage_photos_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'user-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "storage_photos_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'user-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "storage_photos_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'user-photos' and (storage.foldername(name))[1] = auth.uid()::text);
