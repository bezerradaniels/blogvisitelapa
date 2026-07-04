# Guia de SEO, Google News e Discover

> A inclusão no Google News/Discover **não é garantida**. Aqui deixamos a estrutura técnica, editorial e de metadados o mais compatível possível.

## Metadata (`lib/seo/metadata.ts`)

`buildMetadata()` gera título, descrição, **canonical**, Open Graph e Twitter Card. Usado em todas as rotas. Posts respeitam `allow_indexing` (define `noindex`).

## Dados estruturados (`lib/seo/schema.ts`)

- **Organization** (`NewsMediaOrganization`) + **WebSite** (com SearchAction) — no layout raiz.
- **BreadcrumbList** — na página de post.
- **Article** / **NewsArticle** — `NewsArticle` para posts do tipo `noticia`; `Article` para os demais. Inclui headline, description, image, datePublished, dateModified, author, publisher, mainEntityOfPage, articleSection, keywords e `contentLocation` (relevância local).
- **Event** — para posts de evento (data, local, endereço, organizador, ingresso).

## Feeds e mapas

- `/sitemap.xml` — rotas fixas + posts (`include_in_sitemap`) + categorias.
- `/robots.txt` — não bloqueia conteúdo; aponta o sitemap. Bloqueia apenas áreas privadas.
- `/rss.xml` — feed geral.
- `/feed/noticias` — feed orientado a notícias recentes.
- `/llms.txt` — descrição do site para sistemas de IA (em português).

## GEO / SEO local

- Landing pages com H1, intro e SEO focados em "…em Bom Jesus da Lapa" (`lib/config/landings.ts`).
- Metadados de cidade/estado, campos de local/endereço em eventos, `contentLocation` nos schemas.
- Links internos entre conteúdos locais (relacionados, últimas, mais lidas).

## Notícias (rigor jornalístico)

Posts de notícia exibem: categoria, título, subtítulo, autor + link de autor, data de publicação e atualização, imagem principal, corpo, relacionados, fonte quando aplicável e rótulo de patrocínio quando aplicável. Editorial e publicidade são separados claramente.

## Discover — boas práticas

- Capa **16:10** nítida (`next/image`, `sizes` responsivos).
- Títulos claros, sem exagero.
- Layout mobile-first e rápido.
- AdSense conservador (evita anúncios intrusivos acima da dobra).

## Checklist

- [ ] `NEXT_PUBLIC_SITE_URL` = domínio final.
- [ ] Posts com título/descrição de SEO preenchidos.
- [ ] Capa 16:10 com alt descritivo.
- [ ] Autor com `slug` (página `/autor/[slug]`).
- [ ] `NewsArticle` presente em notícias; `Event` em eventos.
- [ ] Patrocinados rotulados.
- [ ] Sitemap, RSS e feed de notícias acessíveis.
- [ ] `robots.txt` não bloqueia conteúdo.
