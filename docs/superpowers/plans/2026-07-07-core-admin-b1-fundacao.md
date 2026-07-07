# CORE Admin B1 — Fundação do Repo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o repo `core-admin` (console web multi-projeto) com auth single-user, Postgres próprio, shell com registry de projetos e adapter do Eterno Pet testado — pronto para os módulos B2 (moderação) e B3 (suporte).

**Architecture:** App Next.js 15 único em `c:\Users\vitor\Documents\github\core-admin`. Contratos TypeScript em `src/core/contracts.ts`; cada projeto é uma pasta em `src/projects/<slug>/` com `config.ts` (módulos habilitados) e `adapter.ts` (traduz a API admin do produto para os contratos, chamado só server-side com Bearer de env). Login better-auth sem cadastro público; middleware protege tudo. Spec: `docs/superpowers/specs/2026-07-07-core-admin-design.md` (no repo ForFrids).

**Tech Stack:** Next.js 15 (App Router, src-dir), TypeScript, Tailwind, better-auth + Prisma 6 + PostgreSQL (porta 5433 no dev, database `core_admin`), Zod, Vitest.

## Global Constraints

- Todo texto de UI em PT-BR.
- Tokens/URLs das APIs de produto (`ETERNOPET_ADMIN_URL`, `ETERNOPET_ADMIN_TOKEN`) usados APENAS em código server-side; nunca `NEXT_PUBLIC_`.
- Sem cadastro público: better-auth com `disableSignUp: true`; usuário único via seed.
- Middleware usa `getSessionCookie` de `better-auth/cookies` (cobre o prefixo `__Secure-` em HTTPS — lição do bug do ForFrids).
- Postgres dev na porta **5433** (não colidir com o 5432 do ForFrids).
- Todos os commits no repo NOVO (`c:\Users\vitor\Documents\github\core-admin`), mensagens em PT-BR sem trailer de coautoria.
- Windows; shell = Git Bash; podman disponível (Docker Desktop não).

---

### Task 1: Scaffold do repo + infra dev

**Files:**
- Create: repo `c:\Users\vitor\Documents\github\core-admin` inteiro (create-next-app)
- Create: `docker-compose.yml`, `vitest.config.ts`, `.env`, `.env.example`

**Interfaces:**
- Produces: repo git com Next 15 + TS + Tailwind rodando; `npm test` (vitest) configurado com alias `@/`; Postgres dev up em `localhost:5433`.

- [ ] **Step 1: Criar o app**

```bash
cd /c/Users/vitor/Documents/github
npx create-next-app@latest core-admin --typescript --tailwind --eslint --app --src-dir --use-npm --import-alias "@/*" --no-turbopack
cd core-admin
```
Expected: projeto criado, git já inicializado pelo create-next-app (conferir com `git log`; se não, `git init && git add -A && git commit -m "chore: scaffold next 15"`).

- [ ] **Step 2: Dependências**

```bash
npm i better-auth @prisma/client zod
npm i -D prisma vitest tsx
```

- [ ] **Step 3: Criar `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: core-admin-postgres
    environment:
      POSTGRES_USER: core
      POSTGRES_PASSWORD: core
      POSTGRES_DB: core_admin
    ports:
      - "5433:5432"
    volumes:
      - core_admin_pgdata:/var/lib/postgresql/data
volumes:
  core_admin_pgdata:
```

- [ ] **Step 4: Criar `vitest.config.ts`**

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

Adicionar em `package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 5: Criar `.env.example` (commitado) e `.env` (real, NÃO commitado — conferir que `.gitignore` do scaffold já cobre `.env*`; se cobrir `.env.example` também, ajustar para `!.env.example`)**

`.env.example`:
```env
DATABASE_URL=postgresql://core:core@localhost:5433/core_admin
BETTER_AUTH_SECRET=troque-por-openssl-rand-base64-32
BETTER_AUTH_URL=http://localhost:3100

# Usuário único do console (seed)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=troque-esta-senha

