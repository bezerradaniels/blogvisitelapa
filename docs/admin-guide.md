# Guia do Administrador

Acesse o painel em `/admin` (requer papel **admin**). O acesso é protegido por middleware **e** por checagem no servidor, além das políticas de RLS.

## Visão geral (`/admin`)

Métricas consolidadas via função `admin_metrics_guarded`:
- Conteúdo: total de posts, publicados, rascunhos, aguardando revisão.
- Comunidade: usuários, publishers, comentários pendentes, novos contatos.
- Publicidade: contratos ativos, vencendo em 7 dias, expirados, leads.
- Patrocínios: posts e eventos patrocinados.

## Áreas do painel

| Rota | Função |
| --- | --- |
| `/admin/posts` | Gerenciar todos os posts (publicar, aprovar/rejeitar, arquivar) |
| `/admin/categorias` · `/admin/tags` | Taxonomias |
| `/admin/comentarios` | Moderar comentários (aprovar/rejeitar/remover) |
| `/admin/avaliacoes` | Avaliações |
| `/admin/contatos` · `/admin/anunciantes` | Mensagens do público e leads comerciais |
| `/admin/clientes-comerciais` | Clientes (com histórico CRM) |
| `/admin/publicidade` · `/admin/banners` | Anúncios e criativos |
| `/admin/contratos` | Contratos manuais (recurso central) |
| `/admin/produtos-avulsos` | Produtos comerciais avulsos |
| `/admin/usuarios` | Usuários e papéis |
| `/admin/configuracoes` | Configurações do site |
| `/admin/auditoria` | Trilha de auditoria |

## Moderação de comentários

Política escolhida: **todos os comentários exigem aprovação**. Novos comentários entram como `pendente` e só aparecem no site quando marcados como `aprovado`.

## Publishers

Publishers **aprovados publicam direto**. Para gerenciar quem pode publicar, ajuste o papel do usuário em `/admin/usuarios` (comum → publisher → admin). A mudança de papel/status só é permitida a admins (garantido por trigger no banco).

## Contratos e alertas

O painel destaca contratos **vencendo** (7 dias) e **expirados**. Rode `select public.expire_contracts();` (ou agende via pg_cron) para expirar automaticamente contratos vencidos.

## Status dos contatos

`novo → lido → em_atendimento → concluído → arquivado`.
