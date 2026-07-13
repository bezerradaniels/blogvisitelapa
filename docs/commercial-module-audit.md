# Auditoria e redesenho do módulo comercial

## Objetivo e decisão de arquitetura

O módulo comercial passa a ter **contrato** como acordo financeiro, **item de
contrato** como produto/serviço vendido e **campanha** como entrega publicável.
Essa separação permite que um único contrato tenha, por exemplo, banner na home,
conteúdo patrocinado e pacote social, cada qual com seu próprio período e estado
operacional.

`Cliente → marca/anunciante (opcional) → contrato → itens → campanhas/conteúdo → parcelas`

Um cliente é o responsável comercial e financeiro. Uma marca/anunciante é o nome
que aparece publicamente e pode pertencer ao mesmo cliente ou a uma agência. Os
leads públicos continuam sendo uma caixa de entrada: não são um segundo cadastro
de anunciante.

## Diagnóstico do módulo anterior

| Área | Achado | Impacto |
| --- | --- | --- |
| Contratos | `ad_contracts` guardava simultaneamente contrato, um banner, placement, período e valor. | Não era possível vender vários entregáveis no mesmo acordo. |
| Publicidade | O formulário rápido criava um contrato já ativo. | Pulava validações, aprovação, parcelas e histórico. |
| Clientes | O vínculo era opcional e a empresa podia ser digitada livremente. | Duplicidade e contratos órfãos. |
| Conteúdo patrocinado | Publieditoriais e eventos eram criados fora do contrato. | Patrocínio, cliente e receita podiam ficar desconectados. |
| Financeiro | Havia somente valor negociado e um status manual. | Não havia parcelas, saldo, atraso ou receita recebida confiáveis. |
| Segurança | Funções privilegiadas e uma view podiam ser expostas além do necessário. | Risco de acesso indevido e de ignorar RLS. |
| Exclusão | Contratos e clientes podiam ser apagados definitivamente. | Histórico, métricas e referências podiam se perder. |
| Operação | Não havia ativação/agendamento idempotente para contrato e campanha. | Estados inconsistentes quando não havia navegador aberto. |

## Arquitetura de informação final

| Seção | Responsabilidade | Rota canônica |
| --- | --- | --- |
| Visão comercial | Alertas, resumo operacional e financeiro | `/admin/comercial` |
| Leads | Solicitações recebidas em `/anuncie` | `/admin/comercial/leads` |
| Clientes | Cadastro único de clientes e marcas | `/admin/comercial/clientes` |
| Contratos | Acordos, itens, renovação e detalhe | `/admin/comercial/contratos` |
| Campanhas e publicidade | Entregáveis de banner, estado e mídia | `/admin/comercial/campanhas` |
| Conteúdo patrocinado | Artigos e eventos ligados a itens | `/admin/comercial/conteudo` |
| Produtos e inventário | Catálogo e posições comercializáveis | `/admin/comercial/produtos` |
| Financeiro | Valores contratados, recebíveis e atrasos | `/admin/comercial/financeiro` |

As rotas antigas são mantidas durante a transição e devem redirecionar para a
responsabilidade equivalente. Nenhuma tabela ou registro legado é removido.

## Regras de estado

### Contrato

`rascunho → pendente_aprovacao → aprovado → agendado/ativo → concluido ou expirado`

`pausado` e `cancelado` são estados explícitos. Um cancelamento cancela as
campanhas relacionadas; uma pausa não reativa automaticamente. O estado do
contrato define a elegibilidade comercial, enquanto o estado de cada campanha
define a publicação efetiva.

### Financeiro

O financeiro é calculado a partir das parcelas, não do estado do contrato:

- **contratado líquido**: subtotal de itens − desconto do contrato + adicionais;
- **recebido**: soma das parcelas pagas;
- **pendente**: parcelas pendentes ou parciais ainda não vencidas;
- **em atraso**: parcelas não pagas cuja data de vencimento já passou;
- **saldo**: contratado líquido − recebido, respeitando cancelamentos e estornos.

Todos os valores são manipulados na interface em centavos e armazenados em
`numeric(12,2)`, com exibição brasileira (`R$ 1.234,56`). Parcelas devem somar
exatamente o total final; quaisquer centavos residuais são distribuídos nas
primeiras parcelas.

## Migração e compatibilidade

A migração `0031_commercial_management.sql` é aditiva. Ela:

1. amplia clientes e cria marcas, catálogo de produtos e placements;
2. preserva `ad_contracts` como a identidade do contrato legado;
3. cria `contract_items`, `ad_campaigns`, `contract_payments` e `contract_files`;
4. cria um item, uma campanha e um recebível compatíveis para cada contrato
   legado, sem alterar seus identificadores;
5. mantém a resolução pública de anúncios durante a transição;
6. restringe exclusões destrutivas e registra mudanças de estado;
7. usa RLS e permissões explícitas para as tabelas novas.

### Ordem segura de implantação

1. Fazer backup lógico e registrar contagens de contratos, anúncios ativos,
   patrocínios, assets e recebíveis legados.
2. Aplicar a migração em homologação e conferir as contagens antes/depois.
3. Conferir anúncios ativos por placement e URLs das mídias.
4. Aplicar a migração em produção em janela controlada.
5. Publicar a interface comercial nova.
6. Só depois de uma janela de observação desativar os formulários legados.

## Riscos ainda dependentes do ambiente

- O projeto Supabase configurado localmente não é o projeto disponível no
  conector desta sessão; por isso, contagens de produção, grants efetivos,
  buckets e advisors precisam ser verificados no projeto correto antes do
  deploy.
- O agendamento de `sync_commercial_statuses` exige a rotina escolhida pelo
  ambiente. Esta implementação oferece `POST /api/internal/comercial/sincronizar`,
  protegido por `COMMERCIAL_SYNC_SECRET`, para ser chamado pelo cron da
  hospedagem a cada 5 minutos. A função é idempotente e executa com service
  role; ela não deve ser exposta ao público.
- Arquivos de contrato e comprovantes devem usar bucket privado com URL assinada;
  mídias públicas de anúncio continuam isoladas no bucket de banners.
- O modelo de identidade atual do portal possui apenas `admin` para o backoffice.
  A migração aplica esse limite no backend; papéis comerciais mais granulares
  (financeiro, operador e conteúdo) exigem uma extensão da tabela de perfis e
  devem ser introduzidos antes de liberar acesso não administrativo.

## Checklist manual de aceitação

- [ ] Criar um cliente e reutilizá-lo em dois contratos.
- [ ] Criar um contrato com dois itens, desconto, adicional e parcelas cuja soma
  seja idêntica ao total.
- [ ] Tentar ativar contrato/campanha sem cliente, mídia ou datas válidas e
  confirmar o bloqueio.
- [ ] Criar campanha futura, executar a sincronização e validar agendamento e
  ativação.
- [ ] Cancelar contrato e confirmar que nenhuma campanha continua exibível.
- [ ] Marcar parcela como paga e conferir resumo, saldo e histórico.
- [ ] Renovar um contrato e confirmar vínculo com o anterior, sem reutilizar a
  mídia automaticamente.
- [ ] Conferir as listas e o fluxo de cadastro em 320 px e desktop.
- [ ] Conferir RLS com uma conta não administradora e com uma conta administradora.
- [ ] Conferir que contratos com histórico/parcelas não podem ser apagados.
