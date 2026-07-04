m  ;# Eterno Pet — Backoffice Desktop

Documento de referência para construir a aplicação **desktop** que consome a API admin do Eterno Pet. Cobre escopo funcional, schema, endpoints, dados de conectividade local para testes, fluxos de UX e considerações de segurança.

> Stack sugerida: **Electron** ou **Tauri** (Tauri preferido — bundle ~3MB, Rust no backend, frontend em React/Vue/Svelte). Como autenticação é via Bearer token estático, qualquer linguagem que faça HTTP serve (até CLI em Go ou Python funciona pro MVP).

---

## 1. Escopo — o que o desktop precisa fazer

A aplicação Next.js do Eterno Pet **não tem UI admin**. Toda moderação acontece via API REST autenticada — o desktop é o "console operacional" do time interno.

### 1.1. Funcionalidades núcleo (MVP)

| # | Feature | Endpoints usados |
|---|---|---|
| 1 | **Fila de denúncias** — listar reports pendentes ordenados por data, com filtros por categoria e status | `GET /reports` |
| 2 | **Detalhe do report** — ver descrição, categoria, URL do memorial, dados do denunciante e do pet denunciado | `GET /reports/:id` |
| 3 | **Inspeção do pet** — abrir dados completos do memorial denunciado (owner, contadores, outros reports) | `GET /pets/:id` |
| 4 | **Abrir memorial no browser** — botão que abre `memorial_url` em browser externo para inspecionar visualmente o conteúdo | sem API — apenas `shell.openExternal` |
| 5 | **Resolver report** — marcar como `resolved_valid`, `resolved_invalid` ou `duplicate` com nota | `POST /reports/:id/resolve` |
| 6 | **Bloquear memorial** — bloquear o pet (status `blocked`) com motivo; dispara email automático ao tutor | `POST /pets/:id/block` |
| 7 | **Desbloquear memorial** — reverter bloqueio (volta para `flagged` se ainda há reports pendentes, ou `active`) | `POST /pets/:id/unblock` |

### 1.2. Funcionalidades complementares (recomendadas)

- **Dashboard inicial** com contadores: reports `pending`, reports `under_review`, pets `blocked`, pets `flagged` (agrupar no client via `GET /reports`).
- **Polling automático** a cada 30s na tela de fila (não há WebSocket — futuro).
- **Highlight visual** para categorias críticas: `child_safety` e `sexual_content` em vermelho/topo.
- **Modal de preview do email** antes de confirmar bloqueio — mostra exatamente o que o tutor vai receber.
- **Histórico do operador** local (SQLite embutido) — log de ações: "fulano bloqueou X em data Y por motivo Z". Cruza com `resolved_by` / `blocked_by` na API.
- **Configuração persistente** do token e URL base (Coolify dev vs prod) — guardar em keyring do SO ou config criptografada.

### 1.3. Funcionalidades futuras (Fase 2+)

- **Sistema de contestação formal** — tutor responde ao bloqueio; backoffice tem fila separada.
- **Audit log oficial** consultável (hoje só `resolved_at`/`blocked_at` no banco).
- **Webhook Discord/Slack** quando entra report de `child_safety` (push notification do desktop também serve).

---

## 2. Conectividade — dados para testar localmente

Tudo isso já está rodando no seu ambiente local via Podman (`docker-compose.yml`).

### 2.1. URLs

| Ambiente | Base URL |
|---|---|
| **Local** | `http://localhost:3000/api/admin` |
| **Produção** | `https://eternopet.com.br/api/admin` |

### 2.2. Variáveis necessárias no desktop

```env
ETERNO_API_BASE=http://localhost:3000/api/admin
ETERNO_API_TOKEN=RVscRx4DJtbr6MsvaPByA1WRY0s0sGURkEoQH1BeKA
```

> O token acima é o **token de DEV** (já presente no `.env.local` do projeto Next). Em produção o token é diferente — deve ser gerado e setado no Coolify, e o operador insere via tela de config do desktop (não hardcoded no binário).

### 2.3. Header de autenticação

Todas as requests precisam de:

```http
Authorization: Bearer RVscRx4DJtbr6MsvaPByA1WRY0s0sGURkEoQH1BeKA
Content-Type: application/json
```

### 2.4. Smoke test (curl)

