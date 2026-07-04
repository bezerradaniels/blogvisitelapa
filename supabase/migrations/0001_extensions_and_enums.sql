-- =====================================================================
-- Visite Lapa — 0001 — Extensões e tipos (enums)
-- =====================================================================

-- Extensões úteis
create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "unaccent";      -- busca sem acento
create extension if not exists "pg_trgm";       -- busca por similaridade

-- ---------------------------------------------------------------------
-- Papéis de usuário
-- ---------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('common_user', 'publisher', 'admin');
exception when duplicate_object then null; end $$;

-- Status genérico de conta/registro
do $$ begin
  create type account_status as enum ('active', 'suspended', 'pending');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Posts
-- ---------------------------------------------------------------------
do $$ begin
  create type post_status as enum (
    'rascunho', 'enviado_para_revisao', 'publicado', 'arquivado', 'removido'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type moderation_status as enum ('pendente', 'aprovado', 'rejeitado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_type as enum (
    'noticia', 'evento', 'guia', 'publieditorial',
    'conteudo_patrocinado', 'comunidade', 'turismo', 'religiosidade'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Categorias
-- ---------------------------------------------------------------------
do $$ begin
  create type category_type as enum ('editorial', 'guia', 'institucional');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Comentários
-- ---------------------------------------------------------------------
do $$ begin
  create type comment_status as enum ('pendente', 'aprovado', 'rejeitado', 'removido');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Contatos
-- ---------------------------------------------------------------------
do $$ begin
  create type contact_status as enum ('novo', 'lido', 'em_atendimento', 'concluido', 'arquivado');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Comercial / clientes / produtos
-- ---------------------------------------------------------------------
do $$ begin
  create type commercial_status as enum ('ativo', 'inativo', 'prospecto');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pendente', 'parcial', 'pago', 'atrasado', 'cancelado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type delivery_status as enum ('pendente', 'em_producao', 'entregue', 'cancelado');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Publicidade / contratos
-- ---------------------------------------------------------------------
do $$ begin
  create type ad_contract_status as enum (
    'rascunho', 'agendado', 'ativo', 'pausado', 'expirado', 'removido', 'cancelado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type ad_placement as enum (
    'home_top', 'home_middle', 'home_carousel', 'post_sidebar',
    'post_inline_mobile', 'category_top', 'event_sidebar', 'fixed_carousel_sponsor'
  );
exception when duplicate_object then null; end $$;
