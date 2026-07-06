# Stripe — Setup de Produção (LIVE)

O que precisa ser criado na conta Stripe em **modo Live** antes de publicar.
Os preços de test criados em 2026-07 **não** funcionam em produção — Live é uma base separada.

> Atalho: quando você tiver a `sk_live_...`, o Claude roda o mesmo script de migração
> contra ela e devolve os `price_id` de produção automaticamente (evita criar na mão).

---

## 1. Chaves de API (Developers → API keys, com o toggle em **Live**)

| Valor no Stripe | Env de produção |
|---|---|
| Secret key (`sk_live_...`) | `STRIPE_SECRET_KEY` |
| Publishable key (`pk_live_...`) | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |

## 2. Produto + Preços (Products → Add product)

**Produto**
- Nome: `Memorial Premium`
- Descrição: `Assinatura Premium do Eterno Pet`

**Preço 1 — mensal**
- Modelo: Recorrente (Recurring)
- Valor: `R$ 9,90` · Moeda: `BRL` · Período: `Mensal (month)`
- → copiar o `price_...` para `STRIPE_PRICE_PREMIUM_MONTHLY`

**Preço 2 — anual**
- Modelo: Recorrente (Recurring)
- Valor: `R$ 89,90` · Moeda: `BRL` · Período: `Anual (year)`
  (economia de R$ 28,90 vs. 12 × R$ 9,90 — copy promete "quase 3 meses grátis")
- → copiar o `price_...` para `STRIPE_PRICE_PREMIUM_ANNUAL`

> **Oferta de lançamento (jul/2026):** preços cheios R$ 14,90/mês e
> R$ 119,90/ano; cobrados hoje R$ 9,90 e R$ 89,90. Toda a copy das duas
> páginas de preço vem de `src/lib/pricing.ts`, chaveada pela env
> `NEXT_PUBLIC_LAUNCH_OFFER` (`true` = promo com selo/riscado; ausente ou
> `false` = preço cheio, sem selo).
>
> **Para encerrar a promoção (sem tocar em código):**
> 1. Criar na Stripe (live) os prices cheios: R$ 14,90/mês e R$ 119,90/ano;
>    arquivar os promocionais (assinantes existentes permanecem no preço
>    em que assinaram).
> 2. No Coolify, trocar `STRIPE_PRICE_PREMIUM_MONTHLY` e
>    `STRIPE_PRICE_PREMIUM_ANNUAL` para os prices novos e setar
>    `NEXT_PUBLIC_LAUNCH_OFFER=false` (a env precisa estar disponível no
>    BUILD — marcar como build variable — porque a landing é estática).
> 3. Redeploy. Conferir checkout (valor cheio) e as duas páginas (sem selo).
>
> CDC: o "de/por" com selo de lançamento só é lícito se o preço cheio for
> realmente praticado após a promoção — não reative a promo sem critério.

> Definir o preço mensal como **default price** do produto.
> NÃO criar plano vitalício/único — foi descontinuado.

## 3. Webhook (Developers → Webhooks → Add endpoint)

- Endpoint URL: `https://eternopet.com.br/api/stripe/webhook`
- Eventos a escutar:
  ```
  checkout.session.completed
  customer.subscription.created
  customer.subscription.updated
  customer.subscription.deleted
  invoice.payment_succeeded
  invoice.payment_failed
  ```
- → copiar o Signing secret (`whsec_...`) para `STRIPE_WEBHOOK_SECRET`

## 4. Customer Portal (Settings → Billing → Customer portal)

- Ativar o portal (permite cancelar/trocar cartão/ver faturas).
- Permitir troca de plano entre os 2 preços Premium (mensal ↔ anual), se desejar.

---

## Resumo — envs de produção que saem daqui

```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_ANNUAL=price_...
```