# Projeto: Eterno Pet (API admin — server-side only)
ETERNOPET_ADMIN_URL=http://localhost:3000/api/admin
ETERNOPET_ADMIN_TOKEN=token-dev-do-eterno-pet
```

`.env`: copiar do example; `BETTER_AUTH_SECRET` gerado com `openssl rand -base64 32`; `ETERNOPET_ADMIN_TOKEN` copiado do `ADMIN_API_TOKEN` do `.env.local` do ForFrids.

Adicionar em `package.json` scripts: `"dev": "next dev -p 3100"` (substituir o dev existente — porta 3100 para não colidir com o Eterno Pet em 3000).

- [ ] **Step 6: Subir o banco e verificar**

```bash
podman compose up -d postgres
podman exec core-admin-postgres pg_isready -U core
```
Expected: `accepting connections`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold core-admin (next 15, vitest, postgres dev 5433)"
```

---

### Task 2: Prisma + schema better-auth + audit log + seed

**Files:**
- Create: `prisma/schema.prisma`
- Create: `scripts/seed-admin.ts`
- Modify: `package.json` (scripts `prisma:generate`, `seed:admin`)

**Interfaces:**
- Produces: tabelas better-auth (`user`, `session`, `account`, `verification`), `operator_actions`; comando `npm run seed:admin` cria o usuário único se não existir. Task 3 consome `prisma` client e o schema.

- [ ] **Step 1: Criar `prisma/schema.prisma`** (schema padrão do better-auth + audit)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
  accounts      Account[]

  @@map("user")
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("session")
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@map("account")
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("verification")
}

model OperatorAction {
  id         String   @id @default(uuid()) @db.Uuid
  project    String
  module     String
  action     String
  target_id  String
  detail     String?
  created_at DateTime @default(now()) @db.Timestamptz()

  @@index([project, created_at(sort: Desc)], map: "idx_operator_actions_project_created")
  @@map("operator_actions")
}
```

- [ ] **Step 2: Migration**

```bash
npx prisma migrate dev --name init
```
Expected: migration criada e aplicada; client gerado.

- [ ] **Step 3: Criar `src/lib/prisma.ts`**

```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Criar `scripts/seed-admin.ts`**

```ts
import { auth } from '../src/lib/auth';
import { prisma } from '../src/lib/prisma';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Defina ADMIN_EMAIL e ADMIN_PASSWORD no .env');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Usuário ${email} já existe — nada a fazer.`);
    return;
  }

  await auth.api.signUpEmail({
    body: { email, password, name: 'Operador' },
  });
  console.log(`Usuário ${email} criado.`);
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
```

Adicionar em `package.json` scripts: `"seed:admin": "tsx --env-file=.env scripts/seed-admin.ts"`.

> Nota: o seed usa `auth.api.signUpEmail` (Task 3 cria `src/lib/auth.ts`). O signup público fica desabilitado na config; o seed contorna via flag — ver Task 3 Step 1.

- [ ] **Step 5: Commit** (o seed só roda de fato na Task 3, quando `src/lib/auth.ts` existir)

```bash
git add prisma/ scripts/ src/lib/prisma.ts package.json
git commit -m "feat: schema better-auth + operator_actions e seed do operador"
```

---

### Task 3: better-auth + login + middleware

**Files:**
- Create: `src/lib/auth.ts`, `src/lib/auth-client.ts`
- Create: `src/app/api/auth/[...all]/route.ts`
- Create: `src/app/entrar/page.tsx`
- Create: `src/middleware.ts`
- Modify: `src/app/page.tsx` (redirect)

**Interfaces:**
- Consumes: `prisma` (Task 2).
- Produces: `auth` (server), `authClient.signIn.email` / `signOut` (client), sessão via `auth.api.getSession({ headers })`; rotas protegidas por middleware. Tasks 4-6 assumem usuário logado.

- [ ] **Step 1: Criar `src/lib/auth.ts`**

```ts
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';

