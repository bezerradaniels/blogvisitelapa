# Mapeamento de eventos — Conecta Lapa

Versão: 2.0.0

Escopo: portal editorial, captação comercial e rede social

Destino: Google Analytics 4 via Google Tag Manager

Contêiner: `GTM-T6SGJ6HB`

ID de medição usado no arquivo de importação: `G-BBBES6KRCS`

## Convenções

- Os nomes técnicos seguem `snake_case`, começam com uma letra e têm até 40 caracteres.
- Os nomes amigáveis em português devem ser usados nos nomes de tags, painéis e documentação.
- Eventos de formulário e ações autenticadas só são enviados depois de o backend confirmar sucesso.
- `page_view` é coletado pela Google tag. Os outros eventos são enviados ao `dataLayer` pela aplicação.
- P0 = essencial; P1 = importante; P2 = complementar.
- “Principal” indica a recomendação para marcar o evento como evento principal no GA4.

## Tabela de mapeamento

| Área | Nome amigável | Evento GA4 | Quando disparar | Parâmetros principais | Prioridade | Principal |
|---|---|---|---|---|---|---|
| Navegação | Página visualizada | `page_view` | Em cada carregamento e mudança real de rota do Next.js | automáticos do GA4 | P0 | Não |
| Conteúdo | Lista de conteúdos visualizada | `content_list_view` | Quando uma lista relevante de notícias, eventos, guias ou resultados fica visível | `item_list_id`, `item_list_name`, `content_category`, `result_count` | P1 | Não |
| Conteúdo | Conteúdo selecionado | `content_select` | No clique em card/link de notícia, evento ou conteúdo relacionado | `content_type`, `item_id`, `item_name`, `item_list_id`, `placement` | P1 | Não |
| Conteúdo | Conteúdo visualizado | `content_view` | Ao abrir notícia, evento, guia ou outro conteúdo editorial | `content_type`, `item_id`, `item_name`, `content_category` | P0 | Não |
| Busca | Busca realizada | `search` | Após enviar uma busca com termo não vazio | `search_term`, `result_count` | P0 | Não |
| Conteúdo | Conteúdo compartilhado | `share` | Após acionar o compartilhamento | `content_type`, `item_id`, `method` | P1 | Não |
| Conteúdo | Conteúdo favoritado | `favorite_add` | Depois de salvar um conteúdo nos favoritos com sucesso | `content_type`, `item_id` | P1 | Não |
| Conteúdo | Conteúdo removido dos favoritos | `favorite_remove` | Depois de remover um conteúdo dos favoritos com sucesso | `content_type`, `item_id` | P2 | Não |
| Conteúdo | Conteúdo avaliado | `content_rate` | Depois de registrar a nota com sucesso | `content_type`, `item_id`, `rating_value` | P1 | Não |
| Conteúdo | Comentário enviado | `comment_submit` | Depois de enviar comentário editorial para moderação | `content_type`, `item_id` | P1 | Não |
| Evento | Clique em ingressos | `event_ticket_click` | No clique no link externo de ingressos | `item_id`, `link_url`, `is_free` | P1 | Não |
| Evento | Clique em como chegar | `event_map_click` | No clique para abrir o mapa/local do evento | `item_id`, `link_url` | P2 | Não |
| Navegação | Link externo acessado | `outbound_click` | Em links externos relevantes não cobertos por publicidade/ingressos/mapa | `link_url`, `placement` | P1 | Não |
| Conta | Cadastro concluído | `sign_up` | Depois de o provedor aceitar a criação da conta | `method`, `user_state` | P0 | Sim |
| Conta | Login concluído | `login` | Depois de autenticação bem-sucedida | `method`, `user_state` | P0 | Não |
| Conta | Logout concluído | `logout` | Depois de encerrar a sessão | `method` | P2 | Não |
| Conta | Recuperação de senha solicitada | `password_reset_requested` | Depois de aceitar a solicitação de recuperação | `method` | P2 | Não |
| Relacionamento | Contato enviado | `contact_submit` | Depois de salvar o formulário de contato com sucesso | `form_name`, `user_state` | P0 | Sim |
| Comercial | Interesse em anunciar enviado | `generate_lead` | Depois de salvar o formulário “Anuncie” com sucesso | `form_name`, `content_category`, `user_state` | P0 | Sim |
| Evento | Evento enviado para aprovação | `event_submit` | Depois de cadastrar uma sugestão de evento com sucesso | `form_name`, `user_state`, `is_free` | P0 | Sim |
| Publicidade | Anúncio visualizado | `ad_impression` | Uma vez quando ao menos 50% do anúncio ficar visível por 1 segundo | `ad_campaign_id`, `placement` | P1 | Não |
| Publicidade | Anúncio clicado | `ad_click` | No clique confirmado na peça publicitária | `ad_campaign_id`, `placement`, `link_url` | P0 | Não |
| Perfil | Perfil público visualizado | `profile_view` | Ao abrir um perfil público permitido pela privacidade | `item_id`, `user_state` | P1 | Não |
| Perfil | Perfil atualizado | `profile_update` | Depois de salvar alterações no próprio perfil | `form_name` | P1 | Não |
| Amizade | Pedido de amizade enviado | `friend_request_sent` | Depois de criar o pedido com sucesso | `user_state` | P1 | Não |
| Amizade | Pedido de amizade aceito | `friend_request_accepted` | Depois de aceitar o pedido com sucesso | `user_state` | P1 | Não |
| Mensagens | Mensagem enviada | `message_sent` | Depois de salvar uma mensagem privada com sucesso | `interaction_type` | P1 | Não |
| Comunidades | Comunidade visualizada | `community_view` | Ao abrir a página de uma comunidade | `group_id`, `item_name`, `user_state` | P1 | Não |
| Comunidades | Entrou em comunidade | `join_group` | Depois de entrar em uma comunidade com sucesso | `group_id` | P1 | Opcional |
| Comunidades | Saiu de comunidade | `leave_group` | Depois de sair de uma comunidade com sucesso | `group_id` | P2 | Não |
| Comunidades | Comunidade criada | `community_create` | Depois de criar uma comunidade com sucesso | `group_id`, `content_category` | P0 | Opcional |
| Comunidades | Tópico criado | `topic_create` | Depois de criar um tópico com sucesso | `group_id`, `item_id` | P1 | Não |
| Comunidades | Resposta em tópico enviada | `topic_reply` | Depois de publicar uma resposta com sucesso | `group_id`, `item_id` | P1 | Não |
| Rede social | Publicação criada | `social_post_create` | Depois de criar uma publicação no feed com sucesso | `content_type`, `item_id` | P0 | Opcional |
| Rede social | Interação com publicação | `social_post_interaction` | Depois de curtir, descurtir, repostar, desfazer repost ou comentar com sucesso | `item_id`, `interaction_type` | P1 | Não |
| Fotos | Fotos adicionadas | `photo_upload` | Depois de concluir upload e vínculo das fotos ao álbum | `item_id`, `photo_count` | P1 | Não |
| Notificações | Notificação aberta | `notification_open` | Quando uma notificação leva o usuário ao destino | `content_type`, `item_id` | P2 | Não |

