# Eterno Pet — Guia de Orientação do Projeto

> Leia este arquivo antes de qualquer alteração. Ele resume o propósito, a arquitetura,
> as convenções e a direção do projeto. Docs complementares: `docs/` e `PLANO_RESTANTE.md`.

## Propósito

SaaS de memoriais digitais para pets (vivos e falecidos). Nasceu em homenagem à **Frids**,
cachorrinha do fundador (Vitor) que viveu 18 anos — por isso o repositório se chama *ForFrids*.
A página `/sobre` conta essa história. Tom do produto: acolhedor, poético, respeitoso com o luto.
Todo texto de UI é em **português brasileiro**.

**Direção atual:** validar o MVP (cadastro → pet → memorial público → conversão para Premium).
Não adicionar features grandes antes de validar conversão.

## Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript 5.8
- **Estilo:** Tailwind CSS 3.4 com tokens Material Design 3 (RGB triplets em `globals.css`), Radix UI/shadcn
- **Auth:** better-auth (email/senha + Google OAuth) com adapter Prisma — cookie `better-auth.session_token`
- **DB:** PostgreSQL via Prisma (`prisma/schema.prisma`)
- **Storage:** S3-compatible — MinIO (dev) / Cloudflare R2 (prod), via `@aws-sdk/client-s3`
- **Pagamentos:** Stripe (assinatura mensal/anual + lifetime one-time) — webhook em `/api/stripe/webhook`
- **Email:** Resend (welcome, reset de senha, notificação de tributos, lembretes)
- **Observabilidade:** Sentry + logger próprio (`src/lib/logger.ts` — nunca `console.log` direto)
- **Deploy:** Coolify (self-hosted, Docker) — ver `Dockerfile` e `docker-compose.yml`
- **Testes:** Playwright e2e (`e2e/`), `npm run test:e2e`

## Design System

- Fontes: **Noto Serif** (títulos, itálico para ênfase emocional) + **Manrope** (corpo)
- Paleta: verde-sálvia (`primary`), creme (`surface`), terracota (`secondary`) — dark mode via `next-themes` (classe `.dark`)
- Ícones: Lucide React (dashboard) + Material Symbols via CDN (páginas públicas)
- Classes utilitárias próprias: `organic-blob`, `soft-elevation` (globals.css), `shadow-premium`, `shadow-memorial` (tailwind.config)
- Imagens `fill`: SEMPRE dentro de container com `relative` + aspect-ratio + `overflow-hidden`, com tamanho definido em TODAS as breakpoints

## Rotas principais

**Públicas:** `/` (landing) · `/sobre` (história da Frids) · `/memorial/[slug]` (ISR, revalidate 60s) ·
`/memorial/[slug]/cronicas/[id]` · `/entrar` · `/cadastrar` · `/recuperar-senha` · `/privacidade` · `/termos`

**Dashboard (protegidas via `src/middleware.ts`):** `/dashboard` (hub) · `perfil` · `configuracoes` ·
`planos` · `qrcode` · `capsulas` · `aprovacoes` (moderação de tributos) · `engajamento` ·
`pets/novo` · `pets/[slug]/editar` · `pets/[slug]/diario[/novo|/[id]/editar]` · `admin/suporte`

**API:** `/api/upload` (upload centralizado com quota) · `/api/stripe/webhook` ·
`/api/dashboard/alerts` · `/api/auth/[...all]` (better-auth) · crons em `/api/cron/*`

## Planos e limites (`src/lib/plans.ts` — fonte da verdade)

| Feature | Grátis | Premium |
|---|---|---|
| Pets | 1 | 5 |
| Momentos de timeline | 5 | 50 |
| Crônicas por pet | 0 | 20 |
| Cápsulas, QR Code | ✗ | ✓ |

Preços (oferta de lançamento): Premium **R$ 9,90/mês** (cheio R$ 14,90) · Anual **R$ 89,90/ano**
(cheio R$ 119,90). Copy de preço centralizada em `src/lib/pricing.ts`, chaveada pela env
`NEXT_PUBLIC_LAUNCH_OFFER` (true = promo; false/ausente = cheio) — ver `docs/stripe-producao.md`.
Plano vitalício foi **descontinuado** — `normalizePlan()` mapeia `lifetime` legado para `premium`.
Resolução do plano efetivo: `getEffectivePlanServer(userId)`. Qualquer copy de marketing
(landing, /dashboard/planos) deve refletir exatamente estes limites.

## Arquivos críticos

- `src/lib/plans.ts` — limites por plano e resolução de plan_id
- `src/lib/security/access.ts` — `assertOwnsPet`, `assertFeatureAccess` (obrigatórios em toda mutation)
- `src/lib/security/upload-limits.ts` + `src/lib/security/rate-limit.ts` — quotas e rate limit (em memória)
- `src/lib/storage/client.ts` — URLs públicas, deleção de objetos
- `src/lib/auth.ts` / `auth-server.ts` / `auth-client.ts` — better-auth (server config / session helper / client)
- `src/types/database.ts` — tipos das entidades
- `src/middleware.ts` — proteção de rotas por cookie de sessão

## Convenções obrigatórias

### Server actions (`src/lib/actions/*`)
1. Retornar `{ error }` ou `{ data }` — nunca lançar exceção para o cliente; erros em PT-BR
2. Autenticar via `getServerSession()`; verificar posse com `assertOwnsPet` e plano com `assertFeatureAccess`
3. Validação Zod server-side sempre (nunca confiar só no client)
4. `revalidatePath(...)` ANTES de operações de storage (delete não pode bloquear o refresh)
5. Upload é feito no client via `fetch('/api/upload')`, com rollback (`deleteUploadedMedia`) se a action falhar

### UI
- Botões no infinitivo ("Salvar"), loading no gerúndio ("Salvando...")
- Keys em listas: nunca índice se itens podem ser removidos/reordenados
- Server Components por padrão; `'use client'` só para forms, uploads, toggles, contadores

### Logging
```ts
import { log } from '@/lib/logger';
log.info('[dominio:acao] mensagem', { contexto });
```

## Decisões de arquitetura registradas

- **Cache/Redis (jul/2026):** decidido NÃO usar Redis por ora. O memorial público já usa ISR
  (`revalidate = 60`) + `revalidatePath` nas mutations; o dashboard é por-usuário e dinâmico.
  O deploy é uma instância única no Coolify, então o rate-limit em memória funciona.
  **Reavaliar se:** (a) escalar para múltiplas instâncias/réplicas (rate limit e quotas de upload
  precisariam de store compartilhado), (b) o Postgres virar gargalo de leitura em memoriais
  virais, ou (c) precisar de filas/jobs. Nesse cenário, a primeira candidata é Upstash/Redis
  apenas para rate-limit + contadores, mantendo ISR para páginas.
- **Auth:** migrado de Supabase Auth para better-auth + Prisma. Referências a Supabase em docs
  antigas (`docs/direction/`) estão desatualizadas.
- **Header do dashboard:** o acesso ao perfil é pelo avatar (sem link "Perfil" na nav).

## Comandos

```bash
npm run dev          # desenvolvimento
npm run build        # build de produção
npm run lint         # eslint
npm run test:e2e     # playwright
npm run security:check
npx tsc --noEmit     # typecheck
```
