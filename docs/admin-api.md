# API Admin — Moderação

API REST autenticada por token, pensada para consumo pela aplicação desktop de backoffice. Não há UI admin dentro do app Next.

## Autenticação

Todas as rotas exigem header:

```
Authorization: Bearer <ADMIN_API_TOKEN>
```

O token vem da env `ADMIN_API_TOKEN` (definir no Coolify e no `.env.local` para testar localmente). Se a env não estiver setada, todos os endpoints retornam `503 Admin API disabled`.

Comparação é feita com `timingSafeEqual` — sem vazamento de timing.

## Base URL

- Dev: `http://localhost:3000/api/admin`
- Prod: `https://eternopet.com.br/api/admin`

## Endpoints

### `GET /reports`

Lista denúncias. Suporta query params:

| param   | tipo   | default | descrição                                     |
| ------- | ------ | ------- | --------------------------------------------- |
| status  | string | (todos) | `pending`, `under_review`, `resolved_valid`, `resolved_invalid`, `duplicate` |
| limit   | int    | 50      | máximo 200                                    |
| offset  | int    | 0       |                                               |

**Response:**

```json
{
  "total": 12,
  "limit": 50,
  "offset": 0,
  "items": [
    {
      "id": "...",
      "category": "sexual_content",
      "description": "...",
      "memorial_url": "https://eternopet.com.br/memorial/fridis",
      "status": "pending",
      "created_at": "2026-05-12T...",
      "pet": {
        "id": "...",
        "name": "Fridis",
        "memorial_slug": "fridis",
        "moderation_status": "flagged",
        "owner_id": "...",
        "owner": { "email": "tutor@example.com", "full_name": "..." }
      },
      "reporter": { "id": "...", "email": "...", "full_name": "..." }
    }
  ]
}
```

### `GET /reports/:id`

Detalhe de um report — inclui pet, owner, reporter.

### `POST /reports/:id/resolve`

Marca um report como resolvido.

```json
{
  "status": "resolved_valid" | "resolved_invalid" | "duplicate",
  "note": "Conteúdo violando seção 4.2",
  "resolved_by": "<uuid do admin, opcional>"
}
```

Se foi o último report pendente do pet e ele estava `flagged`, volta para `active` automaticamente.

### `GET /pets/:id`

Detalhes completos do pet para análise — owner, reports recentes, contadores (tributos, crônicas, timeline, reações).

### `POST /pets/:id/block`

Bloqueia o memorial e envia email automático ao tutor.

```json
{
  "reason": "Conteúdo sexual explícito em foto da timeline",
  "blocked_by": "<uuid do admin, opcional>",
  "notify": true
}
```

Efeitos:
- `pet.moderation_status = 'blocked'`
- `/memorial/<slug>` passa a retornar 404
- OG image, sitemap e crônicas públicas escondem o pet
- Email "Memorial bloqueado" enviado ao owner com motivo + link pro dashboard
- Banner vermelho persistente no `/dashboard/pets/<slug>/editar`

Passe `notify: false` para bloquear sem disparar email (raro — útil em testes).

### `POST /pets/:id/unblock`

Desbloqueia o memorial. Volta para `flagged` se ainda houver reports pendentes, ou `active` caso contrário.

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

## Workflow recomendado no desktop

1. `GET /reports?status=pending` a cada N segundos para popular a queue
2. Operador abre o report → `GET /reports/:id` + `GET /pets/:pet_id`
3. Botão "Abrir memorial" → usa `memorial_url` do report para inspecionar
4. Decisão:
   - **Improcedente:** `POST /reports/:id/resolve` com `status: resolved_invalid`
   - **Procedente:** `POST /pets/:pet_id/block` com motivo → email automático → também marca o report como resolvido via `POST /reports/:id/resolve` com `status: resolved_valid`

## Códigos de erro

| status | significado                                         |
| ------ | --------------------------------------------------- |
| 401    | Token ausente ou inválido                           |
| 404    | Report ou pet não encontrado                        |
| 400    | Body inválido (validação Zod retornou erro)         |
| 503    | `ADMIN_API_TOKEN` não configurado no servidor       |

## Sugestões de UX para o desktop

- Mostrar contador de reports por categoria na sidebar (`GET /reports` agrupando no client)
- Auto-refresh com WebSocket seria ideal, mas polling a cada 30s funciona
- Highlight em vermelho para `category: sexual_content` ou `child_safety` (prioridade máxima)
- Ao bloquear, mostrar preview do email que vai ser enviado para o tutor