```bash
# Listar reports pendentes
curl -H "Authorization: Bearer RVscRx4DJtbr6MsvaPByA1WRY0s0sGURkEoQH1BeKA" \
  "http://localhost:3000/api/admin/reports?status=pending&limit=10"

# Detalhe de um report
curl -H "Authorization: Bearer RVscRx4DJtbr6MsvaPByA1WRY0s0sGURkEoQH1BeKA" \
  "http://localhost:3000/api/admin/reports/<UUID>"

# Resolver report
curl -X POST \
  -H "Authorization: Bearer RVscRx4DJtbr6MsvaPByA1WRY0s0sGURkEoQH1BeKA" \
  -H "Content-Type: application/json" \
  -d '{"status":"resolved_invalid","note":"Sem violação"}' \
  "http://localhost:3000/api/admin/reports/<UUID>/resolve"

# Bloquear pet (sem enviar email — modo teste)
curl -X POST \
  -H "Authorization: Bearer RVscRx4DJtbr6MsvaPByA1WRY0s0sGURkEoQH1BeKA" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Conteúdo sexual em foto","notify":false}' \
  "http://localhost:3000/api/admin/pets/<PET_UUID>/block"
```

### 2.5. Como gerar dados de teste

A aplicação local roda em `http://localhost:3000`. Para gerar um report válido para testar o desktop:

1. Crie uma conta em `/cadastrar` (user A — denunciante)
2. Crie outra conta (user B — tutor) → crie um pet com `is_public: true`
3. Logado como user A, acesse `/memorial/<slug-do-pet-do-B>` → clique no botão de denúncia
4. Preencha categoria + descrição → o report cai na fila
5. Use o desktop para listar / resolver / bloquear

---

## 3. Schema — tipos e enums

Esses tipos espelham o schema Prisma e devem ser replicados no desktop (TypeScript types, structs Rust, dataclasses Python — o que for).

### 3.1. Enums

```typescript
// Status de moderação do pet
type ModerationStatus = 'active' | 'flagged' | 'hidden' | 'blocked';
// active   = normal, sem flags
// flagged  = há reports pendentes (auto-set quando 3+ reports pending)
// hidden   = oculto temporariamente (manual, raramente usado)
// blocked  = bloqueado pelo backoffice — memorial retorna 404 público

// Categoria do report — escolhida pelo denunciante
type ReportCategory =
  | 'sexual_content'      // Conteúdo sexual / pornografia
  | 'child_safety'        // Conteúdo envolvendo menores — PRIORIDADE MÁXIMA
  | 'animal_cruelty'      // Maus tratos a animais
  | 'hate_speech'         // Discurso de ódio
  | 'violence'            // Violência gráfica
  | 'harassment'          // Assédio / bullying
  | 'spam'                // Spam / propaganda
  | 'impersonation'       // Falsidade ideológica
  | 'copyright'           // Violação de direitos autorais
  | 'other';              // Outro (com descrição livre)

// Status do report — ciclo de vida da denúncia
type ReportStatus =
  | 'pending'             // Aguardando triagem (estado inicial)
  | 'under_review'        // Em análise (operador clicou para investigar)
  | 'resolved_valid'      // Procedente — conteúdo violou regras
  | 'resolved_invalid'    // Improcedente — sem violação
  | 'duplicate';          // Já existe report similar resolvido
```

### 3.2. Tipos de resposta da API

```typescript
interface ReportListItem {
  id: string;                    // UUID
  category: ReportCategory;
  description: string;           // até 2000 chars
  memorial_url: string;          // URL completa do memorial denunciado
  status: ReportStatus;
  created_at: string;            // ISO 8601 timestamptz
  resolved_at: string | null;
  resolved_by: string | null;    // UUID do admin (opcional)
  resolution_note: string | null;

  pet: {
    id: string;
    name: string;
    memorial_slug: string;
    moderation_status: ModerationStatus;
    owner_id: string;
    owner: {
      email: string;
      full_name: string | null;
    };
  };

  reporter: {                    // null quando denúncia anônima
    id: string;
    email: string;
    full_name: string | null;
  } | null;
}

interface ReportDetail extends ReportListItem {
  reporter_email: string | null; // email do denunciante anônimo (se informou)
  reporter_ip: string | null;    // IP capturado (anti-spam)
  pet: ReportListItem['pet'] & {
    species: string;
    blocked_reason: string | null;
    blocked_at: string | null;
  };
}

interface PetDetail {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;     // ISO date
  death_date: string | null;
  avatar_url: string | null;
  memorial_slug: string;
  is_public: boolean;
  tribute_text: string | null;
  created_at: string;
  updated_at: string;

  moderation_status: ModerationStatus;
  blocked_reason: string | null;
  blocked_at: string | null;
  blocked_by: string | null;

  owner: {
    id: string;
    email: string;
    full_name: string | null;
    plan_id: 'free' | 'memorial_eterno' | 'premium_mensal' | 'premium_anual';
  };

  reports: Array<ReportListItem & {
    reporter: { email: string; full_name: string | null } | null;
  }>;

  _count: {
    tributes: number;
    chronicles: number;
    timeline_entries: number;
    reactions: number;
  };
}
```

