# Inadimplência/Cancelamento (Modo Lembrança) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tratar pagamento falhado, cancelamento e downgrade para free com comunicação acolhedora e enforcement "modo lembrança", conforme o spec `docs/superpowers/specs/2026-07-05-inadimplencia-cancelamento-design.md`.

**Architecture:** O webhook Stripe já sincroniza assinaturas; adicionamos (1) detecção de transições (farewell/downgrade) em `stripe-sync`, (2) emails idempotentes registrados na tabela `billing_emails`, (3) enforcement do pet ativo nas server actions, (4) estado de billing no endpoint de alerts + banner, (5) cron de win-back.

**Tech Stack:** Next.js 15, Prisma 6, Stripe SDK, provider de email existente (`src/lib/email/client.ts`), Vitest (novo, só para lógica pura).

## Global Constraints

- Todo texto de UI/email em PT-BR, tom acolhedor (produto de luto).
- Server actions retornam `{ error }` — nunca lançam exceção ao cliente. Código de erro para bloqueio de plano: `'UPGRADE_REQUIRED'` (o front já trata).
- Logging só via `import { log } from '@/lib/logger'` ou `billingLog`/`billingError` de `@/lib/billing/debug`.
- Nenhum memorial público sai do ar; enforcement é só em mutation de dashboard.
- Emails de billing NUNCA podem derrubar o webhook (try/catch sempre) e NUNCA duplicam sob retry (dedupe em `billing_emails`).
- Status premium: `['active', 'trialing', 'past_due']` (mesma lista de `src/lib/plans.ts` e `stripe-sync.ts`).

---

### Task 1: Setup do Vitest

**Files:**
- Modify: `package.json` (devDependencies + script `test`)
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: comando `npm test` que roda `vitest run` com alias `@/` → `src/`.

- [ ] **Step 1: Instalar vitest**

```bash
npm install -D vitest
```

- [ ] **Step 2: Criar `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Adicionar script em `package.json`** (dentro de `"scripts"`, após `"test:e2e:install"`)

```json
"test": "vitest run"
```

- [ ] **Step 4: Verificar**

Run: `npm test`
Expected: "No test files found" (exit 0 com `--passWithNoTests`? Não — vitest sai com erro sem testes; aceite a saída "No test files found" e siga: o Task 2 cria o primeiro teste).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: adiciona vitest para testes de logica pura"
```

---

### Task 2: Migration — `billing_emails` + `cancel_at_period_end`

**Files:**
- Modify: `prisma/schema.prisma` (model Subscription ~linha 252; model Profile — adicionar relação; novo model BillingEmail no fim)

**Interfaces:**
- Produces: `prisma.billingEmail` com unique `(type, dedupe_key)`; `Subscription.cancel_at_period_end: boolean`.

- [ ] **Step 1: Adicionar coluna ao model `Subscription`** (após `canceled_at`)

```prisma
  cancel_at_period_end     Boolean   @default(false)
```

- [ ] **Step 2: Adicionar model `BillingEmail`** (após o model UploadEvent) e a relação inversa `billing_emails BillingEmail[]` no model `Profile`

```prisma
model BillingEmail {
  id         String   @id @default(uuid()) @db.Uuid
  profile_id String   @db.Uuid
  profile    Profile  @relation(fields: [profile_id], references: [id], onDelete: Cascade)
  type       String
  dedupe_key String
  created_at DateTime @default(now()) @db.Timestamptz()

  @@unique([type, dedupe_key], map: "billing_emails_type_dedupe_unique")
  @@index([profile_id, type, created_at(sort: Desc)], map: "idx_billing_emails_profile_type")
  @@map("billing_emails")
}
```

- [ ] **Step 3: Gerar migration** (requer Postgres dev rodando — `docker-compose.yml`/podman)

