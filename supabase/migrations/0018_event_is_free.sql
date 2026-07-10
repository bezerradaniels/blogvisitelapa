-- Evento gratuito: sinaliza entrada franca no card de evento.
alter table public.posts
  add column if not exists event_is_free boolean not null default false;
