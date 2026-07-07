# CORE Admin Fase A — Endpoints Admin de Tickets (ForFrids) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar a API admin de tickets de suporte do Eterno Pet (detalhe, resposta por email com histórico persistido) para o console CORE consumir.

**Architecture:** Já existem `GET /api/admin/support-tickets` (lista) e `PATCH .../[id]` (status). Este plano adiciona: tabela `support_ticket_replies` (histórico), `GET .../[id]` (detalhe + replies), template de email de resposta e `POST .../[id]/reply` (envia email via provider SMTP existente, persiste a resposta e atualiza o status). Tudo no padrão Bearer de `src/lib/admin/auth.ts` (`authorizeAdmin`).

**Tech Stack:** Next.js 15 route handlers, Prisma 6, Zod, provider de email `@/lib/email/client`, Vitest (integração com Postgres dev via podman).

## Global Constraints

- Auth em TODA rota: `const unauthorized = authorizeAdmin(request); if (unauthorized) return unauthorized;` (primeira linha do handler).
- `export const dynamic = 'force-dynamic';` em toda rota admin (padrão das existentes).
- Status válidos do ticket: `open | in_progress | resolved` (enum `SupportTicketStatus` — NÃO usar "answered").
- Erros JSON `{ error: string }` com HTTP status correto; mensagens PT-BR.
- Email de resposta NUNCA persiste a reply se o envio falhar (enviar primeiro, persistir depois).
- Testes de integração rodam contra o Postgres dev (docker-compose/podman) e limpam os dados que criam.
- Commits sem trailer de coautoria.

---

### Task 1: Migration — tabela `support_ticket_replies`

**Files:**
- Modify: `prisma/schema.prisma` (novo model após `SupportTicket` ~linha 330; relação inversa em `SupportTicket`)

**Interfaces:**
- Produces: `prisma.supportTicketReply` com `{ id, ticket_id, message, sent_to, created_at }` e relação `ticket.replies`.

- [ ] **Step 1: Adicionar relação inversa no model `SupportTicket`** (após `image_url`)

```prisma
  replies         SupportTicketReply[]
```

- [ ] **Step 2: Adicionar o model após `SupportTicket`**

```prisma
model SupportTicketReply {
  id         String        @id @default(uuid()) @db.Uuid
  ticket_id  String        @db.Uuid
  ticket     SupportTicket @relation(fields: [ticket_id], references: [id], onDelete: Cascade)
  message    String
  sent_to    String
  created_at DateTime      @default(now()) @db.Timestamptz()

  @@index([ticket_id, created_at(sort: Desc)], map: "idx_ticket_replies_ticket_created")
  @@map("support_ticket_replies")
}
```

- [ ] **Step 3: Gerar migration** (Postgres dev precisa estar de pé — `podman compose up -d` se necessário)

Run: `npx prisma migrate dev --name add_support_ticket_replies`
Expected: pasta `prisma/migrations/*_add_support_ticket_replies/` criada; client regenerado.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add prisma/
git commit -m "feat: tabela support_ticket_replies para historico de respostas"
```

---

### Task 2: `GET /api/admin/support-tickets/[id]` — detalhe com replies

**Files:**
- Modify: `src/app/api/admin/support-tickets/[id]/route.ts` (adicionar handler GET ao arquivo que já tem PATCH)
- Test: `src/app/api/admin/support-tickets/admin-tickets.integration.test.ts` (novo)

**Interfaces:**
- Consumes: `prisma.supportTicketReply` (Task 1), `authorizeAdmin` de `@/lib/admin/auth`.
- Produces: resposta JSON `{ ticket: { ...campos do SupportTicket, user: { id, email, full_name, plan_id } | null, replies: [{ id, message, sent_to, created_at }] } }`.

- [ ] **Step 1: Escrever teste de integração que falha**

Criar `src/app/api/admin/support-tickets/admin-tickets.integration.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Carrega .env.local (DATABASE_URL do dev + ADMIN_API_TOKEN)
function loadEnvLocal() {
  const raw = readFileSync(resolve(__dirname, '../../../../../.env.local'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
  }
}
loadEnvLocal();

const TOKEN = process.env.ADMIN_API_TOKEN!;

function authedRequest(url: string, init?: RequestInit) {
  return new Request(url, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', ...init?.headers },
  });
}