---

## 4. Endpoints — referência completa

### 4.1. `GET /reports` — listar reports

**Query params:**

| param | tipo | default | obs |
|---|---|---|---|
| `status` | `ReportStatus` | (todos) | filtra por status |
| `limit` | int | 50 | máx 200 |
| `offset` | int | 0 | paginação |

**Response 200:**

```json
{
  "total": 12,
  "limit": 50,
  "offset": 0,
  "items": [ /* ReportListItem[] */ ]
}
```

**Ordenação:** sempre `created_at DESC`.

---

### 4.2. `GET /reports/:id` — detalhe do report

**Response 200:** `ReportDetail` (inclui IP, email do denunciante, dados extras do pet).

**404** se UUID não existir.

---

### 4.3. `POST /reports/:id/resolve` — resolver report

**Body:**

```json
{
  "status": "resolved_valid",        // resolved_valid | resolved_invalid | duplicate
  "note": "Conteúdo violando seção 4.2 dos termos",  // opcional, máx 2000 chars
  "resolved_by": "uuid-do-admin"     // opcional, UUID
}
```

**Response 200:** objeto `MemorialReport` atualizado.

**Side effect:** se for o último report `pending`/`under_review` do pet **e** o pet estava `flagged`, volta automaticamente para `active`.

**Erros:**
- `400` — status inválido ou nota maior que 2000 chars
- `404` — report não encontrado

---

### 4.4. `GET /pets/:id` — detalhe do pet

**Response 200:** `PetDetail` completo com últimos 50 reports + contadores.

Use ao abrir um report para mostrar contexto: "este pet tem 5 reports anteriores nos últimos 90 dias", "este pet recebeu 230 tributos", etc.

---

### 4.5. `POST /pets/:id/block` — bloquear memorial

**Body:**

```json
{
  "reason": "Foto explícita na timeline em 2026-05-10",   // obrigatório, 5-1000 chars
  "blocked_by": "uuid-do-admin",                          // opcional
  "notify": true                                          // default true
}
```

**Response 200:**

```json
{
  "ok": true,
  "pet": { "id": "...", "moderation_status": "blocked" }
}
```

**Efeitos:**
- `pet.moderation_status = 'blocked'`
- `pet.blocked_reason`, `pet.blocked_at`, `pet.blocked_by` populados
- Rota pública `/memorial/<slug>` passa a retornar **404**
- Pet removido do sitemap, OG image, listagem pública
- Banner vermelho persistente no `/dashboard/pets/<slug>/editar` (visível ao tutor)
- **Email automático ao tutor** com motivo + link pro dashboard (se `notify !== false`)

Passe `"notify": false` em modo teste/silencioso (raro — útil pra dev).

---

### 4.6. `POST /pets/:id/unblock` — desbloquear

**Body:** vazio `{}`.

**Response 200:**

```json
{
  "ok": true,
  "pet": { "id": "...", "moderation_status": "flagged" }
}
```

**Lógica:** volta para `flagged` se ainda existem reports `pending`/`under_review`, senão `active`. Limpa `blocked_reason`/`blocked_at`/`blocked_by`.

---

## 5. Códigos de erro padronizados

| status | significado | ação no desktop |
|---|---|---|
| `200` | OK | seguir fluxo |
| `400` | Body inválido (Zod) — mensagem em `error` | mostrar erro no form |
| `401` | Token ausente/inválido | mandar pra tela de config; limpar token salvo |
| `404` | Recurso não existe | mostrar "não encontrado" e voltar pra lista |
| `503` | `ADMIN_API_TOKEN` não configurado no servidor | mostrar "API admin desabilitada no servidor"; logar |

Formato padrão de erro:

```json
{ "error": "mensagem legível" }
```

---

## 6. Fluxo recomendado de UX

### 6.1. Tela inicial — Dashboard

```
┌────────────────────────────────────────────┐
│  Pendentes: 12   Em análise: 3   Bloq: 7   │
├────────────────────────────────────────────┤
│  [Por categoria — gráfico/barras]          │
│    child_safety:    4 ⚠️  (vermelho)        │
│    sexual_content:  3 ⚠️                    │
│    animal_cruelty:  2                       │
│    outros:          6                       │
└────────────────────────────────────────────┘
```

Polling: `GET /reports?status=pending` + `GET /reports?status=under_review` a cada 30s.

### 6.2. Tela de fila

