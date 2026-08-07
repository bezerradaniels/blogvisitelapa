# Auditoria do ConectaLapa CMS

## Arquitetura preservada

- Next.js App Router, Server Components e Server Actions.
- Supabase Auth, Postgres, RLS e Storage.
- Proteção dupla do admin pelo proxy e por `getCurrentUser()`/`adminGuard()`.
- Rotas públicas, URLs editoriais, integrações, SEO e Google Tag Manager.
- Editor Tiptap, uploads existentes e módulos comerciais.

## Mapa de capacidades

| Conceito de CMS | Equivalente existente | Resultado desta etapa |
|---|---|---|
| Painel | `/admin` e métricas consolidadas | Refatorado em visão operacional compacta |
| Posts | `/admin/posts` | Tabela, filtros, busca, paginação, seleção e ações em massa |
| Edição rápida | `quickEditPost` | Preservada com ações textuais |
| Lixeira de posts | status `removido` | Preservada como fluxo reversível lógico |
| Editor | `PostForm` + Tiptap | Reorganizado visualmente no contexto admin |
| Categorias | `categories` | Gestão compacta e exclusão protegida por relacionamentos |
| Tags | `tags` + `post_tags` | Lista administrativa e edição adicionada |
| Comentários | `comments` | Tabela, busca, paginação, contagens e moderação |
| Usuários | `profiles` + Supabase Auth | Busca, filtros, paginação e controles existentes |
| Eventos | `event_submissions` | Tabela de moderação compacta |
| Comunidades e denúncias | módulos sociais existentes | Sistema visual compartilhado |
| Publicidade e contratos | domínio comercial próprio | Preservado e normalizado pelo design system admin |
| Página inicial | `home_sections` | Preservada e integrada ao shell CMS |
| Configurações | tabela `settings` | Preservada; segredos continuam fora da interface |
| Auditoria | `audit_logs` | Preservada e apresentada no padrão CMS |
| Ferramentas / saúde | inexistente | Diagnóstico seguro adicionado |
| Biblioteca central de mídia | buckets específicos sem catálogo central | Não implementada; requer modelo unificado e política de migração |
| Revisões | inexistente | Não implementada; requer tabela e política de retenção |
| Salvamento automático | inexistente | Não implementado; requer estratégia de conflitos/revisões |
| Opções de tela por usuário | inexistente | Não implementada; requer preferências persistentes por administrador |
| Agendamento de posts | data pública parcial, sem estado editorial completo | Não implementado para evitar inconsistências entre consultas públicas |

## Segurança

- Todas as mutações continuam protegidas no servidor por `adminGuard()` ou pela autorização editorial existente.
- Nenhuma autorização depende apenas da visibilidade de controles.
- Nenhuma chave, token ou variável secreta foi incorporada ao painel.
- A exclusão de categorias agora recusa categorias vinculadas a posts ou com subcategorias.
- Nenhuma migração de banco foi criada.

## Recomendações futuras

1. Projetar uma tabela de ativos de mídia antes de criar uma biblioteca reutilizável.
2. Implementar revisões e salvamento automático em conjunto, com retenção e resolução de conflitos.
3. Formalizar agendamento com estado editorial e tarefa de publicação no servidor.
4. Persistir opções de tela por administrador somente após definir o modelo de preferências.
