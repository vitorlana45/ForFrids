# Carta de Despedida do Tutor no Memorial — Design

**Data:** 2026-07-23
**Status:** Aprovado (brainstorming) — pronto para virar plano

## Objetivo

Permitir que o tutor deixe **uma carta pessoal** ao seu pet — o sentimento dele em
si — como finalização da jornada. Pode ser pública (aparece no memorial) ou privada
(só o tutor vê). Adapta o tom para pet falecido (despedida) ou vivo (declaração).

## Decisões do brainstorm

| Tema | Decisão |
|---|---|
| Autoria / quantidade | **Uma** carta por pet, escrita pelo tutor |
| Visibilidade | O tutor escolhe **pública** (no memorial) ou **privada** (só ele) |
| Quando | **Qualquer pet**; copy adapta: falecido = despedida, vivo = declaração |
| Plano | **Grátis** (recurso central, acolhedor) |
| Posição no memorial | **No fim, antes do rodapé**, com item "Carta" na nav |
| Dados | Campos na tabela `Pet` (como o `tribute_text` já é) |

## Escopo

- Campos de carta no `Pet` (migration).
- Editor da carta na edição do pet (dashboard): textarea + toggle público/privado.
- Server action para salvar e para remover a carta.
- Seção da carta no fim do memorial (só quando pública) + item na nav.

### Fora de escopo (YAGNI)

- Título customizado (o cabeçalho é adaptativo automático).
- Múltiplas cartas / histórico de versões.
- Rich text / mídia dentro da carta (texto corrido, quebras preservadas).
- Carta de visitantes (isso é o recurso de Tributos, já existente).

## Restrições globais

- Todo texto de UI em **português brasileiro**.
- Server action segue as convenções: `getServerSession()`, `assertOwnsPet`, Zod
  server-side, retorna `{ error }`/`{ data }` (nunca lança), `revalidatePath` antes
  de qualquer storage (não há storage aqui).
- Memorial é ISR (`revalidate = 60`); a action revalida `/memorial/[slug]`.
- Tokens do design system (serif para a carta, `surface`, `primary`, etc.).
- Sem novas dependências.

## Modelo de dados

Campos novos em `Pet` (migration):

```prisma
model Pet {
  // ...
  letter_content    String?                    // corpo da carta (texto corrido)
  letter_is_public  Boolean   @default(false)  // aparece no memorial?
  letter_updated_at DateTime? @db.Timestamptz()
}
```

Tipo `Pet` em `src/types/database.ts` ganha:

```ts
  letter_content: string | null;
  letter_is_public: boolean;
  letter_updated_at: string | null;
```

## Conteúdo e formato

- **Corpo:** texto corrido obrigatório, **10 a 4000 caracteres**, quebras de linha
  preservadas (`whitespace-pre-line`).
- **Cabeçalho adaptativo** (helper puro `getLetterHeading`):
  - pet falecido (`death_date` != null) → `Carta de despedida`
  - pet vivo → `Uma carta para {nome}`
- **Assinatura:** nome do tutor (do perfil, `full_name`) + data (`letter_updated_at`
  em pt-BR). Sem título customizado.

## Edição (dashboard)

Na edição do pet (`/dashboard/pets/[slug]/editar`), uma seção/aba **"Carta"**:
- `textarea` acolhedor (placeholder guiando o tutor a escrever o que sente).
- Toggle **"Tornar pública no memorial"** (`letter_is_public`).
- Botão **Salvar** (infinitivo) → "Salvando…"; e **Remover carta** quando já existe.
- Estado vazio: convite curto para escrever a carta.
- Client component (form) chamando a server action; toasts de sucesso/erro.

## Exibição (memorial)

- Componente `MemorialLetter` (presentacional): recebe `content`, `ownerName`,
  `updatedAt`, `isDeceased`.
- Renderizado no fim do `main` (antes do rodapé) **somente quando**
  `pet.letter_content && pet.letter_is_public`.
- Estilo "papel de carta": cartão sereno, tipografia serif, cabeçalho adaptativo,
  corpo com `whitespace-pre-line` e `break-words`, assinatura ao final.
- `navItems` ganha `{ id: 'carta', label: 'Carta', icon: 'mail' }` quando a carta
  pública existe (o memorial já monta a nav condicionalmente).
- Carta **privada** nunca aparece no memorial; só o tutor a vê no editor.

## Server actions (`src/lib/actions/pet-letter.ts`)

```ts
// Salva/atualiza a carta do pet (upsert nos campos do Pet).
export async function saveLetter(
  petId: string,
  input: { content: string; isPublic: boolean },
): Promise<{ error?: string; success?: boolean }>;

// Remove a carta (zera os campos).
export async function removeLetter(
  petId: string,
): Promise<{ error?: string; success?: boolean }>;
```

- Ambas: `getServerSession()` → `assertOwnsPet(userId, petId)`; Zod valida
  `content` (min 10, max 4000) e `isPublic` (boolean).
- `saveLetter` seta `letter_content`, `letter_is_public`, `letter_updated_at = now()`.
- `removeLetter` seta os três para `null`/`false`.
- Ambas `revalidatePath('/memorial/${slug}')` e `revalidatePath('/dashboard/pets/${slug}/editar')`.

## Testes

- **Unit (Vitest)** — `getLetterHeading(petName, isDeceased)`: retorna "Carta de
  despedida" para falecido e "Uma carta para {nome}" para vivo.
- **Typecheck + manual** para as actions e a UI (o projeto não tem teste de
  componente). Verificação manual: escrever carta, alternar pública/privada e conferir
  no memorial; remover.
- **e2e (Playwright), opcional:** memorial sem carta pública não renderiza a seção
  "Carta" (checagem de conteúdo, dev-safe).

## Decisões abertas (baixo risco, resolver na implementação)

- Integração exata do editor: nova **aba** no `PetEditTabs` vs. seção dedicada — o
  plano deve ler `PetEditTabs.tsx` e seguir o padrão de abas existente.
- Ícone do item de nav ("mail" nas Material Symbols) — confirmar disponibilidade.
