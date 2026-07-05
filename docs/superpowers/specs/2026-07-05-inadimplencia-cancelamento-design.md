# Design: Inadimplência, Cancelamento e Recuperação (Modo Lembrança)

**Data:** 2026-07-05
**Status:** aprovado pelo Vitor (brainstorming em sessão)

## Problema

Hoje o ciclo feliz de assinatura funciona (checkout → premium), mas não existe
tratamento de inadimplência nem de cancelamento: o usuário não é avisado quando
o cartão falha, não há consequência visível ao cair para o free além do bloqueio
de criação, e não existe funil de recuperação.

## O que já existe (não mudar)

- Webhook (`/api/stripe/webhook`) sincroniza status da assinatura via
  `upsertStripeSubscription` / `syncStripeInvoice`.
- `getEffectivePlan` (src/lib/plans.ts) considera premium os status
  `active | trialing | past_due`. Quando a Stripe marca `unpaid`/`canceled`,
  o usuário cai para free automaticamente. `past_due` funciona como período
  de graça enquanto os Smart Retries da Stripe retentam o cartão.
- Enforcement de criação: pets, momentos, crônicas e cápsulas já retornam
  `UPGRADE_REQUIRED`/`LIMIT_REACHED` nos limites do free.
- Memorial público já oculta crônicas de dono free; páginas de QR Code e
  cápsulas já bloqueiam no dashboard.
- Customer Portal da Stripe já integrado (`createPortalSession`) para
  atualizar cartão e cancelar.

## Decisões de produto

1. **Nenhum memorial público sai do ar, nunca.** É a promessa da marca
   ("eterno"). O downgrade afeta apenas a edição no dashboard.
2. Comunicação de cobrança falhada: **banner no dashboard + email próprio**,
   no tom acolhedor do produto, em PT-BR.
3. Retenção no cancelamento: **básico** — sem tela de retenção, sem descontos.
   Premium permanece até o fim do período pago (`cancel_at_period_end`,
   padrão do portal).

## Estados e transições

| Evento Stripe | Estado resultante | Ação nova |
|---|---|---|
| `invoice.payment_failed` | `past_due` (mantém premium) | Email "pagamento falhou" (1x por invoice, idempotente) + banner persistente no dashboard |
| `invoice.payment_succeeded` | `active` | Banner some. Sem email |
| Retentativas esgotadas (`subscription.deleted` ou status `unpaid`) | free | Email "modo lembrança" + regras de downgrade |
| Cancelamento voluntário (`subscription.updated` com `cancel_at_period_end=true`) | premium até fim do período | Email "sentiremos sua falta" (informa a data) + aviso discreto no dashboard |
| Fim do período pós-cancelamento (`subscription.deleted`) | free | Email "modo lembrança"; win-back agendado |

## Regras de downgrade — "modo lembrança"

- **Pet ativo:** o mais antigo do usuário (`created_at` asc) permanece 100%
  editável dentro dos limites free. Regra computada em tempo real (sem flag
  persistida no banco).
- **Pets excedentes:** somente-leitura no dashboard. Toda mutação (editar
  dados, adicionar momento, upload de mídia) retorna `UPGRADE_REQUIRED`.
  O memorial público segue intacto. A UI mostra badge "Em modo lembrança"
  com CTA de reativação em `/dashboard/planos`.
- **Momentos excedentes (>5):** permanecem visíveis (público e dashboard);
  apenas criação bloqueada (comportamento atual).
- **Crônicas/cápsulas/QR:** comportamento atual mantido.
- **Exceção — cápsulas já agendadas são entregues mesmo no free.** Cápsula é
  promessa emocional com data marcada; o cron de entrega NÃO filtra por plano.
  Somente criação/edição ficam bloqueadas.

## Comunicação (emails via provider existente, templates em PT-BR)

1. **Pagamento falhou** — disparado pelo webhook no primeiro
   `invoice.payment_failed` de cada invoice (idempotência por invoice id,
   registrada no banco). Conteúdo: aviso gentil + link para o Customer Portal.
2. **Banner `past_due`** — via endpoint `/api/dashboard/alerts` existente:
   "Não conseguimos renovar sua assinatura. Atualize seu cartão até DD/MM
   para manter tudo ativo." CTA → portal.
3. **Despedida** — ao detectar `cancel_at_period_end=true`: confirma a data de
   término e lista, com delicadeza, o que entra em modo lembrança.
4. **Downgrade efetivado** — ao virar free: reforça que os memoriais seguem
   no ar, lista o que foi pausado, CTA de reativação.
5. **Win-back** — cron (em `/api/cron/*`) envia UMA vez, 7 dias após o
   downgrade, apelando à continuidade da história do pet. Registrar envio
   para nunca repetir.

## Componentes técnicos

- `src/lib/plans.ts` ou `src/lib/security/access.ts`: helper
  `assertPetEditable(userId, petId)` (plano efetivo + regra do pet ativo),
  usado nas actions de mutação de pet/timeline/upload.
- Webhook: novos disparos de email nos eventos da tabela acima, com
  idempotência (retries de webhook não podem duplicar emails).
- Persistência mínima de controle: colunas/tabela para registrar emails de
  billing enviados (invoice id, tipo, data) e data do downgrade (para o
  win-back). Migration Prisma correspondente.
- `/api/dashboard/alerts`: expor estado de billing (`past_due`,
  `cancel_at_period_end` + datas) para o banner.
- Cron win-back com auth padrão dos crons existentes.
- Config Stripe (dashboard): Smart Retries ativos; emails nativos de
  cobrança da Stripe desativados (comunicação é nossa).

## Fora do escopo

- Tela de retenção pré-cancelamento; cupons/descontos; arquivamento de
  memorial; campanhas recorrentes de win-back; múltiplos lembretes de
  cobrança além do fluxo acima.

## Critérios de sucesso

- Usuário `past_due` vê banner e recebe 1 email; consegue atualizar cartão
  pelo portal e o banner some ao regularizar.
- Usuário que cai para free com 3 pets: memoriais públicos intactos; só o
  pet mais antigo editável; excedentes com badge e CTA.
- Cápsulas agendadas de usuário free são entregues normalmente.
- Nenhum email duplicado sob retry de webhook.
- Win-back enviado exatamente uma vez, 7 dias após downgrade.
