# Eterno Pet — Plano de Entregas Restantes

> ⚠️ **Documento histórico (desatualizado).** O Stripe já está implementado e os preços
> mudaram (Premium R$ 8,90/mês, Anual R$ 89,90/ano, sem lifetime). A referência atual do
> projeto é o `CLAUDE.md` na raiz e `docs/stripe-producao.md`.

## Estado atual resumido

| Área | Status |
|------|--------|
| Auth, pets, timeline, memorial público | ✅ Completo |
| Tributos (form + moderação) | ✅ Completo |
| Cápsula do Tempo | ✅ Completo |
| QR Code | ✅ Completo |
| Diário de Crônicas (listagem + filtros + editor) | ✅ Completo |
| Mobile nav + dark mode + loading states | ✅ Completo |
| Configurações de conta | ✅ Completo |
| Engajamento (curtidas + homenagens + crônicas) | ✅ Completo |
| Resend — welcome email + notificação de homenagem | ✅ Completo |
| **Stripe — checkout end-to-end** | ❌ Pendente |
| Cron de lembretes de aniversário | ❌ Pendente |

---

## 🔴 Alta Prioridade — Stripe

### O que já existe
- `src/lib/stripe.ts` — cliente Stripe
- `src/lib/actions/stripe.ts` — `createCheckoutSession` (cria sessão + redireciona)
- `src/app/api/stripe/webhook/route.ts` — webhook handler completo (subscription + lifetime)
- `src/app/(dashboard)/dashboard/planos/page.tsx` — página com `PlanCheckoutButton`
- `src/components/planos/PlanCheckoutButton.tsx` — botão que chama o server action

### O que falta para funcionar

#### 1. Criar produtos no Stripe Dashboard
Acessar [dashboard.stripe.com](https://dashboard.stripe.com) → **Products** → **Add product**

| Produto | Tipo | Preço | Variável env |
|---------|------|-------|-------------|
| Memorial Premium | Recorrente mensal | R$ 19,00/mês | `STRIPE_PRICE_PREMIUM_MONTHLY` |
| Legado Eterno | Pagamento único | R$ 490,00 | `STRIPE_PRICE_LIFETIME` |

Após criar, copiar o **Price ID** (começa com `price_...`) de cada um.

#### 2. Preencher variáveis no `.env.local`
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_LIFETIME=price_...
STRIPE_WEBHOOK_SECRET=whsec_...   # ver passo 3
```

#### 3. Configurar webhook para desenvolvimento local
Instalar o [Stripe CLI](https://stripe.com/docs/stripe-cli) e rodar:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
O CLI exibe o `STRIPE_WEBHOOK_SECRET` (começa com `whsec_`). Copiar para `.env.local`.

#### 4. Testar fluxo completo
1. Login na conta free
2. Ir em `/dashboard/planos`
3. Clicar "Assinar Premium"
4. Completar checkout no Stripe (usar cartão de teste `4242 4242 4242 4242`)
5. Verificar redirecionamento para `/dashboard/planos?success=true`
6. Verificar que `profiles.plan_id` virou `premium` no Supabase
7. Verificar que features bloqueadas (Cápsula, Diário, QR) ficam desbloqueadas

#### 5. Produção (quando for publicar)
- Criar webhook real no Stripe Dashboard → **Developers → Webhooks → Add endpoint**
- URL: `https://eternopet.com.br/api/stripe/webhook`
- Eventos: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- Trocar chaves `sk_test_` → `sk_live_` e `pk_test_` → `pk_live_`

ADICIONEI MAIS 2 
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.payment_succeeded
invoice.payment_failed
---

## 🟡 Médio Prazo

### Cron de lembretes de aniversário (Resend + Vercel Cron)

**O que fazer:**
- Criar `src/app/api/cron/aniversarios/route.ts`
- Query: pets cujo `birth_date` é hoje (dia e mês) + dono com email
- Disparar e-mail de lembrete via Resend
- Registrar cron no `vercel.json`

**vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/cron/aniversarios",
      "schedule": "0 8 * * *"
    }
  ]
}
```
Roda todo dia às 8h (UTC). Requer plano Vercel Pro ou superior.

**Template de e-mail:** `src/lib/emails/birthday-reminder.ts`
- Nome do pet, data, link para o memorial
- CTA: "Acender uma vela digital"

---

### Portal de gerenciamento de assinatura (Stripe Customer Portal)

Após o usuário assinar, ele precisa de um jeito de cancelar, atualizar cartão, ver faturas.

**O que fazer:**
- Ativar o Customer Portal no Stripe Dashboard
- Criar server action `createPortalSession()` em `src/lib/actions/stripe.ts`
- Adicionar botão "Gerenciar assinatura" na página `/dashboard/configuracoes`

**Código da action:**
```typescript
const portalSession = await stripe.billingPortal.sessions.create({
  customer: stripeCustomerId,
  return_url: `${siteUrl}/dashboard/configuracoes`,
});
redirect(portalSession.url);
```

---

### E-mail de confirmação de pagamento

Quando o webhook `checkout.session.completed` disparar, enviar e-mail de confirmação via Resend com:
- Plano adquirido
- Valor pago
- Link para o dashboard

**Arquivo:** `src/lib/emails/payment-confirmation.ts`
**Onde disparar:** `src/app/api/stripe/webhook/route.ts` após o `upsertSubscription`

---

## Ordem de execução sugerida

```
Stripe local (passo 1-4) → testar checkout → Customer Portal → Cron aniversários → E-mail pagamento
```

O fluxo Stripe é pré-requisito para tudo que depende de plano. O resto pode ser feito em paralelo depois.