describe('admin support-tickets [id]', () => {
  let ticketId: string;
  let prisma: (typeof import('@/lib/prisma'))['prisma'];

  beforeAll(async () => {
    prisma = (await import('@/lib/prisma')).prisma;
    const ticket = await prisma.supportTicket.create({
      data: {
        type: 'bug',
        title: 'Teste integração detalhe',
        message: 'mensagem de teste',
        contact_email: 'teste-admin@example.com',
      },
    });
    ticketId = ticket.id;
  });

  afterAll(async () => {
    await prisma.supportTicket.deleteMany({ where: { id: ticketId } });
  });

  it('retorna 401 sem token', async () => {
    const { GET } = await import('./[id]/route');
    const res = await GET(new Request(`http://test/api/admin/support-tickets/${ticketId}`), {
      params: Promise.resolve({ id: ticketId }),
    });
    expect(res.status).toBe(401);
  });

  it('retorna detalhe com replies vazio', async () => {
    const { GET } = await import('./[id]/route');
    const res = await GET(authedRequest(`http://test/api/admin/support-tickets/${ticketId}`), {
      params: Promise.resolve({ id: ticketId }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ticket.id).toBe(ticketId);
    expect(body.ticket.title).toBe('Teste integração detalhe');
    expect(body.ticket.replies).toEqual([]);
  });

  it('retorna 404 para id inexistente', async () => {
    const { GET } = await import('./[id]/route');
    const missing = '00000000-0000-0000-0000-000000000000';
    const res = await GET(authedRequest(`http://test/api/admin/support-tickets/${missing}`), {
      params: Promise.resolve({ id: missing }),
    });
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/app/api/admin/support-tickets/admin-tickets.integration.test.ts`
Expected: FAIL — `GET` não é exportado de `./[id]/route`.

- [ ] **Step 3: Implementar o GET** em `src/app/api/admin/support-tickets/[id]/route.ts` (mesmo arquivo do PATCH; manter imports existentes e adicionar o handler)

```ts
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const unauthorized = authorizeAdmin(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, full_name: true, plan_id: true } },
      replies: {
        orderBy: { created_at: 'desc' },
        select: { id: true, message: true, sent_to: true, created_at: true },
      },
    },
  });

  if (!ticket) return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 });

  return NextResponse.json({ ticket });
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/app/api/admin/support-tickets/admin-tickets.integration.test.ts`
Expected: 3 testes PASS.

- [ ] **Step 5: Typecheck + commit**

Run: `npx tsc --noEmit`

```bash
git add "src/app/api/admin/support-tickets/[id]/route.ts" src/app/api/admin/support-tickets/admin-tickets.integration.test.ts
git commit -m "feat: detalhe de ticket admin com historico de respostas"
```

---

### Task 3: Template de email de resposta de suporte

**Files:**
- Modify: `src/lib/email/templates.ts` (adicionar ao fim)

**Interfaces:**
- Produces: `supportReplyEmail(input: { name: string; ticketTitle: string; replyMessage: string }): { subject: string; html: string }`.

- [ ] **Step 1: Implementar** (seguir o estilo dos templates de billing no mesmo arquivo; `replyMessage` pode ter quebras de linha — converter para `<br/>`)

```ts
export function supportReplyEmail({ name, ticketTitle, replyMessage }: { name: string; ticketTitle: string; replyMessage: string }): { subject: string; html: string } {
  const escaped = replyMessage
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
  return {
    subject: `Re: ${ticketTitle} — Suporte Eterno Pet`,
    html: `
      <p>Olá, ${name},</p>
      <p>Sobre a sua mensagem "<strong>${ticketTitle}</strong>":</p>
      <p>${escaped}</p>
      <p>Se precisar de mais alguma coisa, é só responder este email.</p>
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
git commit -m "feat: template de email de resposta de suporte"
```

---

### Task 4: `POST /api/admin/support-tickets/[id]/reply`

**Files:**
- Create: `src/app/api/admin/support-tickets/[id]/reply/route.ts`
- Test: `src/app/api/admin/support-tickets/admin-tickets.integration.test.ts` (adicionar bloco)

**Interfaces:**
- Consumes: `supportReplyEmail` (Task 3), `getEmailClient`/`EMAIL_FROM` de `@/lib/email/client`, `prisma.supportTicketReply` (Task 1).
- Produces: `POST` body `{ message: string (min 2), status?: 'in_progress' | 'resolved' }` → 200 `{ reply: { id, message, sent_to, created_at }, ticket: { id, status } }`. Destinatário = `ticket.contact_email ?? ticket.user.email`; sem destinatário → 422. Falha de envio → 502 e nada persistido. Status default após reply: `in_progress`.

- [ ] **Step 1: Adicionar testes ao arquivo de integração** (dentro do `describe` existente, mockando o email client no topo do arquivo, antes dos imports dinâmicos)

No TOPO do arquivo de teste (após os imports estáticos):

```ts
import { vi } from 'vitest';

const sendMock = vi.fn().mockResolvedValue({ data: { id: 'mock-email-id' } });
vi.mock('@/lib/email/client', () => ({
  EMAIL_FROM: 'Teste <teste@example.com>',
  getEmailClient: () => ({ emails: { send: sendMock } }),
}));
```

Novo bloco de testes:

```ts
describe('POST reply', () => {
  it('envia email, persiste reply e muda status', async () => {
    const { POST } = await import('./[id]/reply/route');
    const res = await POST(
      authedRequest(`http://test/api/admin/support-tickets/${ticketId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message: 'Olá! Corrigimos o problema.', status: 'resolved' }),
      }),
      { params: Promise.resolve({ id: ticketId }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reply.sent_to).toBe('teste-admin@example.com');
    expect(body.ticket.status).toBe('resolved');
    expect(sendMock).toHaveBeenCalledOnce();

    const replies = await prisma.supportTicketReply.findMany({ where: { ticket_id: ticketId } });
    expect(replies).toHaveLength(1);
  });

  it('nao persiste reply quando o envio falha', async () => {
    sendMock.mockRejectedValueOnce(new Error('smtp down'));
    const { POST } = await import('./[id]/reply/route');
    const res = await POST(
      authedRequest(`http://test/api/admin/support-tickets/${ticketId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message: 'segunda tentativa' }),
      }),
      { params: Promise.resolve({ id: ticketId }) },
    );
    expect(res.status).toBe(502);
    const replies = await prisma.supportTicketReply.findMany({ where: { ticket_id: ticketId } });
    expect(replies).toHaveLength(1); // só a do teste anterior
  });

  it('valida mensagem vazia com 400', async () => {
    const { POST } = await import('./[id]/reply/route');
    const res = await POST(
      authedRequest(`http://test/api/admin/support-tickets/${ticketId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message: '' }),
      }),
      { params: Promise.resolve({ id: ticketId }) },
    );
    expect(res.status).toBe(400);
  });
});
```

(O `afterAll` existente já apaga o ticket; o cascade da FK apaga as replies.)

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/app/api/admin/support-tickets/admin-tickets.integration.test.ts`
Expected: FAIL — módulo `./[id]/reply/route` não existe.

