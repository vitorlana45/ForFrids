# Carta de Despedida do Tutor no Memorial — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar o tutor escrever uma carta pessoal ao pet (pública no memorial ou privada), com tom adaptado a pet falecido/vivo.

**Architecture:** Campos de carta na tabela `Pet` (como `tribute_text`); um helper puro para o cabeçalho adaptativo; server actions para salvar/remover; editor no `PetEditTabs`; seção de exibição no fim do memorial.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Prisma/Postgres, Tailwind; Vitest (unit).

## Global Constraints

- Todo texto de UI em **português brasileiro**.
- **Sem novas dependências.**
- Server actions: `getServerSession()`, checagem de posse inline (retorna `{ error }`,
  não lança), Zod server-side, `revalidatePath`.
- Memorial é ISR (`revalidate = 60`); as actions revalidam `/memorial/[slug]`.
- Carta é **grátis** (sem gate de plano); só o **dono** edita.
- Limites: corpo de **10 a 4000 caracteres**.
- Cabeçalho adaptativo: falecido → `Carta de despedida`; vivo → `Uma carta para {nome}`.
- Tokens do design system (serif para a carta).

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `prisma/schema.prisma` (modificar) | Campos `letter_*` em `Pet` |
| `prisma/migrations/20260723150000_add_pet_letter/migration.sql` (criar) | Migration das colunas |
| `src/types/database.ts` (modificar) | Campos de carta no tipo `Pet` |
| `src/lib/memorial/letter.ts` (criar) | `getLetterHeading` + `LETTER_MIN_CHARS`/`LETTER_MAX_CHARS` |
| `src/lib/memorial/letter.test.ts` (criar) | Teste unit do helper |
| `src/lib/actions/pet-letter.ts` (criar) | `saveLetter` / `removeLetter` |
| `src/components/pets/LetterEditor.tsx` (criar) | Editor (textarea + toggle + salvar/remover) |
| `src/components/pets/PetEditTabs.tsx` (modificar) | Aba "Carta" |
| `src/components/memorial/MemorialLetter.tsx` (criar) | Exibição da carta |
| `src/app/memorial/[slug]/page.tsx` (modificar) | Seção da carta + item de nav |

---

### Task 1: Campos de carta no `Pet`

**Files:**
- Modify: `prisma/schema.prisma` (model `Pet`, após `tribute_text`)
- Create: `prisma/migrations/20260723150000_add_pet_letter/migration.sql`
- Modify: `src/types/database.ts` (interface `Pet`)

**Interfaces:**
- Produces: `Pet.letter_content: string | null`, `Pet.letter_is_public: boolean`, `Pet.letter_updated_at: string | null`.

- [ ] **Step 1: Adicionar os campos ao schema**

Em `prisma/schema.prisma`, no model `Pet`, trocar:

```prisma
  tribute_text  String?
  created_at    DateTime  @default(now()) @db.Timestamptz()
```

por:

```prisma
  tribute_text  String?
  // Carta pessoal do tutor ao pet (finalizacao da jornada). Publica/privada.
  letter_content    String?
  letter_is_public  Boolean   @default(false)
  letter_updated_at DateTime? @db.Timestamptz()
  created_at    DateTime  @default(now()) @db.Timestamptz()
```

- [ ] **Step 2: Criar a migration**

Criar `prisma/migrations/20260723150000_add_pet_letter/migration.sql`:

```sql
-- AlterTable
ALTER TABLE "pets" ADD COLUMN     "letter_content" TEXT,
ADD COLUMN     "letter_is_public" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "letter_updated_at" TIMESTAMPTZ;
```

- [ ] **Step 3: Adicionar os campos ao tipo `Pet`**

Em `src/types/database.ts`, na interface `Pet`, trocar:

```ts
  tribute_text: string | null;
  created_at: string;
  updated_at: string;
}
```

por:

```ts
  tribute_text: string | null;
  letter_content: string | null;
  letter_is_public: boolean;
  letter_updated_at: string | null;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 4: Aplicar a migration e regenerar o client**

Run: `npx prisma migrate deploy && npx prisma generate`
Expected: "All migrations have been successfully applied." e client gerado.
Nota (Windows): se `prisma generate` falhar com `EPERM` (o `next dev` segura o engine),
pare o dev server, rode `npx prisma generate` e reinicie o dev.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260723150000_add_pet_letter src/types/database.ts
git commit -m "feat: campos de carta (letter_*) no Pet"
```

