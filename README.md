# Visite Lapa

**Tudo sobre Bom Jesus da Lapa.** Portal independente de notícias, eventos, turismo, religiosidade e guia local de Bom Jesus da Lapa (BA), no Vale do São Francisco, oeste baiano.

Projeto **mobile-first**, focado em SEO, SEO local (GEO), prontidão técnica para Google News e Google Discover, legibilidade por LLMs, performance e monetização — construído para hospedagem **Node.js do Hostinger**.

> Este é um produto independente, sem vínculo com qualquer outro portal, marca ou plataforma.

## Stack

- **Next.js 16** (App Router) + **TypeScript strict**
- **Node.js 24**
- **Supabase** — Auth, Database (Postgres), Storage, Row Level Security
- **Tailwind CSS** (tokens via variáveis CSS)
- **Hugeicons** (biblioteca oficial de ícones)
- **Tiptap** (editor WYSIWYG — preparado para futura integração com Google Docs)
- Fontes: **Hanken Grotesk** (títulos) + **Inter** (corpo) via `next/font`

> Observação sobre fontes: "Stack Sans Headline/Text" é uma fonte comercial e **não** está no Google Fonts. Usamos um par equivalente exposto nas variáveis `--font-headline` / `--font-body` (em `app/globals.css`). Para adotar a Stack Sans licenciada, declare os `@font-face` dela e sobrescreva essas duas variáveis — nenhum componente precisa mudar.

## Instalação

```bash
npm install
cp .env.example .env.local   # preencha com suas credenciais
npm run dev                  # http://localhost:3000
```

## Variáveis de ambiente

Copie `.env.example` para `.env.local`:

| Variável | Descrição |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | URL pública (sem barra no final) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço — **somente no servidor** |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | ID do AdSense (`ca-pub-…`) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Verificação do Search Console |

**Nunca** exponha `SUPABASE_SERVICE_ROLE_KEY` ao cliente.

## Supabase

Passo a passo completo em [`docs/supabase-setup.md`](docs/supabase-setup.md). Resumo:

1. Crie um projeto no Supabase.
2. Rode as migrations de `supabase/migrations/` em ordem (SQL Editor ou CLI).
3. Rode `supabase/seed.sql` (categorias, configurações).
4. Cadastre-se pelo site (`/cadastro`) e promova-se a admin:
   ```sql
   select public.promote_to_admin('seu-email@exemplo.com');
   ```
5. Habilite o provedor **Google** em Authentication > Providers e configure a URL de callback `…/auth/callback`.

## Scripts

```bash
npm run dev        # desenvolvimento
npm run build      # build de produção (standalone)
npm start          # inicia o servidor de produção
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

## Deploy no Hostinger

Guia completo em [`docs/hostinger-deploy.md`](docs/hostinger-deploy.md). Resumo:

- Node.js **24**; ponto de entrada `server.js`.
- Build: `npm install && npm run build`.
- Start: o Passenger executa `server.js` (usa `output: standalone`).
- Configure as variáveis de ambiente no painel e o domínio de imagens do Supabase (já derivado automaticamente no `next.config.mjs`).

## Papéis e permissões

- **Usuário comum** — comenta, avalia, favorita, gerencia o próprio perfil.
- **Publisher** — cria/edita os próprios posts, faz upload de imagens; publishers aprovados **publicam direto**.
- **Admin** — gerencia todo o conteúdo, usuários, taxonomias, comentários, avaliações, publicidade, contratos, clientes e configurações.

Autorização aplicada em **duas camadas**: middleware/servidor (Next) **e** RLS no Supabase. Nunca confie apenas no frontend.

## Fluxos

- **Publicação** — [`docs/publishing-guide.md`](docs/publishing-guide.md)
- **Publicidade e contratos manuais** — [`docs/advertising-guide.md`](docs/advertising-guide.md)
- **Administração** — [`docs/admin-guide.md`](docs/admin-guide.md)
- **SEO / Google News / Discover** — [`docs/seo-guide.md`](docs/seo-guide.md)

## SEO e prontidão para Google News/Discover

- Metadata dinâmica, canonical, Open Graph e Twitter Card (`lib/seo/metadata.ts`).
- Schemas JSON-LD: Organization, WebSite, Breadcrumb, Article/**NewsArticle**, Event (`lib/seo/schema.ts`).
- `sitemap.xml`, `robots.txt`, `rss.xml`, feed de notícias `/feed/noticias`, `llms.txt`.
- Conteúdo patrocinado sempre rotulado e separado do editorial.
- Páginas de autor, datas de publicação/atualização visíveis, capas 16:10.

> **Importante:** a inclusão no Google News/Discover **não é garantida**. O projeto apenas deixa a estrutura técnica, editorial e de metadados o mais compatível possível.

## Manutenção

- Regenere os tipos após alterar o schema:
  ```bash
  supabase gen types typescript --project-id <ref> --schema public > types/database.generated.ts
  ```
  e ajuste `types/database.ts`.
- Rode `public.expire_contracts()` periodicamente (pg_cron) para expirar contratos vencidos.

## Estrutura

```
app/            # rotas (App Router) — page.tsx nas rotas; views em SubPasta/index.tsx
components/     # componentes reutilizáveis (ComponentName/index.tsx)
features/       # componentes/lógica por domínio (posts, auth, engagement, contacts...)
lib/            # supabase, seo, ads, auth, utils, config, fonts, icons
types/          # database.ts, posts.ts, ads.ts, users.ts
supabase/       # migrations/ e seed.sql
docs/           # documentação
```