## Parâmetros e dimensões

| Parâmetro | Tipo | Uso | Criar dimensão/métrica personalizada no GA4 |
|---|---|---|---|
| `content_type` | texto | `news_article`, `event`, `guide`, `profile`, `social_post` | Sim, dimensão |
| `item_id` | texto | ID interno não reversível do conteúdo/objeto | Sim, dimensão se necessário para exploração |
| `item_name` | texto | Título editorial; nunca nome de pessoa em eventos sociais | Opcional |
| `content_category` | texto | Categoria editorial, segmento comercial ou tipo da comunidade | Sim, dimensão |
| `item_list_id` | texto | Identificador estável da lista de origem | Sim, dimensão |
| `item_list_name` | texto | Nome legível da lista de origem | Opcional |
| `search_term` | texto | Termo da busca, saneado e limitado a 100 caracteres | O GA4 reconhece no evento `search` |
| `method` | texto | `email`, `google`, `native_share`, etc. | O GA4 reconhece nos eventos recomendados |
| `form_name` | texto | `contact`, `advertiser_interest`, `event_submission`, `profile` | Sim, dimensão |
| `placement` | texto | Posição do card/link/anúncio | Sim, dimensão |
| `link_url` | texto | URL externa sem parâmetros sensíveis | Opcional |
| `ad_campaign_id` | texto | ID interno não reversível da campanha | Sim, dimensão |
| `rating_value` | número | Nota de 1 a 5 | Sim, métrica |
| `group_id` | texto | ID interno não reversível da comunidade | Sim, dimensão |
| `interaction_type` | texto | Tipo da interação social | Sim, dimensão |
| `user_state` | texto | `guest`, `authenticated` ou `publisher` | Sim, dimensão |
| `result_count` | número | Quantidade de resultados/listados | Sim, métrica |
| `is_free` | booleano | Indica evento gratuito | Sim, dimensão |
| `photo_count` | número | Fotos adicionadas na ação | Sim, métrica |

## Contrato do dataLayer

Todos os parâmetros ficam dentro de `event_params`. Antes de cada evento, o objeto deve ser limpo para impedir que parâmetros de um evento anterior vazem para o próximo.

```js
window.dataLayer = window.dataLayer || [];

function trackEvent(event, params = {}) {
  window.dataLayer.push({ event_params: null });
  window.dataLayer.push({ event, event_params: params });
}

trackEvent('event_submit', {
  form_name: 'event_submission',
  user_state: 'guest',
  is_free: true,
});
```

Não enviar e-mail, telefone, WhatsApp, nome, endereço, texto de mensagens/comentários, data de nascimento, CPF, IP ou qualquer outro dado pessoal. Remover query string e fragmento de `link_url` quando puderem conter identificadores. O evento de impressão publicitária deve usar `IntersectionObserver` para não contar apenas a renderização fora da tela.

## Importação no GTM

1. Em **Administrador → Importar contêiner**, selecione `analytics/gtm-ga4-events-import-v2.1.json`.
2. Escolha o espaço de trabalho e use **Mesclar**. Prefira renomear itens conflitantes na primeira importação.
3. O arquivo de combinação não cria uma segunda Google tag: ele aproveita a configuração já existente no contêiner `GTM-T6SGJ6HB` e envia os eventos para `G-BBBES6KRCS`.
4. Na prévia das alterações, devem aparecer 1 tag de evento, 1 acionador de evento personalizado e 19 variáveis da camada de dados.
5. No Preview/Tag Assistant, valide um evento de cada família e confira se a tag `GA4 — Eventos mapeados` disparou uma única vez.
6. Confirme no DebugView do GA4 e só então publique o contêiner.
7. Marque `sign_up`, `contact_submit`, `generate_lead` e `event_submit` como eventos principais no GA4. Os eventos opcionais dependem da meta de produto.

Para `page_view` em navegação cliente do Next.js, mantenha habilitada no fluxo da Web do GA4 a medição de mudanças de página baseadas no histórico. Não crie um segundo disparo manual sem antes testar, para evitar duplicidade.