Lista ordenada por `created_at DESC`, com:
- Badge de categoria (cor por severidade)
- Nome do pet + slug clicável
- Snippet da descrição (primeiras 80 chars)
- Tempo desde criação (`há 2 horas`)
- Botão "Abrir" → tela de análise

Filtros: status + categoria + range de data.

### 6.3. Tela de análise (detalhe)

Três painéis lado a lado:

```
┌─────────────┬──────────────┬──────────────┐
│  Report     │  Pet         │  Ações       │
│  - cat.     │  - owner     │  [Abrir mem] │
│  - desc.    │  - reports   │  [Resolver]  │
│  - denun.   │  - counters  │  [Bloquear]  │
└─────────────┴──────────────┴──────────────┘
```

- **Abrir memorial** → abre `memorial_url` no browser externo (testar visualmente)
- **Resolver** → modal com 3 botões (`valid`/`invalid`/`duplicate`) + textarea pra nota
- **Bloquear** → modal com textarea (reason) + preview do email + checkbox "notificar tutor"

### 6.4. Tela de pet bloqueado

Lista de `moderation_status: blocked` com botão "Desbloquear" — útil pra revisão semanal.

---

## 7. Considerações de segurança

- **Bearer token estático.** O token tem acesso total às operações admin. **Nunca commitar** no repo do desktop. Pedir ao operador na primeira inicialização e guardar em keyring do SO (não em arquivo plain).
- **Sem TLS local em dev** — `http://localhost:3000`. Em prod, sempre `https://eternopet.com.br`.
- **Rotacionar token** se houver suspeita de vazamento — basta trocar `ADMIN_API_TOKEN` no Coolify e atualizar no desktop.
- **Audit trail** — passe `resolved_by` e `blocked_by` (UUID do admin) sempre que possível para rastreabilidade.
- **Confirmação de bloqueio** — exigir double-confirm antes de `POST /pets/:id/block` (ação reversível mas afeta usuário real).

---

## 8. Modelo de cliente HTTP (TypeScript)

```typescript
class EternoAdminClient {
  constructor(
    private baseUrl: string,
    private token: string,
  ) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    return res.json();
  }

  listReports(params: { status?: ReportStatus; limit?: number; offset?: number } = {}) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]),
    );
    return this.request<{ total: number; items: ReportListItem[] }>(`/reports?${qs}`);
  }

  getReport(id: string) {
    return this.request<ReportDetail>(`/reports/${id}`);
  }

  resolveReport(id: string, body: { status: 'resolved_valid' | 'resolved_invalid' | 'duplicate'; note?: string; resolved_by?: string }) {
    return this.request(`/reports/${id}/resolve`, { method: 'POST', body: JSON.stringify(body) });
  }

  getPet(id: string) {
    return this.request<PetDetail>(`/pets/${id}`);
  }

  blockPet(id: string, body: { reason: string; blocked_by?: string; notify?: boolean }) {
    return this.request(`/pets/${id}/block`, { method: 'POST', body: JSON.stringify(body) });
  }

  unblockPet(id: string) {
    return this.request(`/pets/${id}/unblock`, { method: 'POST', body: JSON.stringify({}) });
  }
}
```

---

## 9. Checklist de desenvolvimento

### Sprint 1 — MVP funcional
- [ ] Tela de config (URL base + token, salvos em keyring)
- [ ] Tela de login (validar token via `GET /reports?limit=1`)
- [ ] Lista de reports `pending` com paginação
- [ ] Detalhe do report + detalhe do pet em painéis
- [ ] Botão "Resolver" com 3 status
- [ ] Botão "Bloquear" com reason + notify toggle

### Sprint 2 — UX e produtividade
- [ ] Dashboard com contadores
- [ ] Filtros (status, categoria, data)
- [ ] Polling automático 30s
- [ ] Highlight pra categorias críticas
- [ ] Preview do email antes de bloquear
- [ ] Tela de pets bloqueados + desbloqueio

### Sprint 3 — operacional
- [ ] Log local de ações (SQLite)
- [ ] Atalhos de teclado (J/K pra navegar fila, R pra resolver, B pra bloquear)
- [ ] Exportar fila em CSV pra relatório semanal
- [ ] Notificação desktop quando entra `child_safety`/`sexual_content`

---

## 10. Referências

- API admin completa: [`docs/admin-api.md`](./admin-api.md)
- Schema Prisma: [`prisma/schema.prisma`](../prisma/schema.prisma) — modelos `MemorialReport`, `Pet`, `Profile`
- Server action que cria reports: [`src/lib/actions/reports.ts`](../src/lib/actions/reports.ts)
- Template do email de bloqueio: [`src/lib/email/templates.ts`](../src/lib/email/templates.ts) → `memorialBlockedEmail`