const isSeed = process.env.CORE_SEED === 'true';

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3100',
  secret: process.env.BETTER_AUTH_SECRET!,
  emailAndPassword: {
    enabled: true,
    // Cadastro público desabilitado; o seed roda com CORE_SEED=true para criar o único usuário.
    disableSignUp: !isSeed,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },
    },
  },
});
```

Ajustar o script de seed no `package.json` para: `"seed:admin": "cross-env CORE_SEED=true tsx --env-file=.env scripts/seed-admin.ts"` — instalar `npm i -D cross-env` (Windows).

- [ ] **Step 2: Criar `src/lib/auth-client.ts`**

```ts
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : (process.env.BETTER_AUTH_URL ?? 'http://localhost:3100'),
});
```

- [ ] **Step 3: Criar `src/app/api/auth/[...all]/route.ts`**

```ts
import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth.handler);
```

- [ ] **Step 4: Criar `src/middleware.ts`**

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const PUBLIC_PATHS = ['/entrar'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const session = getSessionCookie(request);

  if (!isPublic && !session) {
    const url = request.nextUrl.clone();
    url.pathname = '/entrar';
    return NextResponse.redirect(url);
  }
  if (isPublic && session) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 5: Criar `src/app/entrar/page.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export default function EntrarPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (error) {
      setError('Credenciais inválidas.');
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-8">
        <h1 className="text-xl font-semibold text-zinc-100">CORE Admin</h1>
        <p className="text-sm text-zinc-400">Console operacional. Acesso restrito.</p>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-100 py-2 font-medium text-zinc-900 hover:bg-white disabled:opacity-60"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 6: Substituir `src/app/page.tsx`**

```tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/p/eterno-pet/moderacao');
}
```

- [ ] **Step 7: Seed + smoke manual**

```bash
npm run seed:admin
npm run dev
```
Abrir `http://localhost:3100` → deve redirecionar para `/entrar`; logar com ADMIN_EMAIL/ADMIN_PASSWORD do `.env` → redireciona para `/` (404 por ora — a rota `/p/...` nasce na Task 5; o login funcionando é o critério). `npx tsc --noEmit` limpo.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: auth single-user (better-auth), login e middleware"
```

---

### Task 4: Contratos + adapter eterno-pet (TDD)

**Files:**
- Create: `src/core/contracts.ts`
- Create: `src/core/registry.ts`
- Create: `src/projects/eterno-pet/config.ts`
- Create: `src/projects/eterno-pet/adapter.ts`
- Test: `src/projects/eterno-pet/adapter.test.ts`

**Interfaces:**
- Produces (Tasks 5/B2/B3 consomem):
  - `contracts.ts`: `ModuleId = 'moderation' | 'support'`; tipos `AdminReport`, `AdminTicket`, `AdminTicketDetail`, `Paginated<T> = { total: number; limit: number; offset: number; items: T[] }`; `class AdapterError extends Error { constructor(public status: number, message: string) }`; interfaces `ModerationAdapter { listReports(params: { status?: string; limit?: number; offset?: number }): Promise<Paginated<AdminReport>> }` e `SupportAdapter { listTickets(...): Promise<Paginated<AdminTicket>>; getTicket(id: string): Promise<AdminTicketDetail> }` (métodos de mutação chegam em B2/B3); `ProjectAdapter = { moderation?: ModerationAdapter; support?: SupportAdapter }`; `ProjectConfig = { slug: string; name: string; modules: ModuleId[] }`.
  - `registry.ts`: `getProject(slug): { config: ProjectConfig; adapter: ProjectAdapter } | null`; `listProjects(): ProjectConfig[]`.

- [ ] **Step 1: Criar `src/core/contracts.ts`**

```ts
export type ModuleId = 'moderation' | 'support';

export interface ProjectConfig {
  slug: string;
  name: string;
  modules: ModuleId[];
}

export interface Paginated<T> {
  total: number;
  limit: number;
  offset: number;
  items: T[];
}

export class AdapterError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// ── Moderação (shapes da API admin do Eterno Pet — docs/admin-api.md) ──
export interface AdminReport {
  id: string;
  status: string;
  category: string;
  description: string | null;
  created_at: string;
  pet: {
    id: string;
    name: string;
    memorial_slug: string;
    moderation_status: string;
    owner_id: string;
    owner: { email: string | null; full_name: string | null };
  };
  reporter: { id: string; email: string | null; full_name: string | null } | null;
}

// ── Suporte ──
export interface AdminTicket {
  id: string;
  type: string;
  status: 'open' | 'in_progress' | 'resolved';
  title: string;
  message: string;
  category: string | null;
  contact_email: string | null;
  created_at: string;
  user: { id: string; email: string | null; full_name: string | null } | null;
}

export interface AdminTicketReply {
  id: string;
  message: string;
  sent_to: string;
  created_at: string;
}

export interface AdminTicketDetail extends AdminTicket {
  impact: string | null;
  steps: string | null;
  expected_result: string | null;
  actual_result: string | null;
  page_url: string | null;
  image_url: string | null;
  replies: AdminTicketReply[];
}

export interface ModerationAdapter {
  listReports(params: { status?: string; limit?: number; offset?: number }): Promise<Paginated<AdminReport>>;
}

export interface SupportAdapter {
  listTickets(params: { status?: string; limit?: number; offset?: number }): Promise<Paginated<AdminTicket>>;
  getTicket(id: string): Promise<AdminTicketDetail>;
}

export interface ProjectAdapter {
  moderation?: ModerationAdapter;
  support?: SupportAdapter;
}
```

- [ ] **Step 2: Criar `src/projects/eterno-pet/config.ts`**

```ts
import type { ProjectConfig } from '@/core/contracts';

export const eternoPetConfig: ProjectConfig = {
  slug: 'eterno-pet',
  name: 'Eterno Pet',
  modules: ['moderation', 'support'],
};
```

- [ ] **Step 3: Escrever o teste do adapter** (`src/projects/eterno-pet/adapter.test.ts`)

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEternoPetAdapter } from './adapter';
import { AdapterError } from '@/core/contracts';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  process.env.ETERNOPET_ADMIN_URL = 'http://interno:3000/api/admin';
  process.env.ETERNOPET_ADMIN_TOKEN = 'token-teste';
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('eterno-pet adapter', () => {
  it('lista tickets com querystring e Bearer', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ total: 1, limit: 50, offset: 0, items: [{ id: 't1' }] }));
    const adapter = createEternoPetAdapter();
    const result = await adapter.support!.listTickets({ status: 'open', limit: 10 });

    expect(result.items).toHaveLength(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('http://interno:3000/api/admin/support-tickets?status=open&limit=10');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token-teste');
    expect(init.cache).toBe('no-store');
  });

  it('busca detalhe do ticket', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ticket: { id: 't1', replies: [] } }));
    const adapter = createEternoPetAdapter();
    const detail = await adapter.support!.getTicket('t1');
    expect(detail.id).toBe('t1');
    expect(String(fetchMock.mock.calls[0][0])).toBe('http://interno:3000/api/admin/support-tickets/t1');
  });

  it('lista reports de moderação', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ total: 0, limit: 50, offset: 0, items: [] }));
    const adapter = createEternoPetAdapter();
    const result = await adapter.moderation!.listReports({ status: 'pending' });
    expect(result.total).toBe(0);
    expect(String(fetchMock.mock.calls[0][0])).toBe('http://interno:3000/api/admin/reports?status=pending');
  });

  it('erro HTTP vira AdapterError com status', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Unauthorized' }, 401));
    const adapter = createEternoPetAdapter();
    await expect(adapter.support!.listTickets({})).rejects.toThrowError(AdapterError);
    await expect(adapter.support!.getTicket('x')).rejects.toMatchObject({ status: 401 });
  });

  it('falta de env lança erro claro', () => {
    delete process.env.ETERNOPET_ADMIN_URL;
    expect(() => createEternoPetAdapter()).toThrowError(/ETERNOPET_ADMIN_URL/);
  });
});
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL — `./adapter` não existe.

- [ ] **Step 5: Implementar `src/projects/eterno-pet/adapter.ts`**

```ts
import {
  AdapterError,
  type AdminReport,
  type AdminTicket,
  type AdminTicketDetail,
  type Paginated,
  type ProjectAdapter,
} from '@/core/contracts';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Env ${name} não configurada`);
  return value;
}

function buildQuery(params: { status?: string; limit?: number; offset?: number }): string {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  if (params.offset !== undefined) search.set('offset', String(params.offset));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function createEternoPetAdapter(): ProjectAdapter {
  const baseUrl = requireEnv('ETERNOPET_ADMIN_URL').replace(/\/$/, '');
  const token = requireEnv('ETERNOPET_ADMIN_TOKEN');

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new AdapterError(response.status, body?.error ?? `Erro ${response.status} na API do Eterno Pet`);
    }
    return response.json() as Promise<T>;
  }

  return {
    moderation: {
      listReports: (params) => request<Paginated<AdminReport>>(`/reports${buildQuery(params)}`),
    },
    support: {
      listTickets: (params) => request<Paginated<AdminTicket>>(`/support-tickets${buildQuery(params)}`),
      getTicket: async (id) => {
        const { ticket } = await request<{ ticket: AdminTicketDetail }>(`/support-tickets/${id}`);
        return ticket;
      },
    },
  };
}
```

- [ ] **Step 6: Criar `src/core/registry.ts`**

```ts
import type { ProjectAdapter, ProjectConfig } from './contracts';
import { eternoPetConfig } from '@/projects/eterno-pet/config';
import { createEternoPetAdapter } from '@/projects/eterno-pet/adapter';

interface RegisteredProject {
  config: ProjectConfig;
  createAdapter: () => ProjectAdapter;
}

const PROJECTS: Record<string, RegisteredProject> = {
  'eterno-pet': { config: eternoPetConfig, createAdapter: createEternoPetAdapter },
};

export function listProjects(): ProjectConfig[] {
  return Object.values(PROJECTS).map((p) => p.config);
}

export function getProject(slug: string): { config: ProjectConfig; adapter: ProjectAdapter } | null {
  const registered = PROJECTS[slug];
  if (!registered) return null;
  return { config: registered.config, adapter: registered.createAdapter() };
}
```

- [ ] **Step 7: Rodar e ver passar**

Run: `npm test && npx tsc --noEmit`
Expected: 5 testes PASS; tsc limpo.

- [ ] **Step 8: Commit**

```bash
git add src/core src/projects
git commit -m "feat: contratos, registry e adapter eterno-pet testado"
```

---

### Task 5: Shell — layout com sidebar, switcher e rotas por módulo

**Files:**
- Create: `src/app/p/[project]/layout.tsx`
- Create: `src/app/p/[project]/moderacao/page.tsx`
- Create: `src/app/p/[project]/suporte/page.tsx`
- Create: `src/components/shell/Sidebar.tsx`

**Interfaces:**
- Consumes: `listProjects`, `getProject` (Task 4); sessão (Task 3).
- Produces: navegação `/p/<slug>/<modulo>` com 404 para projeto/módulo não registrado; páginas placeholder que B2/B3 substituem.

- [ ] **Step 1: Criar `src/components/shell/Sidebar.tsx`**

```tsx
import Link from 'next/link';
import { listProjects } from '@/core/registry';
import type { ModuleId } from '@/core/contracts';

const MODULE_LABEL: Record<ModuleId, { label: string; path: string }> = {
  moderation: { label: 'Moderação', path: 'moderacao' },
  support: { label: 'Suporte', path: 'suporte' },
};

export function Sidebar({ activeProject }: { activeProject: string }) {
  const projects = listProjects();
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 p-4">
      <p className="mb-6 text-lg font-semibold text-zinc-100">CORE Admin</p>
      {projects.map((project) => (
        <div key={project.slug} className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">{project.name}</p>
          <nav className="space-y-1">
            {project.modules.map((moduleId) => {
              const module = MODULE_LABEL[moduleId];
              return (
                <Link
                  key={moduleId}
                  href={`/p/${project.slug}/${module.path}`}
                  className={`block rounded-lg px-3 py-2 text-sm ${
                    project.slug === activeProject
                      ? 'text-zinc-200 hover:bg-zinc-800'
                      : 'text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  {module.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </aside>
  );
}
```

- [ ] **Step 2: Criar `src/app/p/[project]/layout.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { getProject } from '@/core/registry';
import { Sidebar } from '@/components/shell/Sidebar';

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ project: string }>;
}) {
  const { project } = await params;
  if (!getProject(project)) notFound();

  return (
    <div className="flex min-h-screen bg-zinc-900 text-zinc-100">
      <Sidebar activeProject={project} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Criar as duas páginas placeholder**

`src/app/p/[project]/moderacao/page.tsx`:
```tsx
import { notFound } from 'next/navigation';
import { getProject } from '@/core/registry';

export default async function ModeracaoPage({ params }: { params: Promise<{ project: string }> }) {
  const { project } = await params;
  const registered = getProject(project);
  if (!registered?.config.modules.includes('moderation')) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Moderação — {registered.config.name}</h1>
      <p className="mt-2 text-zinc-400">Fila de denúncias chega na Fase B2.</p>
    </div>
  );
}
```

`src/app/p/[project]/suporte/page.tsx`:
```tsx
import { notFound } from 'next/navigation';
import { getProject } from '@/core/registry';

export default async function SuportePage({ params }: { params: Promise<{ project: string }> }) {
  const { project } = await params;
  const registered = getProject(project);
  if (!registered?.config.modules.includes('support')) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Suporte — {registered.config.name}</h1>
      <p className="mt-2 text-zinc-400">Fila de tickets chega na Fase B3.</p>
    </div>
  );
}
```

- [ ] **Step 4: Smoke manual**

`npm run dev` → logar → `/` redireciona para `/p/eterno-pet/moderacao` com sidebar; `/p/nao-existe/moderacao` → 404. `npx tsc --noEmit` limpo.

- [ ] **Step 5: Commit**

```bash
git add src/app/p src/components
git commit -m "feat: shell multi-projeto com sidebar e rotas por modulo"
```

---

### Task 6: Verificação final + README

**Files:**
- Create: `README.md` (substituir o do scaffold)

- [ ] **Step 1: Gates**

```bash
npm test && npx tsc --noEmit && npm run lint && npm run build
```
Expected: tudo verde.

- [ ] **Step 2: Escrever `README.md`**

```markdown
# CORE Admin

Console operacional multi-projeto (web). Spec: repo ForFrids,
`docs/superpowers/specs/2026-07-07-core-admin-design.md`.

## Dev

1. `podman compose up -d postgres` (porta 5433)
2. Copiar `.env.example` → `.env` e preencher (BETTER_AUTH_SECRET via
   `openssl rand -base64 32`; ETERNOPET_ADMIN_TOKEN = ADMIN_API_TOKEN do ForFrids)
3. `npx prisma migrate dev`
4. `npm run seed:admin` (cria o usuário único de ADMIN_EMAIL/ADMIN_PASSWORD)
5. `npm run dev` → http://localhost:3100

## Arquitetura

- `src/core/contracts.ts` — tipos e interfaces que todo projeto implementa
- `src/core/registry.ts` — projetos registrados
- `src/projects/<slug>/` — config + adapter por projeto (novo projeto = nova pasta + envs)
- `src/app/p/[project]/<modulo>/` — UI por módulo; front consome só `/api/core/v1` (fase B2+)
- Tokens de produto: só server-side, via env. Nunca `NEXT_PUBLIC_`.

## Testes

`npm test` — vitest (unitários do adapter com fetch mockado).

## Roadmap

- B2: módulo Moderação (fila de reports, resolver, bloquear) + `/api/core/v1` + audit log
- B3: módulo Suporte (fila de tickets, responder por email)
- B4: Dockerfile + deploy Coolify + rede interna com os produtos
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: README com setup, arquitetura e roadmap"
```

## Checklist spec → plano (self-review)

- Repo novo Next 15 + TS + Tailwind ✓ (Task 1) — shadcn adiado para B2 (primeiro uso real de componentes; YAGNI no shell)
- Postgres próprio + better-auth single-user sem cadastro público ✓ (Tasks 2-3)
- Middleware com `getSessionCookie` (lição do __Secure-) ✓ (Task 3)
- Contratos + registry + adapter por projeto, tokens server-side ✓ (Task 4)
- Sidebar/rotas montadas do registry, módulo ausente = 404 ✓ (Task 5)
- `/api/core/v1` e `operator_actions` em uso: chegam em B2 junto com o primeiro módulo real (tabela já criada na Task 2)
- Deploy Coolify: B4 (documentado no README)
