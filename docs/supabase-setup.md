# Configuração do Supabase

## 1. Criar o projeto

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto.
2. Anote a **URL** e as chaves em *Project Settings > API*:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (secreta!)

## 2. Aplicar as migrations

As migrations estão em `supabase/migrations/`, numeradas e idempotentes. Aplique **em ordem**.

### Opção A — SQL Editor (mais simples)
Abra o *SQL Editor* e cole/execute cada arquivo, do `0001` ao `0010`.

### Opção B — Supabase CLI
```bash
supabase link --project-ref <ref>
supabase db push
```

Ordem e conteúdo:

| Arquivo | Conteúdo |
| --- | --- |
| `0001_extensions_and_enums.sql` | extensões e tipos (enums) |
| `0002_utils_and_profiles.sql` | `profiles`, triggers, helpers de autorização, criação automática de perfil |
| `0003_taxonomy_and_posts.sql` | `categories`, `tags`, `posts`, mídias, relacionados |
| `0004_engagement.sql` | `comments`, `ratings`, `favorites` (+ recálculo de média) |
| `0005_contacts_and_clients.sql` | contatos, anunciantes, clientes comerciais, histórico CRM |
| `0006_advertising.sql` | contratos, criativos, métricas, patrocínios, produtos avulsos |
| `0007_system.sql` | métricas de acesso, auditoria, settings, newsletter |
| `0008_rls_policies.sql` | **RLS** de todas as tabelas |
| `0009_storage.sql` | buckets e políticas de Storage |
| `0010_views_and_functions.sql` | resolução de anúncios, métricas admin, expiração de contratos, promoção de admin |

## 3. Seed

Rode `supabase/seed.sql` (10 categorias, itens do carrossel fixo e configurações iniciais).

## 4. Criar o admin inicial

1. Cadastre-se pelo site em `/cadastro`.
2. No SQL Editor:
   ```sql
   select public.promote_to_admin('seu-email@exemplo.com');
   ```

## 5. Autenticação

- **E-mail/senha**: já habilitado por padrão.
- **Google**: *Authentication > Providers > Google*. Configure o Client ID/Secret do Google Cloud e adicione a URL de redirecionamento:
  ```
  https://SEU-PROJETO.supabase.co/auth/v1/callback
  ```
  No app, o retorno acontece em `…/auth/callback`.
- Em *Authentication > URL Configuration*, defina o **Site URL** e as **Redirect URLs** (inclua `https://seu-dominio/auth/callback`).

## 6. Storage

Buckets criados pela migration `0009` (públicos para leitura):
`post-covers`, `post-gallery`, `ad-banners`, `user-avatars`, `sponsored-content`.

Regras: upload de capas/galeria por publishers/admins; banners/patrocinados só admin; avatar na pasta do próprio usuário.

## 7. Manutenção

- **Expirar contratos vencidos** (agende com pg_cron, ex. diário):
  ```sql
  select public.expire_contracts();
  ```
- **Regenerar tipos** após mudanças de schema:
  ```bash
  supabase gen types typescript --project-id <ref> --schema public > types/database.generated.ts
  ```