---

### Task 2: Helper do cabeçalho + limites (TDD)

**Files:**
- Create: `src/lib/memorial/letter.ts`
- Test: `src/lib/memorial/letter.test.ts`

**Interfaces:**
- Produces: `LETTER_MIN_CHARS = 10`, `LETTER_MAX_CHARS = 4000`, `getLetterHeading(petName: string, isDeceased: boolean): string`.

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/lib/memorial/letter.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getLetterHeading, LETTER_MIN_CHARS, LETTER_MAX_CHARS } from './letter';

describe('getLetterHeading', () => {
  it('pet falecido retorna "Carta de despedida"', () => {
    expect(getLetterHeading('Max', true)).toBe('Carta de despedida');
  });

  it('pet vivo retorna "Uma carta para {nome}"', () => {
    expect(getLetterHeading('Max', false)).toBe('Uma carta para Max');
  });

  it('expoe os limites de caracteres', () => {
    expect(LETTER_MIN_CHARS).toBe(10);
    expect(LETTER_MAX_CHARS).toBe(4000);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/memorial/letter.test.ts`
Expected: FAIL — módulo `./letter` inexistente.

- [ ] **Step 3: Implementar o helper**

Criar `src/lib/memorial/letter.ts`:

```ts
export const LETTER_MIN_CHARS = 10;
export const LETTER_MAX_CHARS = 4000;

/** Cabecalho adaptativo da carta: despedida (falecido) ou declaracao (vivo). */
export function getLetterHeading(petName: string, isDeceased: boolean): string {
  return isDeceased ? 'Carta de despedida' : `Uma carta para ${petName}`;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/memorial/letter.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/memorial/letter.ts src/lib/memorial/letter.test.ts
git commit -m "feat: helper getLetterHeading + limites da carta"
```

---

### Task 3: Server actions `saveLetter` / `removeLetter`

**Files:**
- Create: `src/lib/actions/pet-letter.ts`

**Interfaces:**
- Consumes: `LETTER_MIN_CHARS`, `LETTER_MAX_CHARS` (`@/lib/memorial/letter`); `getServerSession`; `prisma`.
- Produces:
  - `saveLetter(petId: string, input: { content: string; isPublic: boolean }): Promise<{ error?: string; success?: boolean }>`
  - `removeLetter(petId: string): Promise<{ error?: string; success?: boolean }>`

- [ ] **Step 1: Implementar as actions**

Criar `src/lib/actions/pet-letter.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { LETTER_MIN_CHARS, LETTER_MAX_CHARS } from '@/lib/memorial/letter';

const letterSchema = z.object({
  content: z
    .string()
    .trim()
    .min(LETTER_MIN_CHARS, 'Escreva um pouco mais.')
    .max(LETTER_MAX_CHARS, `Máximo de ${LETTER_MAX_CHARS} caracteres.`),
  isPublic: z.boolean(),
});

// Retorna o pet (com slug) se o usuario logado for o dono; senao null.
async function ownedPet(petId: string, userId: string) {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: { owner_id: true, memorial_slug: true },
  });
  if (!pet || pet.owner_id !== userId) return null;
  return pet;
}

export async function saveLetter(
  petId: string,
  input: { content: string; isPublic: boolean },
): Promise<{ error?: string; success?: boolean }> {
  const session = await getServerSession();
  if (!session) return { error: 'Não autenticado' };
  const pet = await ownedPet(petId, session.user.id);
  if (!pet) return { error: 'Não autorizado' };

  const parsed = letterSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.pet.update({
    where: { id: petId },
    data: {
      letter_content: parsed.data.content,
      letter_is_public: parsed.data.isPublic,
      letter_updated_at: new Date(),
    },
  });

  revalidatePath(`/dashboard/pets/${pet.memorial_slug}/editar`);
  revalidatePath(`/memorial/${pet.memorial_slug}`);
  return { success: true };
}

export async function removeLetter(
  petId: string,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getServerSession();
  if (!session) return { error: 'Não autenticado' };
  const pet = await ownedPet(petId, session.user.id);
  if (!pet) return { error: 'Não autorizado' };

  await prisma.pet.update({
    where: { id: petId },
    data: { letter_content: null, letter_is_public: false, letter_updated_at: null },
  });

  revalidatePath(`/dashboard/pets/${pet.memorial_slug}/editar`);
  revalidatePath(`/memorial/${pet.memorial_slug}`);
  return { success: true };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros (requer o client regenerado da Task 1).

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/pet-letter.ts
git commit -m "feat: actions saveLetter e removeLetter"
```

---

### Task 4: Editor da carta + aba no PetEditTabs

**Files:**
- Create: `src/components/pets/LetterEditor.tsx`
- Modify: `src/components/pets/PetEditTabs.tsx`

**Interfaces:**
- Consumes: `saveLetter`, `removeLetter` (`@/lib/actions/pet-letter`); `getLetterHeading`, `LETTER_MIN_CHARS`, `LETTER_MAX_CHARS` (`@/lib/memorial/letter`); `useToast`, `useConfirm`.
- Produces: `default` `LetterEditor` com prop `{ pet: Pick<Pet, 'id' | 'name' | 'death_date' | 'letter_content' | 'letter_is_public'> }`.

> Sem infra de teste de componente: gate = `npx tsc --noEmit` + `npm run lint`.

- [ ] **Step 1: Criar o LetterEditor**

Criar `src/components/pets/LetterEditor.tsx`:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { Loader2, Mail, Trash2 } from 'lucide-react';
import { removeLetter, saveLetter } from '@/lib/actions/pet-letter';
import { getLetterHeading, LETTER_MAX_CHARS, LETTER_MIN_CHARS } from '@/lib/memorial/letter';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/ConfirmModal';
import type { Pet } from '@/types/database';

interface Props {
  pet: Pick<Pet, 'id' | 'name' | 'death_date' | 'letter_content' | 'letter_is_public'>;
}

export default function LetterEditor({ pet }: Props) {
  const toast = useToast();
  const confirm = useConfirm();
  const [content, setContent] = useState(pet.letter_content ?? '');
  const [isPublic, setIsPublic] = useState(pet.letter_is_public);
  const [hasLetter, setHasLetter] = useState(Boolean(pet.letter_content));
  const [isSaving, startSaving] = useTransition();
  const [isRemoving, startRemoving] = useTransition();

  const isDeceased = Boolean(pet.death_date);
  const heading = getLetterHeading(pet.name, isDeceased);
  const trimmedLength = content.trim().length;
  const canSave = trimmedLength >= LETTER_MIN_CHARS && trimmedLength <= LETTER_MAX_CHARS;

  function save() {
    startSaving(async () => {
      const result = await saveLetter(pet.id, { content: content.trim(), isPublic });
      if (result.error) {
        toast.error('Não foi possível salvar a carta. Tente novamente.');
        return;
      }
      setHasLetter(true);
      toast.success('Carta salva.');
    });
  }

  async function remove() {
    const confirmed = await confirm({
      title: 'Remover carta',
      message: 'A carta será apagada. Você pode escrever outra depois.',
      confirmLabel: 'Remover',
      variant: 'danger',
    });
    if (!confirmed) return;
    startRemoving(async () => {
      const result = await removeLetter(pet.id);
      if (result.error) {
        toast.error('Não foi possível remover a carta. Tente novamente.');
        return;
      }
      setContent('');
      setIsPublic(false);
      setHasLetter(false);
      toast.success('Carta removida.');
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed/40 text-primary">
          <Mail className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-serif text-2xl text-on-surface">{heading}</h2>
          <p className="text-sm text-on-surface-variant">
            {isDeceased
              ? 'Escreva o que sente — uma última carta para o seu companheiro.'
              : 'Escreva o que sente pelo seu companheiro.'}
          </p>
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={12}
        maxLength={LETTER_MAX_CHARS}
        placeholder="Querido(a)..."
        className="w-full resize-y rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 font-serif text-base leading-7 text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <div className="mt-1 flex justify-between text-xs text-on-surface-variant">
        <span>{trimmedLength < LETTER_MIN_CHARS ? `Mínimo de ${LETTER_MIN_CHARS} caracteres` : ''}</span>
        <span>{content.length}/{LETTER_MAX_CHARS}</span>
      </div>

      <label className="mt-4 flex items-start gap-3 text-sm text-on-surface">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-outline-variant text-primary focus:ring-2 focus:ring-primary-fixed"
        />
        <span>
          Tornar pública no memorial
          <span className="block text-xs text-on-surface-variant">
            Se desmarcada, a carta fica só para você, aqui no painel.
          </span>
        </span>
      </label>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!canSave || isSaving}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim disabled:opacity-50"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSaving ? 'Salvando...' : 'Salvar carta'}
        </button>
        {hasLetter && (
          <button
            type="button"
            onClick={remove}
            disabled={isRemoving}
            className="inline-flex items-center gap-2 rounded-full border border-error/30 px-6 py-3 text-sm font-semibold text-error transition-colors hover:bg-error/10 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Remover
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Adicionar a aba "Carta" no PetEditTabs**

Em `src/components/pets/PetEditTabs.tsx`:

(a) trocar o import de icones:

```tsx
import { BarChart2, BookOpen, Clock3, ExternalLink, Heart, PawPrint, QrCode } from 'lucide-react';
```

por:

```tsx
import { BarChart2, BookOpen, Clock3, ExternalLink, Heart, Mail, PawPrint, QrCode } from 'lucide-react';
```

(b) adicionar o import do editor logo após `import TributeModeration from '@/components/tributes/TributeModeration';`:

```tsx
import LetterEditor from './LetterEditor';
```

(c) incluir `'carta'` no tipo `Tab`:

```tsx
type Tab = 'dados' | 'timeline' | 'diario' | 'homenagens' | 'engajamento' | 'carta';
```

(d) adicionar a aba ao array `TABS` (após a linha de `dados`):

```tsx
  { id: 'dados',        label: 'Dados',          Icon: PawPrint  },
  { id: 'carta',       label: 'Carta',          Icon: Mail      },
```

- [ ] **Step 3: Renderizar o conteúdo da aba**

Ainda em `PetEditTabs.tsx`, logo após o fechamento do bloco `{active === 'dados' && ( ... )}`
(a linha `      )}` que fecha esse bloco), inserir:

```tsx
      {/* ── Carta ── */}
      {active === 'carta' && (
        <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-6 md:p-8">
          <LetterEditor pet={pet} />
        </div>
      )}
```

- [ ] **Step 4: Typecheck e lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros de tipo; lint sem novos erros.

- [ ] **Step 5: Commit**

```bash
git add src/components/pets/LetterEditor.tsx src/components/pets/PetEditTabs.tsx
git commit -m "feat: editor da carta na aba 'Carta' do pet"
```

---

### Task 5: Exibição da carta no memorial

**Files:**
- Create: `src/components/memorial/MemorialLetter.tsx`
- Modify: `src/app/memorial/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getLetterHeading` (`@/lib/memorial/letter`); campos `letter_*` de `Pet`.
- Produces: `default` `MemorialLetter` com props `{ content: string; petName: string; ownerName: string | null; updatedAt: string | null; isDeceased: boolean }`.

- [ ] **Step 1: Criar o MemorialLetter**

Criar `src/components/memorial/MemorialLetter.tsx`:

```tsx
import { getLetterHeading } from '@/lib/memorial/letter';

interface Props {
  content: string;
  petName: string;
  ownerName: string | null;
  updatedAt: string | null;
  isDeceased: boolean;
}

export default function MemorialLetter({ content, petName, ownerName, updatedAt, isDeceased }: Props) {
  const heading = getLetterHeading(petName, isDeceased);
  const dateLabel = updatedAt
    ? new Date(updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="relative overflow-hidden rounded-[2rem] border border-secondary/15 bg-surface-container-lowest p-10 shadow-memorial md:p-14">
        <span className="material-symbols-outlined pointer-events-none absolute -right-6 -top-6 select-none text-[140px] text-primary/5">
          mail
        </span>
        <p className="relative mb-6 text-center font-serif text-3xl italic text-primary">{heading}</p>
        <p
          className="relative whitespace-pre-line break-words font-serif text-lg leading-8 text-on-surface-variant"
          style={{ overflowWrap: 'anywhere' }}
        >
          {content}
        </p>
        {(ownerName || dateLabel) && (
          <div className="relative mt-8 text-right">
            {ownerName && <p className="font-serif text-xl italic text-on-surface">{ownerName}</p>}
            {dateLabel && (
              <p className="mt-1 text-xs uppercase tracking-widest text-on-surface-variant/70">{dateLabel}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Importar o componente no memorial**

Em `src/app/memorial/[slug]/page.tsx`, após a linha
`import TutorSection from '@/components/memorial/TutorSection';`, adicionar:

```tsx
import MemorialLetter from '@/components/memorial/MemorialLetter';
```

- [ ] **Step 3: Calcular se há carta pública**

Logo após a linha `const canShowPresentation =` (o bloco que já existe termina em `>= MIN_PRESENTATION_PHOTOS;`), adicionar:

```tsx
  const hasPublicLetter = Boolean(pet.letter_content && pet.letter_is_public);
```

- [ ] **Step 4: Adicionar o item de nav**

No array `navItems`, trocar:

```tsx
    { id: 'tributos', label: 'Tributos', icon: 'favorite' },
  ];
```

por:

```tsx
    { id: 'tributos', label: 'Tributos', icon: 'favorite' },
    ...(hasPublicLetter ? [{ id: 'carta', label: 'Carta', icon: 'mail' }] : []),
  ];
```

- [ ] **Step 5: Renderizar a seção no fim do memorial**

Localizar o fim da seção de Tributos:

```tsx
        {/* Tributes */}
        <TributesSection
          petId={pet.id}
          petName={pet.name}
          memorialSlug={slug}
          initialTributes={tributes}
        />
      </main>
```

e trocar por:

```tsx
        {/* Tributes */}
        <TributesSection
          petId={pet.id}
          petName={pet.name}
          memorialSlug={slug}
          initialTributes={tributes}
        />

        {/* Carta do tutor */}
        {hasPublicLetter && (
          <section className="border-t border-primary/10 py-24" id="carta">
            <MemorialLetter
              content={pet.letter_content!}
              petName={pet.name}
              ownerName={ownerProfile?.full_name ?? null}
              updatedAt={pet.letter_updated_at}
              isDeceased={Boolean(pet.death_date)}
            />
          </section>
        )}
      </main>
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 7: Verificação manual**

Com `npm run dev`, numa conta dona de um pet:
1. Edição do pet → aba **Carta** → escrever ≥ 10 caracteres → **Salvar carta** (toast "Carta salva").
2. Marcar **Tornar pública** e salvar → abrir `/memorial/<slug>`: a seção "Carta" aparece no fim, com item na nav; cabeçalho "Carta de despedida" (pet com data de falecimento) ou "Uma carta para {nome}" (vivo).
3. Desmarcar pública e salvar → a seção some do memorial.
4. **Remover** → some do editor e do memorial.

- [ ] **Step 8: Commit**

```bash
git add src/components/memorial/MemorialLetter.tsx "src/app/memorial/[slug]/page.tsx"
git commit -m "feat: secao da carta do tutor no fim do memorial + item de nav"
```

---

## Self-review (feito)

- **Cobertura do spec:** modelo `Pet.letter_*` → Task 1; helper adaptativo + limites → Task 2; actions salvar/remover com posse+Zod+revalidate → Task 3; editor + toggle público/privado na edição do pet → Task 4; exibição no fim do memorial + nav + copy adaptativa → Task 5. Grátis (sem gate) e só-dono → Task 3/4.
- **Placeholders:** nenhum — todo passo tem código/comando completo.
- **Consistência de tipos:** `getLetterHeading`/`LETTER_MIN_CHARS`/`LETTER_MAX_CHARS` idênticos entre Task 2 (definição) e Tasks 3/4/5 (uso); `saveLetter`/`removeLetter` idênticos entre Task 3 e Task 4; props do `MemorialLetter` idênticas entre Task 5 (definição) e o uso no memorial; campos `letter_content`/`letter_is_public`/`letter_updated_at` idênticos entre schema (Task 1), tipo (Task 1) e usos.
