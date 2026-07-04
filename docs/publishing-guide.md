# Guia de Publicação

Publishers e admins publicam pelo próprio frontend (sem CMS externo). Editor: **Tiptap** (WYSIWYG), com estrutura preparada para futura importação do Google Docs.

## Painel do publisher

- `/publisher` — seus posts
- `/publisher/posts/novo` — novo post
- `/publisher/posts/[id]/editar` — editar
- `/publisher/rascunhos` — rascunhos
- `/publisher/enviados` — enviados para revisão

## Campos do post

**Conteúdo**: título, subtítulo, slug, resumo, imagem principal + texto alternativo, galeria, corpo (Tiptap).

**Classificação**: categoria, tags, tipo de conteúdo, autor, revisado por.

**Tipos de conteúdo**: `noticia`, `evento`, `guia`, `publieditorial`, `conteudo_patrocinado`, `comunidade`, `turismo`, `religiosidade`.

**Status do post**: `rascunho`, `enviado_para_revisao`, `publicado`, `arquivado`, `removido`.
**Status de moderação**: `pendente`, `aprovado`, `rejeitado`.

**Datas**: publicação e atualização.

**Eventos** (quando `is_event`): início, término, local, endereço, link de ingresso, organizador, link do mapa, marcar como evento patrocinado.

**SEO/Social**: título e descrição de SEO, palavra-chave principal e local, título/descrição/imagem para redes, permitir indexação, incluir no sitemap, incluir no RSS.

**Editorial**: destaque, patrocinado, relacionados, fonte da informação, observações editoriais.

## Fluxo

1. Crie o post (entra como `rascunho`).
2. Faça upload da capa (bucket `post-covers`) e da galeria (`post-gallery`).
3. Escreva no editor. O HTML é **sanitizado no servidor** antes de ser exibido (`lib/utils/sanitize.ts`) — HTML inseguro não é renderizado.
4. **Publisher aprovado** pode publicar direto; caso contrário, envie para revisão.
5. Só aparecem no site posts com `status = publicado` **e** `moderation_status = aprovado` (garantido por RLS).

## Boas práticas (Discover/News)

- Capa **16:10** nítida e coerente com o conteúdo; alt descritivo.
- Título claro, sem clickbait.
- Assine com autor real (página de autor em `/autor/[slug]`).
- Rotule corretamente conteúdo patrocinado/publieditorial.