Run: `npx prisma migrate dev --name add_billing_emails`
Expected: nova pasta `prisma/migrations/*_add_billing_emails/` e client regenerado.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add prisma/
git commit -m "feat: tabela billing_emails e cancel_at_period_end na subscription"
```

---

### Task 3: Lógica pura de transição (`lifecycle.ts`) — TDD

**Files:**
- Create: `src/lib/billing/lifecycle.ts`
- Test: `src/lib/billing/lifecycle.test.ts`

**Interfaces:**
- Produces: `detectTransition(prev: SubSnapshot | null, next: SubSnapshot): 'farewell' | 'downgrade' | null` e `type SubSnapshot = { status: string; cancelAtPeriodEnd: boolean }`.

- [ ] **Step 1: Escrever testes que falham** (`src/lib/billing/lifecycle.test.ts`)

```ts
import { describe, expect, it } from 'vitest';
import { detectTransition } from './lifecycle';

describe('detectTransition', () => {
  it('detecta downgrade quando premium vira canceled', () => {
    expect(detectTransition(
      { status: 'active', cancelAtPeriodEnd: false },
      { status: 'canceled', cancelAtPeriodEnd: false },
    )).toBe('downgrade');
  });

  it('detecta downgrade quando past_due vira unpaid', () => {
    expect(detectTransition(
      { status: 'past_due', cancelAtPeriodEnd: false },
      { status: 'unpaid', cancelAtPeriodEnd: false },
    )).toBe('downgrade');
  });

  it('detecta farewell quando cancel_at_period_end liga', () => {
    expect(detectTransition(
      { status: 'active', cancelAtPeriodEnd: false },
      { status: 'active', cancelAtPeriodEnd: true },
    )).toBe('farewell');
  });

  it('farewell tambem sem estado anterior (primeiro upsert ja cancelando)', () => {
    expect(detectTransition(null, { status: 'active', cancelAtPeriodEnd: true })).toBe('farewell');
  });

  it('nao repete farewell se cancelAtPeriodEnd ja era true', () => {
    expect(detectTransition(
      { status: 'active', cancelAtPeriodEnd: true },
      { status: 'active', cancelAtPeriodEnd: true },
    )).toBeNull();
  });

  it('nao dispara nada em renovacao normal', () => {
    expect(detectTransition(
      { status: 'active', cancelAtPeriodEnd: false },
      { status: 'active', cancelAtPeriodEnd: false },
    )).toBeNull();
  });

  it('nao dispara downgrade sem estado anterior premium', () => {
    expect(detectTransition(null, { status: 'canceled', cancelAtPeriodEnd: false })).toBeNull();
  });

  it('past_due continua premium (sem downgrade)', () => {
    expect(detectTransition(
      { status: 'active', cancelAtPeriodEnd: false },
      { status: 'past_due', cancelAtPeriodEnd: false },
    )).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL — módulo `./lifecycle` não existe.

- [ ] **Step 3: Implementar** (`src/lib/billing/lifecycle.ts`)

```ts
export type SubSnapshot = { status: string; cancelAtPeriodEnd: boolean };
export type BillingTransition = 'farewell' | 'downgrade' | null;

const PREMIUM_STATUSES = ['active', 'trialing', 'past_due'];

export function detectTransition(prev: SubSnapshot | null, next: SubSnapshot): BillingTransition {
  const wasPremium = prev !== null && PREMIUM_STATUSES.includes(prev.status);
  const isPremium = PREMIUM_STATUSES.includes(next.status);

  if (wasPremium && !isPremium) return 'downgrade';
  if (isPremium && next.cancelAtPeriodEnd && !prev?.cancelAtPeriodEnd) return 'farewell';
  return null;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: 8 testes PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/billing/lifecycle.ts src/lib/billing/lifecycle.test.ts
git commit -m "feat: deteccao de transicoes de billing (farewell/downgrade)"
```

---

### Task 4: Templates de email de billing

**Files:**
- Modify: `src/lib/email/templates.ts` (adicionar ao fim; seguir o estilo de `petBirthdayEmail`)

**Interfaces:**
- Produces: 4 funções, todas retornando `{ subject: string; html: string }`:
  - `paymentFailedEmail(input: { tutorName: string; plansUrl: string })`
  - `farewellEmail(input: { tutorName: string; premiumUntil: string | null; plansUrl: string })` (`premiumUntil` já formatado "DD/MM/AAAA" ou null)
  - `downgradeEmail(input: { tutorName: string; plansUrl: string })`
  - `winBackEmail(input: { tutorName: string; plansUrl: string })`

- [ ] **Step 1: Implementar os 4 templates**

```ts
export function paymentFailedEmail({ tutorName, plansUrl }: { tutorName: string; plansUrl: string }): { subject: string; html: string } {
  return {
    subject: 'Não conseguimos renovar sua assinatura 🌿',
    html: `
      <p>Olá, ${tutorName},</p>
      <p>Tentamos renovar sua assinatura Premium do Eterno Pet, mas o pagamento não foi aprovado.
      Pode ter sido algo simples — um cartão vencido ou limite momentâneo.</p>
      <p>Vamos tentar novamente nos próximos dias. Para garantir que nada seja pausado,
      você pode atualizar sua forma de pagamento em um minuto:</p>
      <p><a href="${plansUrl}">Atualizar forma de pagamento</a></p>
      <p>Enquanto isso, tudo continua no ar — memoriais, momentos e lembranças.</p>
      <p>Com carinho,<br/>Equipe Eterno Pet</p>
    `,
  };
}

export function farewellEmail({ tutorName, premiumUntil, plansUrl }: { tutorName: string; premiumUntil: string | null; plansUrl: string }): { subject: string; html: string } {
  const untilLine = premiumUntil
    ? `<p>Seu Premium continua ativo até <strong>${premiumUntil}</strong>. Até lá, nada muda.</p>`
    : '';
  return {
    subject: 'Sentiremos sua falta 🕊️',
    html: `
      <p>Olá, ${tutorName},</p>
      <p>Recebemos o seu pedido de cancelamento. Está tudo certo — e queremos que saiba
      que os memoriais dos seus pets continuarão no ar, sempre.</p>
      ${untilLine}
      <p>Depois disso, sua conta entra no plano gratuito: os memoriais além do primeiro
      ficam em <em>modo lembrança</em> (visíveis para todos, mas sem edição), e crônicas,
      cápsulas e QR Code ficam pausados.</p>
      <p>Se mudar de ideia, é só <a href="${plansUrl}">reativar quando quiser</a>.</p>
      <p>Com carinho,<br/>Equipe Eterno Pet</p>
    `,
  };
}

export function downgradeEmail({ tutorName, plansUrl }: { tutorName: string; plansUrl: string }): { subject: string; html: string } {
  return {
    subject: 'Sua conta entrou em modo lembrança 🌿',
    html: `
      <p>Olá, ${tutorName},</p>
      <p>Sua assinatura Premium chegou ao fim, e sua conta agora está no plano gratuito.</p>
      <p>O mais importante: <strong>nenhum memorial saiu do ar</strong>. As páginas dos seus
      pets continuam acessíveis para todos que os amam.</p>
      <p>O que fica pausado: edição dos memoriais além do primeiro, crônicas, cápsulas
      do tempo e QR Code. Tudo volta exatamente como estava se você reativar:</p>
      <p><a href="${plansUrl}">Reativar o Premium</a></p>
      <p>Com carinho,<br/>Equipe Eterno Pet</p>
    `,
  };
}

export function winBackEmail({ tutorName, plansUrl }: { tutorName: string; plansUrl: string }): { subject: string; html: string } {
  return {
    subject: 'A história continua aqui, quando você quiser 💛',
    html: `
      <p>Olá, ${tutorName},</p>
      <p>Faz uma semana que sua conta entrou em modo lembrança. Os memoriais dos seus
      pets seguem no ar — cada foto, cada momento, intactos.</p>
      <p>Se sentir vontade de continuar escrevendo essa história — novos momentos,
      crônicas, cápsulas para datas especiais — o Premium te espera do jeitinho
      que você deixou:</p>
      <p><a href="${plansUrl}">Voltar para o Premium</a></p>
      <p>Com carinho,<br/>Equipe Eterno Pet</p>
    `,
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/lib/email/templates.ts
git commit -m "feat: templates de email de billing (falha, despedida, downgrade, win-back)"
```

---

### Task 5: Envio idempotente (`sendBillingEmailOnce`)

**Files:**
- Create: `src/lib/billing/emails.ts`

**Interfaces:**
- Consumes: `prisma.billingEmail` (Task 2), `getEmailClient`/`EMAIL_FROM` de `@/lib/email/client`.
- Produces: `sendBillingEmailOnce(input: { profileId: string; type: BillingEmailType; dedupeKey: string; subject: string; html: string }): Promise<boolean>` e `type BillingEmailType = 'payment_failed' | 'farewell' | 'downgrade' | 'win_back'`.

- [ ] **Step 1: Implementar**

```ts
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getEmailClient, EMAIL_FROM } from '@/lib/email/client';
import { billingError, billingLog } from '@/lib/billing/debug';

export type BillingEmailType = 'payment_failed' | 'farewell' | 'downgrade' | 'win_back';

// Registra a intenção ANTES de enviar: sob retry de webhook, o segundo insert
// viola o unique (type, dedupe_key) e o email não é reenviado.
export async function sendBillingEmailOnce(input: {
  profileId: string;
  type: BillingEmailType;
  dedupeKey: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  try {
    await prisma.billingEmail.create({
      data: { profile_id: input.profileId, type: input.type, dedupe_key: input.dedupeKey },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      billingLog('billing_email.dedupe_hit', { type: input.type, dedupeKey: input.dedupeKey });
      return false;
    }
    billingError('billing_email.claim_failed', error, { type: input.type });
    return false;
  }

  const profile = await prisma.profile.findUnique({
    where: { id: input.profileId },
    select: { email: true },
  });
  if (!profile?.email) return false;

  try {
    await getEmailClient().emails.send({
      from: EMAIL_FROM,
      to: profile.email,
      subject: input.subject,
      html: input.html,
    });
    billingLog('billing_email.sent', { type: input.type, profileId: input.profileId });
    return true;
  } catch (error) {
    billingError('billing_email.send_failed', error, { type: input.type, profileId: input.profileId });
    return false;
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/lib/billing/emails.ts
git commit -m "feat: envio idempotente de emails de billing"
```

---

### Task 6: Integração no `stripe-sync` (farewell + downgrade)

**Files:**
- Modify: `src/lib/billing/stripe-sync.ts` (função `upsertStripeSubscription`, linhas ~38-121)

**Interfaces:**
- Consumes: `detectTransition` (Task 3), `sendBillingEmailOnce` (Task 5), `farewellEmail`/`downgradeEmail` (Task 4).
- Produces: upsert passa a persistir `cancel_at_period_end` e disparar os emails de transição.

- [ ] **Step 1: Ler estado anterior antes do upsert**

Em `upsertStripeSubscription`, ANTES do `prisma.subscription.upsert`, adicionar:

```ts
const prevRow = await prisma.subscription.findFirst({
  where: { provider: 'stripe', provider_subscription_id: subscription.id },
  select: { status: true, cancel_at_period_end: true },
});
```

- [ ] **Step 2: Persistir `cancel_at_period_end`**

Adicionar em AMBOS os blocos `create:` e `update:` do upsert:

```ts
cancel_at_period_end: subscription.cancel_at_period_end ?? false,
```

- [ ] **Step 3: Disparar emails após `updateProfilePlan`**

Logo após `await updateProfilePlan(profileId, planId, subscription.status);`:

```ts
const transition = detectTransition(
  prevRow ? { status: prevRow.status, cancelAtPeriodEnd: prevRow.cancel_at_period_end } : null,
  { status: subscription.status, cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false },
);

if (transition) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const plansUrl = `${siteUrl}/dashboard/planos`;
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { full_name: true, email: true },
  });
  const tutorName = profile?.full_name?.split(' ')[0] ?? 'Tutor';

  if (transition === 'farewell') {
    const periodEnd = toIsoDate(row.current_period_end);
    const premiumUntil = periodEnd
      ? periodEnd.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      : null;
    const template = farewellEmail({ tutorName, premiumUntil, plansUrl });
    await sendBillingEmailOnce({
      profileId,
      type: 'farewell',
      dedupeKey: `sub_${subscription.id}_${periodEnd?.toISOString() ?? 'x'}`,
      subject: template.subject,
      html: template.html,
    });
  } else {
    const template = downgradeEmail({ tutorName, plansUrl });
    await sendBillingEmailOnce({
      profileId,
      type: 'downgrade',
      dedupeKey: `sub_${subscription.id}`,
      subject: template.subject,
      html: template.html,
    });
  }
}
```

Imports novos no topo do arquivo:

```ts
import { detectTransition } from '@/lib/billing/lifecycle';
import { sendBillingEmailOnce } from '@/lib/billing/emails';
import { downgradeEmail, farewellEmail } from '@/lib/email/templates';
```

- [ ] **Step 4: Typecheck + testes**

Run: `npx tsc --noEmit && npm test`
Expected: sem erros; testes do lifecycle PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/billing/stripe-sync.ts
git commit -m "feat: emails de despedida e downgrade nas transicoes da assinatura"
```

---

### Task 7: Email de pagamento falhado no webhook

**Files:**
- Modify: `src/app/api/stripe/webhook/route.ts` (case `invoice.payment_failed`, linhas ~90-94)

**Interfaces:**
- Consumes: `sendBillingEmailOnce`, `paymentFailedEmail`.

- [ ] **Step 1: Separar o case e enviar o email**

Substituir o case conjunto por:

```ts
case 'invoice.payment_succeeded':
  billingLog('webhook.invoice', { eventId: event.id, type: event.type });
  await syncStripeInvoice(event.data.object as Stripe.Invoice);
  break;

case 'invoice.payment_failed': {
  const invoice = event.data.object as Stripe.Invoice;
  billingLog('webhook.invoice', { eventId: event.id, type: event.type });
  await syncStripeInvoice(invoice);
  await notifyPaymentFailed(invoice);
  break;
}
```

- [ ] **Step 2: Implementar `notifyPaymentFailed`** (no mesmo arquivo, após o `POST`)

```ts
async function notifyPaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId || !invoice.id) return;

  const sub = await prisma.subscription.findFirst({
    where: { provider: 'stripe', provider_customer_id: customerId },
    select: { profile_id: true, profile: { select: { full_name: true } } },
    orderBy: { created_at: 'desc' },
  });
  if (!sub) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const template = paymentFailedEmail({
    tutorName: sub.profile.full_name?.split(' ')[0] ?? 'Tutor',
    plansUrl: `${siteUrl}/dashboard/planos`,
  });
  await sendBillingEmailOnce({
    profileId: sub.profile_id,
    type: 'payment_failed',
    dedupeKey: `invoice_${invoice.id}`,
    subject: template.subject,
    html: template.html,
  });
}
```

Imports novos: `import { prisma } from '@/lib/prisma';`, `import { sendBillingEmailOnce } from '@/lib/billing/emails';`, `import { paymentFailedEmail } from '@/lib/email/templates';`.

- [ ] **Step 3: Teste manual com Stripe CLI (dev server + `stripe listen` rodando)**

Run: `stripe trigger invoice.payment_failed`
Expected: log `billing_email.sent` (ou `dedupe_hit` na segunda vez); linha nova em `billing_emails`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/stripe/webhook/route.ts
git commit -m "feat: email de pagamento falhado (idempotente por invoice)"
```

---

### Task 8: Enforcement do pet ativo (modo lembrança)

**Files:**
- Modify: `src/lib/security/access.ts` (nova função)
- Modify: `src/lib/actions/pets.ts` (`updatePet`, ~linha 58)
- Modify: `src/lib/actions/timeline.ts` (`createTimelineEntry` ~36, `updateTimelineEntry` ~65, `deleteTimelineEntry` ~119)
- Modify: `src/app/api/upload/route.ts` (quando houver `petId` no upload)

**Interfaces:**
- Produces: `isPetEditable(petId: string): Promise<boolean>` em `@/lib/security/access` — `true` se o dono do pet é premium OU o pet é o mais antigo do dono.

- [ ] **Step 1: Implementar `isPetEditable`** (fim de `access.ts`)

```ts
// Modo lembrança: com plano free, apenas o pet mais antigo do dono aceita edição.
// O memorial público nunca é afetado — isto vale só para mutations do dashboard.
export async function isPetEditable(petId: string): Promise<boolean> {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: { owner_id: true },
  });
  if (!pet) return false;

  const ownerPlan = await getEffectivePlanServer(pet.owner_id);
  if (ownerPlan !== 'free') return true;

  const activePet = await prisma.pet.findFirst({
    where: { owner_id: pet.owner_id },
    orderBy: { created_at: 'asc' },
    select: { id: true },
  });
  return activePet?.id === petId;
}
```

- [ ] **Step 2: Aplicar nas actions**

Em `updatePet` (`pets.ts`), após o check de dono (`if (!existing || existing.owner_id !== userId) ...`):

```ts
if (!(await isPetEditable(petId))) return { error: 'UPGRADE_REQUIRED' };
```

Em `createTimelineEntry`, `updateTimelineEntry` e `deleteTimelineEntry` (`timeline.ts`), após o check `if (!pet) return { error: 'Não autorizado' };`:

```ts
if (!(await isPetEditable(pet.id))) return { error: 'UPGRADE_REQUIRED' };
```

(Em `createTimelineEntry` o id é `input.pet_id`; em update/delete é `entry.pet_id`.)

Import em ambos: `import { isPetEditable } from '@/lib/security/access';`

- [ ] **Step 3: Aplicar no upload**

Em `src/app/api/upload/route.ts`, localizar onde `assertOwnsPet` é chamado com o `petId` do form e adicionar em seguida:

```ts
if (!(await isPetEditable(petId))) {
  return NextResponse.json({ error: 'UPGRADE_REQUIRED' }, { status: 403 });
}
```

(ajustar o retorno ao padrão de erro já usado no arquivo).

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Teste manual**

Com um usuário free com 2+ pets no dev: editar o pet mais antigo → funciona; editar o segundo → erro `UPGRADE_REQUIRED` (UI mostra CTA de upgrade).

- [ ] **Step 6: Commit**

```bash
git add src/lib/security/access.ts src/lib/actions/pets.ts src/lib/actions/timeline.ts src/app/api/upload/route.ts
git commit -m "feat: modo lembranca - somente pet ativo editavel no plano free"
```

---

### Task 9: Estado de billing nos alerts + banner + guarda na página de edição

**Files:**
- Modify: `src/lib/dashboard/alerts.ts` (interface + query)
- Create: `src/components/dashboard/billing-banner.tsx`
- Modify: `src/app/(dashboard)/layout.tsx` (renderizar o banner)
- Modify: `src/app/(dashboard)/dashboard/pets/[slug]/editar/page.tsx` (aviso modo lembrança)

**Interfaces:**
- Consumes: `isPetEditable` (Task 8).
- Produces: `DashboardAlerts.billing: { pastDue: boolean; cancelsAt: string | null }` (`cancelsAt` = ISO string de `current_period_end` quando `cancel_at_period_end`).

- [ ] **Step 1: Estender `getDashboardAlerts`**

Na interface:

```ts
export interface DashboardAlerts {
  pendingApprovalsCount: number;
  readyCapsulesCount: number;
  memorialLikesCount: number;
  total: number;
  billing: { pastDue: boolean; cancelsAt: string | null };
}
```

Na função, buscar em paralelo com as demais queries (adicionar ao `Promise.all` ou consulta separada antes do retorno; o early-return de `petIds.length === 0` também precisa devolver `billing` — mover a consulta de billing para antes dele):

```ts
const billingSub = await prisma.subscription.findFirst({
  where: { profile_id: userId, status: { in: ['active', 'trialing', 'past_due'] } },
  orderBy: { created_at: 'desc' },
  select: { status: true, cancel_at_period_end: true, current_period_end: true },
});
const billing = {
  pastDue: billingSub?.status === 'past_due',
  cancelsAt: billingSub?.cancel_at_period_end && billingSub.current_period_end
    ? billingSub.current_period_end.toISOString()
    : null,
};
```

Incluir `billing` nos dois retornos.

- [ ] **Step 2: Criar o banner** (`src/components/dashboard/billing-banner.tsx`, Server Component)

```tsx
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export async function BillingBanner({ userId }: { userId: string }) {
  const sub = await prisma.subscription.findFirst({
    where: { profile_id: userId, status: { in: ['active', 'trialing', 'past_due'] } },
    orderBy: { created_at: 'desc' },
    select: { status: true, cancel_at_period_end: true, current_period_end: true },
  });
  if (!sub) return null;

  if (sub.status === 'past_due') {
    return (
      <div className="bg-secondary/10 border border-secondary/30 text-on-surface rounded-2xl px-6 py-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          Não conseguimos renovar sua assinatura. Atualize sua forma de pagamento
          para manter tudo ativo.
        </p>
        <Link href="/dashboard/planos" className="text-sm font-medium text-primary underline underline-offset-4">
          Atualizar pagamento
        </Link>
      </div>
    );
  }

  if (sub.cancel_at_period_end && sub.current_period_end) {
    const until = sub.current_period_end.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    return (
      <div className="bg-surface-container border border-surface-variant text-on-surface-variant rounded-2xl px-6 py-4 mb-6">
        <p className="text-sm">
          Seu Premium continua ativo até {until}. Se mudar de ideia,{' '}
          <Link href="/dashboard/planos" className="text-primary underline underline-offset-4">reative quando quiser</Link>.
        </p>
      </div>
    );
  }

  return null;
}
```

- [ ] **Step 3: Renderizar no layout**

Em `src/app/(dashboard)/layout.tsx`: obter a sessão já disponível no layout (se o layout não tem sessão, obter via `getServerSession()` de `@/lib/auth-server`) e renderizar `<BillingBanner userId={session.user.id} />` imediatamente antes de `{children}`.

- [ ] **Step 4: Aviso na página de edição**

Em `src/app/(dashboard)/dashboard/pets/[slug]/editar/page.tsx` (Server Component): após resolver o pet, checar `await isPetEditable(pet.id)`; se `false`, renderizar no lugar do form:

```tsx
<div className="bg-surface-container rounded-3xl p-10 text-center space-y-4">
  <h2 className="font-serif text-2xl text-on-surface italic">Em modo lembrança</h2>
  <p className="text-on-surface-variant">
    O memorial de {pet.name} continua no ar para todos que o amam,
    mas a edição está pausada no plano gratuito.
  </p>
  <Link href="/dashboard/planos" className="inline-block bg-primary text-on-primary px-8 py-3 rounded-full font-serif">
    Reativar o Premium
  </Link>
</div>
```

- [ ] **Step 5: Verificar visualmente**

Run: `npm run dev` → com subscription `past_due` no banco dev, o banner aparece no dashboard; com free + 2 pets, `/dashboard/pets/<segundo>/editar` mostra o aviso.

- [ ] **Step 6: Commit**

```bash
git add src/lib/dashboard/alerts.ts src/components/dashboard/billing-banner.tsx "src/app/(dashboard)/layout.tsx" "src/app/(dashboard)/dashboard/pets/[slug]/editar/page.tsx"
git commit -m "feat: banner de billing e aviso de modo lembranca no dashboard"
```

---

### Task 10: Cron de win-back

**Files:**
- Create: `src/app/api/cron/win-back/route.ts`

**Interfaces:**
- Consumes: `sendBillingEmailOnce`, `winBackEmail`, `getEffectivePlanServer`.
- Segue o padrão de auth de `src/app/api/cron/birthday-reminders/route.ts` (`Bearer ${CRON_SECRET}`).

- [ ] **Step 1: Implementar**

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getEffectivePlanServer } from '@/lib/plans';
import { sendBillingEmailOnce } from '@/lib/billing/emails';
import { winBackEmail } from '@/lib/email/templates';

const WIN_BACK_AFTER_DAYS = 7;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - WIN_BACK_AFTER_DAYS * 24 * 60 * 60 * 1000);

  // Âncora: email de downgrade enviado há 7+ dias, sem win-back posterior.
  const downgrades = await prisma.billingEmail.findMany({
    where: { type: 'downgrade', created_at: { lte: cutoff } },
    select: { id: true, profile_id: true, profile: { select: { full_name: true } } },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  let sent = 0;

  for (const downgrade of downgrades) {
    const plan = await getEffectivePlanServer(downgrade.profile_id);
    if (plan !== 'free') continue; // já voltou — não incomodar

    const template = winBackEmail({
      tutorName: downgrade.profile.full_name?.split(' ')[0] ?? 'Tutor',
      plansUrl: `${siteUrl}/dashboard/planos`,
    });
    const wasSent = await sendBillingEmailOnce({
      profileId: downgrade.profile_id,
      type: 'win_back',
      dedupeKey: `downgrade_${downgrade.id}`,
      subject: template.subject,
      html: template.html,
    });
    if (wasSent) sent += 1;
  }

  return NextResponse.json({ sent });
}
```

- [ ] **Step 2: Typecheck + testes**

Run: `npx tsc --noEmit && npm test`
Expected: sem erros.

- [ ] **Step 3: Agendar** (fora do código)

Adicionar ao agendador que chama os crons existentes (Coolify scheduled task / crontab do VPS): `GET /api/cron/win-back` 1x/dia com header `Authorization: Bearer $CRON_SECRET`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/cron/win-back/route.ts
git commit -m "feat: cron de win-back 7 dias apos o downgrade"
```

---

### Task 11: Verificação de ponta a ponta

**Files:** nenhum (verificação).

- [ ] **Step 1: Suite completa**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: tudo verde.

- [ ] **Step 2: Fluxo com Stripe CLI no dev**

1. `stripe listen --forward-to localhost:3000/api/stripe/webhook`
2. Assinar premium com cartão de teste `4242...` → premium ativo.
3. Cancelar no Customer Portal (test mode) → email farewell + banner discreto com a data.
4. `stripe trigger invoice.payment_failed` → email payment_failed + banner past_due (setar o status manualmente no banco dev se o trigger não vincular ao customer: `UPDATE subscriptions SET status='past_due' WHERE profile_id='...'`).
5. Expirar a assinatura (test clock ou `stripe subscriptions cancel <id>`) → email downgrade; usuário free.
6. Com 2 pets: só o mais antigo editável; memorial público de ambos no ar.
7. `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/win-back` (com `created_at` do downgrade retrocedido 8 dias via SQL) → `{ sent: 1 }`; segunda chamada → `{ sent: 0 }`.

- [ ] **Step 3: Config Stripe produção**

No dashboard da Stripe: Smart Retries ativos; emails nativos de cobrança desativados.

## Checklist spec → tasks (self-review)

- Emails payment_failed/farewell/downgrade/win-back → Tasks 4-7, 10 ✓
- Idempotência sob retry → Task 5 (claim antes do envio) ✓
- Banner past_due + aviso de cancelamento → Task 9 ✓
- Pet ativo = mais antigo; excedentes somente-leitura → Task 8 ✓
- Memorial público intacto → nenhuma task toca páginas públicas ✓
- Cápsulas agendadas entregues no free → nenhuma alteração no cron de cápsulas (comportamento atual já entrega) ✓
- Migration para persistência → Task 2 ✓
