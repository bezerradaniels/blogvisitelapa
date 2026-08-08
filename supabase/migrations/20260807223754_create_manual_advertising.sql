-- Publicidade editorial/institucional sem contrato comercial.
create table if not exists public.manual_ads (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 2 and 180),
  placement public.ad_placement not null,
  desktop_media_url text,
  mobile_media_url text,
  alternative_text text,
  destination_url text,
  start_at timestamptz not null default now(),
  end_at timestamptz,
  priority integer not null default 0 check (priority between 0 and 100000),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (desktop_media_url is not null or mobile_media_url is not null),
  check (end_at is null or end_at >= start_at)
);

create index if not exists manual_ads_active_placement_idx
  on public.manual_ads (placement, is_active, start_at, end_at, priority desc);

drop trigger if exists trg_manual_ads_updated on public.manual_ads;
create trigger trg_manual_ads_updated before update on public.manual_ads
  for each row execute function public.set_updated_at();

create or replace function public.lock_serving_manual_ad()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.is_active
    and old.start_at <= now()
    and (old.end_at is null or old.end_at >= now()) then
    if tg_op = 'UPDATE' and (
      new.is_active = false
      or (
        new.title is not distinct from old.title
        and new.placement is not distinct from old.placement
        and new.desktop_media_url is not distinct from old.desktop_media_url
        and new.mobile_media_url is not distinct from old.mobile_media_url
        and new.alternative_text is not distinct from old.alternative_text
        and new.destination_url is not distinct from old.destination_url
        and new.start_at is not distinct from old.start_at
        and new.priority is not distinct from old.priority
        and new.is_active is not distinct from old.is_active
        and new.created_by is not distinct from old.created_by
        and new.created_at is not distinct from old.created_at
      )
    ) then
      return new;
    end if;
    raise exception 'Banner em período de veiculação. Desative-o antes de editar ou excluir.';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_lock_serving_manual_ad on public.manual_ads;
create trigger trg_lock_serving_manual_ad
  before update or delete on public.manual_ads
  for each row execute function public.lock_serving_manual_ad();

alter table public.manual_ads enable row level security;

create policy manual_ads_public_read_active on public.manual_ads
  for select to anon, authenticated
  using (
    is_active
    and start_at <= now()
    and (end_at is null or end_at >= now())
  );

create policy manual_ads_admin_all on public.manual_ads
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.manual_ads to anon, authenticated;
grant insert, update, delete on public.manual_ads to authenticated;
