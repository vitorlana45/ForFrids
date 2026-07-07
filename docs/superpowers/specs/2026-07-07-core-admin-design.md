# Design: CORE Admin — Console Multi-Projeto (Web)

**Data:** 2026-07-07
**Status:** aprovado pelo Vitor (brainstorming em sessão)
**Repo alvo:** novo repositório `core-admin` (este spec vive no ForFrids até o repo existir; os endpoints de suporte são trabalho no ForFrids)

## Problema

Suporte e moderação do Eterno Pet não têm console: a API admin de moderação
existe mas só é consumível via curl, e os tickets de suporte não têm sequer
endpoints admin. Vitor terá outros projetos no futuro e não quer reconstruir
um backoffice por produto — quer um console único ("CORE") onde cada projeto
é um escopo plugável.

## Decisões

1. **Formato: web hospedado** no Coolify (ex.: `admin.lanadev.com.br`), não
   desktop. Deploy por git push, acessível de qualquer máquina. Um wrapper
   Tauri pode embrulhar a mesma UI no futuro, sem reescrita. O projeto
   Angular iniciado (`Desktop/Angular-backoffice-sp`) fica arquivado.
2. **Stack: Next.js 15 + React + TypeScript + Tailwind + shadcn/ui** — mesma
   família do Eterno Pet (produtividade e convenções já dominadas; maior
   ecossistema de componentes admin).
3. **MVP: módulos Moderação e Suporte, escopo Eterno Pet.** Métricas,
   gestão de usuários, multi-operador e notificações são fase 2.
4. **Auth do console: login próprio single-user** com better-auth + Postgres
   do CORE. Tokens admin dos projetos ficam só no servidor (envs).

## Arquitetura multi-projeto

Conceito central: **adapter por projeto** contra **contratos do CORE**.

```
src/
  core/
    contracts.ts      # Report, SupportTicket, ModerationAction, ProjectAdapter
    registry.ts       # projetos registrados
    components/       # DataTable, filas, detail drawer, status badges
  projects/
    eterno-pet/
      config.ts       # nome, slug, ícone, módulos: ['moderation','support']
      adapter.ts      # traduz API admin do Eterno Pet -> contratos
  app/
    p/[project]/moderacao/
    p/[project]/suporte/
```

- O CORE define os contratos TypeScript; cada projeto implementa um adapter
  que mapeia sua API para eles. **Projeto novo = pasta com config + adapter;
  a UI inteira vem de graça.**
- A config declara os módulos habilitados; sidebar e rotas se montam a
  partir do registry (projeto sem moderação não exibe a seção).
- **Chamadas às APIs dos projetos são exclusivamente server-side** (server
  actions/route handlers do CORE) com `Authorization: Bearer` vindo de envs
  (`ETERNOPET_ADMIN_URL`, `ETERNOPET_ADMIN_TOKEN`). O browser só fala com o
  CORE.

## Módulo Moderação (API existente — docs/admin-api.md do ForFrids)

- Fila de denúncias: filtros por status/categoria, ordenação por data,
  destaque visual para `child_safety` e `sexual_content` (topo + vermelho).
- Detalhe do report: descrição, categoria, denunciante, pet denunciado.
- Inspeção do pet: dados do memorial, owner, contadores, outros reports.
- Abrir memorial no browser (link externo).
- Resolver report: `resolved_valid | resolved_invalid | duplicate` + nota.
- Bloquear pet com motivo e **preview do email** que o tutor receberá;
  desbloquear reverte para `flagged` ou `active`.
- Polling de 30s na fila (sem WebSocket por ora).

## Módulo Suporte (endpoints novos no ForFrids — parte deste projeto)

Endpoints admin no Eterno Pet, mesmo padrão Bearer da moderação
(`src/app/api/admin/tickets/...`):

- `GET /api/admin/tickets?status=&limit=&cursor=` — fila com filtros.
- `GET /api/admin/tickets/:id` — detalhe (mensagem, autor, email, plano).
- `POST /api/admin/tickets/:id/reply` — `{ message }`: envia email ao autor
  via provider SMTP existente e marca `answered`.
- `POST /api/admin/tickets/:id/status` — `{ status: open|answered|closed }`.

No CORE: fila por status, detalhe, editor de resposta (com o email enviado
registrado), mudança de status.

## Auth e infraestrutura do CORE

- better-auth email/senha, usuário único criado por seed (env
  `ADMIN_EMAIL`/`ADMIN_PASSWORD` na primeira subida). Cookie httpOnly,
  rate limit no login. Sem cadastro aberto.
- Postgres próprio no Coolify (sessões do better-auth + audit log).
- Tabela `operator_actions`: registro local de cada resolve/block/reply
  (ação, projeto, alvo, timestamp).
- Dockerfile no padrão do Eterno Pet: standalone + `prisma migrate deploy`
  no boot do container.
- Domínio separado dos produtos (ex.: `admin.lanadev.com.br`).

## Fora do escopo (fase 2)

Métricas/MRR por projeto, gestão de usuários (premium manual, reset),
multi-operador com papéis, notificações push/Discord/Slack, wrapper Tauri,
sistema de contestação de bloqueio.

## Ordem de construção

1. Shell do CORE: repo novo, auth, layout com switcher de projeto,
   registry + contratos.
2. Módulo Moderação ponta a ponta (API já existe — valor imediato).
3. Endpoints admin de suporte no ForFrids.
4. Módulo Suporte no CORE.
5. Deploy no Coolify + audit log.

## Critérios de sucesso

- Resolver uma denúncia real e responder um ticket real do Eterno Pet
  inteiramente pelo console, sem curl.
- Adicionar um segundo projeto exige apenas: criar endpoints admin no
  projeto, escrever `config.ts` + `adapter.ts` no CORE e setar 2 envs.
- Nenhum token admin de projeto presente em bundle/network do browser.
- Audit log registra 100% das ações mutáveis do operador.
