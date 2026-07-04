-- =====================================================================
-- Visite Lapa — 0003 — Categorias, tags, posts e mídias
-- =====================================================================

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  slug                   text not null unique,
  description            text,
  type                   category_type not null default 'editorial',
  is_fixed_carousel_item boolean not null default false,
  icon_name              text,           -- nome do ícone Hugeicons
  image_url              text,
  sort_order             int not null default 0,
  status                 account_status not null default 'active',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists categories_status_idx on public.categories (status);
create index if not exists categories_carousel_idx on public.categories (is_fixed_carousel_item);

drop trigger if exists trg_categories_updated on public.categories;
create trigger trg_categories_updated before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- tags
-- ---------------------------------------------------------------------
create table if not exists public.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_tags_updated on public.tags;
create trigger trg_tags_updated before update on public.tags
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------
create table if not exists public.posts (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  subtitle           text,
  slug               text not null unique,
  excerpt            text,
  content_html       text,
  content_json       jsonb,
  cover_image_url    text,
  cover_image_alt    text,
  category_id        uuid references public.categories(id) on delete set null,
  author_id          uuid not null references public.profiles(id) on delete cascade,
  reviewed_by        uuid references public.profiles(id) on delete set null,

  status             post_status not null default 'rascunho',
  moderation_status  moderation_status not null default 'pendente',
  content_type       content_type not null default 'noticia',

  is_featured        boolean not null default false,
  is_sponsored       boolean not null default false,
  is_event           boolean not null default false,

  -- Campos de evento
  event_start_date   timestamptz,
  event_end_date     timestamptz,
  event_location     text,
  event_address      text,
  event_ticket_url   text,
  event_organizer    text,
  event_map_url      text,

  -- Editorial / jornalístico
  source_note        text,
  editorial_notes    text,

  -- SEO
  seo_title          text,
  seo_description    text,
  focus_keyword      text,
  local_seo_keyword  text,
  social_title       text,
  social_description text,
  social_image_url   text,
  allow_indexing     boolean not null default true,
  include_in_sitemap boolean not null default true,
  include_in_rss     boolean not null default true,

  -- Métricas denormalizadas de avaliação (mantidas por trigger)
  rating_avg         numeric(3,2) not null default 0,
  rating_count       int not null default 0,
  views_count        int not null default 0,

  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Índices para listagem/filtragem/SEO
create index if not exists posts_status_pub_idx on public.posts (status, published_at desc);
create index if not exists posts_category_idx on public.posts (category_id);
create index if not exists posts_author_idx on public.posts (author_id);
create index if not exists posts_content_type_idx on public.posts (content_type);
create index if not exists posts_featured_idx on public.posts (is_featured) where is_featured;
create index if not exists posts_event_start_idx on public.posts (event_start_date) where is_event;
create index if not exists posts_views_idx on public.posts (views_count desc);
-- Busca textual (título, subtítulo, resumo)
create index if not exists posts_search_idx on public.posts
  using gin (to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(subtitle,'') || ' ' || coalesce(excerpt,'')));

drop trigger if exists trg_posts_updated on public.posts;
create trigger trg_posts_updated before update on public.posts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- post_tags (N:N)
-- ---------------------------------------------------------------------
create table if not exists public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id  uuid not null references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);
create index if not exists post_tags_tag_idx on public.post_tags (tag_id);

-- ---------------------------------------------------------------------
-- post_images (imagens avulsas associadas ao post) e post_gallery (galeria ordenada)
-- ---------------------------------------------------------------------
create table if not exists public.post_images (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  url        text not null,
  alt        text,
  created_at timestamptz not null default now()
);
create index if not exists post_images_post_idx on public.post_images (post_id);

create table if not exists public.post_gallery (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  url        text not null,
  alt        text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists post_gallery_post_idx on public.post_gallery (post_id, sort_order);

-- ---------------------------------------------------------------------
-- related_posts (conteúdos relacionados manuais)
-- ---------------------------------------------------------------------
create table if not exists public.related_posts (
  post_id         uuid not null references public.posts(id) on delete cascade,
  related_post_id uuid not null references public.posts(id) on delete cascade,
  sort_order      int not null default 0,
  primary key (post_id, related_post_id),
  check (post_id <> related_post_id)
);