- [ ] **Step 3: Implementar** `src/app/api/admin/support-tickets/[id]/reply/route.ts`

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authorizeAdmin } from '@/lib/admin/auth';
import { EMAIL_FROM, getEmailClient } from '@/lib/email/client';
import { supportReplyEmail } from '@/lib/email/templates';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const schema = z.object({
  message: z.string().min(2, 'Mensagem muito curta'),
  status: z.enum(['in_progress', 'resolved']).optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const unauthorized = authorizeAdmin(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: { user: { select: { email: true, full_name: true } } },
  });
  if (!ticket) return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 });

  const sentTo = ticket.contact_email ?? ticket.user?.email ?? null;
  if (!sentTo) {
    return NextResponse.json({ error: 'Ticket sem email de contato' }, { status: 422 });
  }

  const name = ticket.user?.full_name?.split(' ')[0] ?? 'Tutor';
  const template = supportReplyEmail({ name, ticketTitle: ticket.title, replyMessage: parsed.data.message });

  try {
    await getEmailClient().emails.send({
      from: EMAIL_FROM,
      to: sentTo,
      subject: template.subject,
      html: template.html,
    });
  } catch (error) {
    log.error('[admin:tickets] falha ao enviar resposta', { ticketId: id, error });
    return NextResponse.json({ error: 'Falha ao enviar o email de resposta' }, { status: 502 });
  }

  const nextStatus = parsed.data.status ?? 'in_progress';
  const [reply, updated] = await prisma.$transaction([
    prisma.supportTicketReply.create({
      data: { ticket_id: id, message: parsed.data.message, sent_to: sentTo },
      select: { id: true, message: true, sent_to: true, created_at: true },
    }),
    prisma.supportTicket.update({
      where: { id },
      data: { status: nextStatus },
      select: { id: true, status: true },
    }),
  ]);

  return NextResponse.json({ reply, ticket: updated });
}
```

- [ ] **Step 4: Rodar toda a suite e ver passar**

Run: `npm test`
Expected: todos os testes PASS (lifecycle 9 + integração 6).

- [ ] **Step 5: Typecheck + commit**

Run: `npx tsc --noEmit`

```bash
git add "src/app/api/admin/support-tickets/[id]/reply/route.ts" src/app/api/admin/support-tickets/admin-tickets.integration.test.ts
git commit -m "feat: resposta de ticket admin com email e historico persistido"
```

---

### Task 5: Documentar os endpoints em `docs/admin-api.md`

**Files:**
- Modify: `docs/admin-api.md` (nova seção após os endpoints de pets)

**Interfaces:**
- Consumes: contratos das Tasks 2 e 4 (shapes exatos das respostas).

- [ ] **Step 1: Adicionar a seção** (seguir o formato das seções existentes do arquivo)

```markdown
### `GET /support-tickets`

