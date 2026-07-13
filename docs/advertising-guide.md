# Guia de Publicidade e Contratos

A monetização não se limita ao AdSense. **Contratos manuais são o recurso central.**

## Formatos e posições (placements)

| Placement | Onde aparece |
| --- | --- |
| `home_top` | Topo da home |
| `home_middle` | Meio da home |
| `home_carousel` | Carrossel da home |
| `post_sidebar` | Sidebar do post (desktop) |
| `post_inline_mobile` | Dentro do post (mobile) |
| `category_top` | Topo das listagens/categorias |
| `event_sidebar` | Sidebar de eventos |
| `fixed_carousel_sponsor` | Patrocínio do carrossel fixo |

## Contratos manuais

Campos: tipo de contrato, tipo de anúncio, título, cliente, empresa, datas de início/término, valor negociado, forma e status de pagamento, observações (pagamento e internas), placement, URL do banner, URL de destino, status, prioridade, renovação, criado/atualizado por, histórico.

**Status**: `rascunho`, `agendado`, `ativo`, `pausado`, `expirado`, `removido`, `cancelado`.

Ações: ativar, pausar, remover, reativar, editar, ver detalhes.

## Regras de exibição (resolver)

O `AdBanner` só mostra um anúncio quando **todas** as condições são verdadeiras (função SQL `get_active_ads`):

- `status = 'ativo'`
- `start_date <= hoje <= end_date`
- possui criativo (`banner_url`)

**Nunca** são exibidos anúncios expirados, pausados, removidos, cancelados, sem criativo ou fora do período. Entre os elegíveis, vence a maior `priority`.

## Métricas

`ad_impressions` e `ad_clicks` (com UTM opcional) registram desempenho por contrato/placement.

## Patrocínios de conteúdo

- `sponsored_articles` / `sponsored_events` vinculam patrocínio a um post e definem o rótulo exibido (ex.: "Conteúdo patrocinado", "Evento patrocinado"). O conteúdo patrocinado é sempre rotulado e não se confunde com o editorial.

## Produtos avulsos

`standalone_products` para serviços pontuais (criação de arte, site, vídeo, pacote de divulgação, publieditorial avulso, banner avulso), com status de pagamento e de entrega.

## AdSense

Intensidade escolhida: **conservadora** (leitura limpa, melhor para Discover). Configure `NEXT_PUBLIC_ADSENSE_CLIENT_ID` e ative em `settings` (`adsense.enabled`).

## Alertas de expiração

O painel comercial destaca contratos vencendo e expirados. Configure o cron do
servidor para chamar `POST /api/internal/comercial/sincronizar` com o segredo
`COMMERCIAL_SYNC_SECRET`; a rotina sincroniza estados de contrato, campanhas e
parcelas de forma idempotente.