Lista tickets. Query: `status` (`open|in_progress|resolved`), `limit` (max 200), `offset`.
Resposta: `{ total, limit, offset, items: SupportTicket[] }`.

### `GET /support-tickets/:id`

Detalhe com autor e histórico. Resposta: `{ ticket: { ...SupportTicket, user: { id, email, full_name, plan_id } | null, replies: [{ id, message, sent_to, created_at }] } }`. 404 se não existe.

### `POST /support-tickets/:id/reply`

Body: `{ "message": string, "status"?: "in_progress" | "resolved" }` (status default: `in_progress`).
Envia email de resposta ao autor (`contact_email` ?? email do usuário) e persiste no histórico.
Respostas: 200 `{ reply, ticket: { id, status } }` · 400 mensagem inválida · 404 ticket inexistente · 422 sem email de contato · 502 falha de envio (nada é persistido).

### `PATCH /support-tickets/:id`

Body: `{ "status": "open" | "in_progress" | "resolved" }`. Atualiza só o status (sem email).
```

- [ ] **Step 2: Smoke test manual com curl** (dev server rodando)

```bash
TOKEN=$(grep ADMIN_API_TOKEN .env.local | cut -d= -f2)
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/admin/support-tickets?limit=5"
```
Expected: JSON `{ total, limit, offset, items }`.

- [ ] **Step 3: Commit**

```bash
git add docs/admin-api.md
git commit -m "docs: endpoints admin de tickets de suporte"
```

## Checklist spec → plano (self-review)

- `GET lista` — já existia ✓ (documentada na Task 5)
- `GET /:id` detalhe com replies → Task 2 ✓
- `POST /:id/reply` com email via SMTP + histórico → Tasks 1, 3, 4 ✓
- `POST /:id/status` → já existia como `PATCH` (equivalente; documentada na Task 5; o adapter do CORE usa PATCH) ✓
- Padrão Bearer + force-dynamic em tudo ✓
- Status conforme enum real (`in_progress` no lugar do "answered" do spec) ✓
