# Apresentação de Slides Premium do Memorial — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Uma apresentação de slides cinematográfica (capa → fotos da timeline → encerramento) que roda numa rota dedicada do memorial, gated por Premium.

**Architecture:** Rota server (`/memorial/[slug]/apresentacao`) busca pet + momentos, um helper puro monta o array de slides, e um player client fullscreen (React + CSS, sem libs) renderiza com autoplay, crossfade e Ken Burns.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind, `next/image`; Vitest (unit) e Playwright (e2e).

## Global Constraints

- Todo texto de UI em **português brasileiro**.
- **Sem novas dependências** (só Tailwind + React + `next/image`).
- Imagens via `next/image` com `unoptimized` (consistente com o memorial/R2).
- Rota da apresentação: `export const revalidate = 60` (ISR, como o memorial).
- Respeitar `prefers-reduced-motion` (desliga Ken Burns).
- Usar tokens do design system (`surface`, `primary`, `font-serif`, `shadow-premium`, etc.).
- Gating pelo plano do **dono** via `canUse(ownerPlanId, 'presentation')`; limiar `MIN_PRESENTATION_PHOTOS = 3`.
- Server actions/rotas retornam PT-BR; logs via `@/lib/logger` (não há log novo neste plano).
- Testes unit em `src/**/*.test.ts` (Vitest, ambiente node); e2e em `e2e/*.spec.ts`.

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/plans.ts` (modificar) | Adiciona a feature flag `presentation` |
| `src/lib/memorial/presentation.ts` (criar) | Tipos + `buildPresentationSlides` + `countPresentationPhotos` + `MIN_PRESENTATION_PHOTOS` |
| `src/lib/memorial/presentation.test.ts` (criar) | Testes unit do helper |
| `src/app/globals.css` (modificar) | Keyframes `ep-kenburns` e `ep-progress` |
| `src/components/memorial/PresentationPlayer.tsx` (criar) | Player client fullscreen |
| `src/app/memorial/[slug]/apresentacao/page.tsx` (criar) | Rota server: fetch, gating, monta slides, renderiza player |
| `e2e/presentation.spec.ts` (criar) | Smoke e2e da rota |
| `src/app/memorial/[slug]/page.tsx` (modificar) | CTA "Assistir apresentação" no hero |
| `src/app/(dashboard)/dashboard/page.tsx` (modificar) | Card de upsell para donos grátis |

---

### Task 1: Feature flag `presentation` no plano

**Files:**
- Modify: `src/lib/plans.ts:4-16,24-26`

**Interfaces:**
- Produces: `type Feature` inclui `'presentation'`; `canUse(planId: PlanId, 'presentation'): boolean` (premium=true, free=false).

- [ ] **Step 1: Adicionar a flag ao tipo e aos limites**

Em `src/lib/plans.ts`, trocar o tipo `Feature` e o objeto `LIMITS` por:

```ts
export type Feature = 'capsules' | 'chronicles' | 'qrcode' | 'presentation';

const LIMITS: Record<PlanId, {
  maxPets: number;
  maxTimelineEntries: number;
  maxChroniclesPerPet: number;
  capsules: boolean;
  chronicles: boolean;
  qrcode: boolean;
  presentation: boolean;
}> = {
  free:     { maxPets: 1,        maxTimelineEntries: 5,        maxChroniclesPerPet: 0,        capsules: false, chronicles: false, qrcode: false, presentation: false },
  premium:  { maxPets: 5,        maxTimelineEntries: 50,        maxChroniclesPerPet: 20,       capsules: true,  chronicles: true,  qrcode: true,  presentation: true  },
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros (o `Record<PlanId, {...}>` obriga as duas linhas a terem `presentation`).

- [ ] **Step 3: Commit**

```bash
git add src/lib/plans.ts
git commit -m "feat: feature flag 'presentation' (premium) no plano"
```

---

### Task 2: Helper puro dos slides (TDD)

**Files:**
- Create: `src/lib/memorial/presentation.ts`
- Test: `src/lib/memorial/presentation.test.ts`

**Interfaces:**
- Consumes: `Pet`, `TimelineEntry` de `@/types/database`.
- Produces:
  - `MIN_PRESENTATION_PHOTOS = 3`
  - `type PresentationSlide = CoverSlide | PhotoSlide | ClosingSlide`
  - `CoverSlide { kind:'cover'; petName:string; avatarUrl:string|null; birthYear:number|null; deathYear:number|null; tribute:string|null }`
  - `PhotoSlide { kind:'photo'; photoUrl:string; momentTitle:string; momentDate:string|null; description:string|null }`
  - `ClosingSlide { kind:'closing'; petName:string; birthYear:number|null; deathYear:number|null; isAlive:boolean }`
  - `countPresentationPhotos(entries: Pick<TimelineEntry,'photo_urls'>[]): number`
  - `buildPresentationSlides(pet: Pet, entries: TimelineEntry[]): PresentationSlide[]`

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/lib/memorial/presentation.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  buildPresentationSlides,
  countPresentationPhotos,
  MIN_PRESENTATION_PHOTOS,
} from './presentation';
import type { Pet, TimelineEntry } from '@/types/database';

function makePet(over: Partial<Pet> = {}): Pet {
  return {
    id: 'p1',
    owner_id: 'o1',
    name: 'Max',
    species: 'cachorro',
    breed: null,
    birth_date: '2012-03-01',
    death_date: '2024-06-01',
    avatar_url: 'https://cdn/avatar.jpg',
    memorial_slug: 'max',
    is_public: true,
    tribute_text: 'Amado para sempre',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...over,
  };
}

function makeEntry(over: Partial<TimelineEntry> = {}): TimelineEntry {
  return {
    id: 'e1',
    pet_id: 'p1',
    title: 'Primeiro dia',
    description: 'A chegada em casa',
    date: '2012-04-01',
    photo_urls: ['https://cdn/1.jpg'],
    created_at: '2024-01-01',
    ...over,
  };
}

describe('countPresentationPhotos', () => {
  it('soma as fotos nao vazias de todos os momentos', () => {
    const entries = [
      makeEntry({ photo_urls: ['a', 'b'] }),
      makeEntry({ id: 'e2', photo_urls: ['c'] }),
    ];
    expect(countPresentationPhotos(entries)).toBe(3);
  });

  it('ignora strings vazias em photo_urls', () => {
    const entries = [makeEntry({ photo_urls: ['a', '', 'b'] })];
    expect(countPresentationPhotos(entries)).toBe(2);
  });

  it('MIN_PRESENTATION_PHOTOS e 3', () => {
    expect(MIN_PRESENTATION_PHOTOS).toBe(3);
  });
});

describe('buildPresentationSlides', () => {
  it('comeca com a capa e termina com o encerramento', () => {
    const slides = buildPresentationSlides(makePet(), [makeEntry()]);
    expect(slides[0].kind).toBe('cover');
    expect(slides[slides.length - 1].kind).toBe('closing');
  });

  it('gera um slide por foto, na ordem dos momentos', () => {
    const entries = [
      makeEntry({ id: 'e1', title: 'A', date: '2012-04-01', photo_urls: ['a1', 'a2'] }),
      makeEntry({ id: 'e2', title: 'B', date: '2013-04-01', photo_urls: ['b1'] }),
    ];
    const photos = buildPresentationSlides(makePet(), entries).filter(s => s.kind === 'photo');
    expect(photos.map(s => (s as { photoUrl: string }).photoUrl)).toEqual(['a1', 'a2', 'b1']);
  });

  it('descricao aparece so no primeiro slide de cada momento', () => {
    const entries = [makeEntry({ description: 'oi', photo_urls: ['a1', 'a2', 'a3'] })];
    const photos = buildPresentationSlides(makePet(), entries)
      .filter(s => s.kind === 'photo') as Array<{ description: string | null }>;
    expect(photos[0].description).toBe('oi');
    expect(photos[1].description).toBeNull();
    expect(photos[2].description).toBeNull();
  });

  it('capa carrega nome, anos, avatar e tributo', () => {
    const [cover] = buildPresentationSlides(makePet(), [makeEntry()]);
    expect(cover).toMatchObject({
      kind: 'cover',
      petName: 'Max',
      avatarUrl: 'https://cdn/avatar.jpg',
      birthYear: 2012,
      deathYear: 2024,
      tribute: 'Amado para sempre',
    });
  });

  it('pet vivo: isAlive true e deathYear null no encerramento', () => {
    const slides = buildPresentationSlides(makePet({ death_date: null }), [makeEntry()]);
    const closing = slides[slides.length - 1];
    expect(closing).toMatchObject({ kind: 'closing', isAlive: true, deathYear: null });
  });

  it('lida com campos ausentes (sem tributo, sem datas, sem avatar)', () => {
    const [cover] = buildPresentationSlides(
      makePet({ tribute_text: null, birth_date: null, death_date: null, avatar_url: null }),
      [makeEntry()],
    );
    expect(cover).toMatchObject({ birthYear: null, deathYear: null, tribute: null, avatarUrl: null });
  });

  it('timeline sem fotos retorna apenas capa e encerramento', () => {
    const slides = buildPresentationSlides(makePet(), []);
    expect(slides.map(s => s.kind)).toEqual(['cover', 'closing']);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/memorial/presentation.test.ts`
Expected: FAIL — "Failed to resolve import './presentation'" / módulo inexistente.

- [ ] **Step 3: Implementar o helper**

Criar `src/lib/memorial/presentation.ts`:

```ts
import type { Pet, TimelineEntry } from '@/types/database';

export const MIN_PRESENTATION_PHOTOS = 3;

export interface CoverSlide {
  kind: 'cover';
  petName: string;
  avatarUrl: string | null;
  birthYear: number | null;
  deathYear: number | null;
  tribute: string | null;
}
export interface PhotoSlide {
  kind: 'photo';
  photoUrl: string;
  momentTitle: string;
  momentDate: string | null; // ISO cru; o client formata para exibir
  description: string | null; // so no 1o slide do momento
}
export interface ClosingSlide {
  kind: 'closing';
  petName: string;
  birthYear: number | null;
  deathYear: number | null;
  isAlive: boolean;
}
export type PresentationSlide = CoverSlide | PhotoSlide | ClosingSlide;

function yearOf(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.getFullYear();
}

/** Conta as fotos elegiveis (todos os photo_urls nao vazios dos momentos). */
export function countPresentationPhotos(entries: Pick<TimelineEntry, 'photo_urls'>[]): number {
  return entries.reduce((total, e) => total + (e.photo_urls ?? []).filter(Boolean).length, 0);
}

/**
 * Monta [capa, ...fotos, encerramento]. Assume `entries` ja ordenados (a rota
 * usa orderBy date asc). Dentro do momento, segue a ordem de photo_urls; a
 * descricao aparece so no primeiro slide de cada momento.
 */
export function buildPresentationSlides(pet: Pet, entries: TimelineEntry[]): PresentationSlide[] {
  const birthYear = yearOf(pet.birth_date);
  const deathYear = yearOf(pet.death_date);

  const cover: CoverSlide = {
    kind: 'cover',
    petName: pet.name,
    avatarUrl: pet.avatar_url,
    birthYear,
    deathYear,
    tribute: pet.tribute_text,
  };

  const photos: PhotoSlide[] = [];
  for (const entry of entries) {
    const urls = (entry.photo_urls ?? []).filter(Boolean);
    urls.forEach((photoUrl, i) => {
      photos.push({
        kind: 'photo',
        photoUrl,
        momentTitle: entry.title,
        momentDate: entry.date,
        description: i === 0 ? entry.description : null,
      });
    });
  }

  const closing: ClosingSlide = {
    kind: 'closing',
    petName: pet.name,
    birthYear,
    deathYear,
    isAlive: !pet.death_date,
  };

  return [cover, ...photos, closing];
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/memorial/presentation.test.ts`
Expected: PASS (todos os testes verdes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/memorial/presentation.ts src/lib/memorial/presentation.test.ts
git commit -m "feat: helper buildPresentationSlides + testes"
```

---

### Task 3: Player client fullscreen + CSS

**Files:**
- Modify: `src/app/globals.css` (append no final)
- Create: `src/components/memorial/PresentationPlayer.tsx`

**Interfaces:**
- Consumes: `PresentationSlide` de `@/lib/memorial/presentation`; `useToast` de `@/components/ui/toast`.
- Produces: `default` React component `PresentationPlayer` com props `{ slides: PresentationSlide[]; memorialSlug: string; petName: string; memorialUrl: string }`.

> Sem infra de teste de componente no projeto (Vitest roda em node). O gate desta task é `npx tsc --noEmit` + `npm run lint` + verificação manual.

- [ ] **Step 1: Adicionar keyframes ao globals.css**

Anexar ao final de `src/app/globals.css`:

```css
/* Apresentacao do memorial */
@keyframes ep-kenburns {
  from { transform: scale(1) translate3d(0, 0, 0); }
  to   { transform: scale(1.08) translate3d(0, -1.5%, 0); }
}
.ep-kenburns { animation: ep-kenburns 12s ease-out both; }

@keyframes ep-progress {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
.ep-progress {
  animation-name: ep-progress;
  animation-timing-function: linear;
  animation-fill-mode: both;
}

@media (prefers-reduced-motion: reduce) {
  .ep-kenburns { animation: none; }
}
```

- [ ] **Step 2: Criar o componente do player**

Criar `src/components/memorial/PresentationPlayer.tsx`:

```tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play, Share2, X } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import type { PresentationSlide } from '@/lib/memorial/presentation';

const SLIDE_MS = 5000;
const COVER_MS = 4000;
const CONTROLS_HIDE_MS = 3000;

interface Props {
  slides: PresentationSlide[];
  memorialSlug: string;
  petName: string;
  memorialUrl: string;
}

function formatMonthYear(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

function formatYears(birthYear: number | null, deathYear: number | null): string {
  if (birthYear && deathYear) return `${birthYear} – ${deathYear}`;
  if (birthYear) return `${birthYear}`;
  if (deathYear) return `${deathYear}`;
  return '';
}

export default function PresentationPlayer({ slides, memorialSlug, petName, memorialUrl }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swiped = useRef(false);
  const touchStartX = useRef<number | null>(null);

  const lastIndex = slides.length - 1;
  const current = slides[index];

  const close = useCallback(() => {
    router.push(`/memorial/${memorialSlug}`);
  }, [router, memorialSlug]);

  const goNext = useCallback(() => {
    setIndex((i) => {
      if (i >= lastIndex) {
        setPlaying(false);
        return i;
      }
      return i + 1;
    });
  }, [lastIndex]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  // Autoplay: para no encerramento (ultimo slide).
  useEffect(() => {
    if (!playing || index >= lastIndex) return;
    const duration = current.kind === 'cover' ? COVER_MS : SLIDE_MS;
    const t = setTimeout(goNext, duration);
    return () => clearTimeout(t);
  }, [playing, index, lastIndex, current, goNext]);

  // Teclado
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p); }
      else if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, close]);

  // Trava o scroll do body enquanto a apresentacao esta aberta
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Auto-hide dos controles apos inatividade
  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), CONTROLS_HIDE_MS);
  }, []);

  useEffect(() => {
    revealControls();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [revealControls]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      swiped.current = true;
      if (dx < 0) goNext(); else goPrev();
    }
    touchStartX.current = null;
  }

  // Clique no fundo: metade esquerda volta, direita avanca (ignora apos swipe).
  function onBackgroundClick(e: React.MouseEvent) {
    if (swiped.current) { swiped.current = false; return; }
    if (e.clientX < window.innerWidth / 2) goPrev(); else goNext();
  }

  async function share() {
    try {
      if (navigator.share) { await navigator.share({ title: petName, url: memorialUrl }); return; }
      await navigator.clipboard.writeText(memorialUrl);
      toast.success('Link copiado');
    } catch {
      /* usuario cancelou o compartilhamento */
    }
  }

  return (
    <div
      className="fixed inset-0 z-[260] select-none overflow-hidden bg-black text-white"
      onMouseMove={revealControls}
      onClick={onBackgroundClick}
      onTouchStart={(e) => { revealControls(); onTouchStart(e); }}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-roledescription="apresentação"
      aria-label={`Apresentação de ${petName}`}
    >
      {/* Camadas de slides (crossfade por opacidade) */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === index ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden={i === index ? undefined : true}
        >
          {slide.kind === 'photo' && (
            <>
              <div className="ep-kenburns absolute inset-0">
                <Image
                  src={slide.photoUrl}
                  alt={`${petName} — ${slide.momentTitle}`}
                  fill
                  unoptimized
                  priority={i === index}
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-8 pb-24 md:p-16 md:pb-28">
                <p className="font-serif text-3xl md:text-5xl">{slide.momentTitle}</p>
                {slide.momentDate && (
                  <p className="mt-1 text-sm uppercase tracking-[0.2em] text-white/70">{formatMonthYear(slide.momentDate)}</p>
                )}
                {slide.description && (
                  <p className="mt-3 max-w-2xl text-base text-white/80 md:text-lg">{slide.description}</p>
                )}
              </div>
            </>
          )}

          {slide.kind === 'cover' && (
            <div className="relative flex h-full flex-col items-center justify-center px-8 text-center">
              {slide.avatarUrl && (
                <>
                  <div className="ep-kenburns absolute inset-0 opacity-30 blur-2xl">
                    <Image src={slide.avatarUrl} alt="" fill unoptimized sizes="100vw" className="object-cover" />
                  </div>
                  <div className="relative mb-8 h-40 w-40 overflow-hidden rounded-full border-4 border-white/20 shadow-2xl md:h-56 md:w-56">
                    <Image src={slide.avatarUrl} alt={petName} fill unoptimized priority sizes="224px" className="object-cover" />
                  </div>
                </>
              )}
              <h1 className="relative font-serif text-5xl md:text-7xl">{slide.petName}</h1>
              {formatYears(slide.birthYear, slide.deathYear) && (
                <p className="relative mt-3 text-sm uppercase tracking-[0.3em] text-white/70">{formatYears(slide.birthYear, slide.deathYear)}</p>
              )}
              {slide.tribute && (
                <p className="relative mt-6 max-w-xl font-serif text-xl italic text-white/85 md:text-2xl">“{slide.tribute}”</p>
              )}
            </div>
          )}

          {slide.kind === 'closing' && (
            <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
              <p className="font-serif text-4xl md:text-6xl">
                {slide.isAlive ? `A história de ${slide.petName} continua` : `Para sempre, ${slide.petName}`}
              </p>
              {formatYears(slide.birthYear, slide.deathYear) && (
                <p className="text-sm uppercase tracking-[0.3em] text-white/60">{formatYears(slide.birthYear, slide.deathYear)}</p>
              )}
              <p className="mt-2 font-serif text-sm italic text-white/50">Eterno Pet</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
                <Link
                  href={`/memorial/${memorialSlug}`}
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
                >
                  Voltar ao memorial
                </Link>
                <button
                  type="button"
                  onClick={share}
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <Share2 className="h-4 w-4" /> Compartilhar
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Controles (nao capturam o clique de fundo, exceto os clusters) */}
      <div className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0'}`}>
        {/* Barra de progresso segmentada */}
        <div className="pointer-events-auto absolute inset-x-0 top-0 flex gap-1 p-3" onClick={(e) => e.stopPropagation()}>
          {slides.map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
              <div
                className={`h-full origin-left rounded-full bg-white ${i < index ? 'scale-x-100' : i === index ? 'ep-progress' : 'scale-x-0'}`}
                style={i === index ? { animationDuration: `${current.kind === 'cover' ? COVER_MS : SLIDE_MS}ms`, animationPlayState: playing ? 'running' : 'paused' } : undefined}
              />
            </div>
          ))}
        </div>

        {/* Topo direito: contador + fechar */}
        <div className="pointer-events-auto absolute right-3 top-8 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <span className="rounded-full bg-black/30 px-3 py-1 text-xs text-white/80">{index + 1} / {slides.length}</span>
          <button type="button" onClick={close} aria-label="Fechar apresentação" className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Base: navegacao + play/pause */}
        <div className="pointer-events-auto absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 p-5" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={goPrev} aria-label="Slide anterior" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pausar' : 'Reproduzir'} className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105">
            {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </button>
          <button type="button" onClick={goNext} aria-label="Próximo slide" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck e lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros de tipo; lint sem novos erros (warnings pré-existentes de `<img>`/fontes são aceitáveis).

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/components/memorial/PresentationPlayer.tsx
git commit -m "feat: PresentationPlayer (player fullscreen da apresentacao) + CSS"
```

---

### Task 4: Rota da apresentação + smoke e2e

**Files:**
- Create: `src/app/memorial/[slug]/apresentacao/page.tsx`
- Create: `e2e/presentation.spec.ts`

**Interfaces:**
- Consumes: `buildPresentationSlides`, `countPresentationPhotos`, `MIN_PRESENTATION_PHOTOS` (`@/lib/memorial/presentation`); `canUse`, `getEffectivePlanServer` (`@/lib/plans`); `PresentationPlayer` (Task 3); `prisma`.
- Produces: rota `/memorial/[slug]/apresentacao` (leaf).

- [ ] **Step 1: Criar a rota**

Criar `src/app/memorial/[slug]/apresentacao/page.tsx`:

```tsx
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { canUse, getEffectivePlanServer } from '@/lib/plans';
import type { Pet, TimelineEntry } from '@/types/database';
import {
  buildPresentationSlides,
  countPresentationPhotos,
  MIN_PRESENTATION_PHOTOS,
} from '@/lib/memorial/presentation';
import PresentationPlayer from '@/components/memorial/PresentationPlayer';

export const revalidate = 60;

interface Props { params: Promise<{ slug: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pet = await prisma.pet.findFirst({
    where: { memorial_slug: slug, is_public: true, moderation_status: { not: 'blocked' } },
    select: { name: true },
  });
  if (!pet) return { title: 'Apresentação não encontrada' };
  return { title: `Apresentação — ${pet.name} · Eterno Pet` };
}

export default async function PresentationPage({ params }: Props) {
  const { slug } = await params;

  const petData = await prisma.pet.findFirst({
    where: { memorial_slug: slug, is_public: true },
  });
  const pet = petData as unknown as Pet | null;
  if (!pet) notFound();
  if ((petData as unknown as { moderation_status?: string })?.moderation_status === 'blocked') {
    notFound();
  }

  const ownerPlanId = await getEffectivePlanServer(pet.owner_id);
  if (!canUse(ownerPlanId, 'presentation')) redirect(`/memorial/${slug}`);

  const entries = (await prisma.timelineEntry.findMany({
    where: { pet_id: pet.id },
    orderBy: { date: 'asc' },
  })) as unknown as TimelineEntry[];

  if (countPresentationPhotos(entries) < MIN_PRESENTATION_PHOTOS) {
    redirect(`/memorial/${slug}`);
  }

  const slides = buildPresentationSlides(pet, entries);
  const memorialUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eternopet.com.br'}/memorial/${slug}`;

  return (
    <PresentationPlayer
      slides={slides}
      memorialSlug={slug}
      petName={pet.name}
      memorialUrl={memorialUrl}
    />
  );
}
```

- [ ] **Step 2: Criar o smoke e2e**

Criar `e2e/presentation.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('apresentação', () => {
  test('memorial inexistente na rota de apresentacao retorna 404', async ({ page }) => {
    const response = await page.goto('/memorial/inexistente-xyz-123/apresentacao');
    expect(response?.status()).toBe(404);
  });
});
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros. (Após `if (!pet) notFound();`, `pet` é `Pet` não-nulo; `redirect()` retorna `never`.)

- [ ] **Step 4: Rodar o smoke e2e**

Run: `npx playwright test e2e/presentation.spec.ts`
Expected: PASS — a rota responde 404 para slug inexistente (usa o `webServer`/`baseURL` já configurados no `playwright.config`).

- [ ] **Step 5: Commit**

```bash
git add "src/app/memorial/[slug]/apresentacao/page.tsx" e2e/presentation.spec.ts
git commit -m "feat: rota /memorial/[slug]/apresentacao (gated premium) + smoke e2e"
```

---

### Task 5: CTA "Assistir apresentação" no memorial

**Files:**
- Modify: `src/app/memorial/[slug]/page.tsx` (imports; após `const allPhotos`; no hero, após o bloco `pet.tribute_text`)

**Interfaces:**
- Consumes: `canUse` (já importado), `MIN_PRESENTATION_PHOTOS` (`@/lib/memorial/presentation`), `ownerPlanId` e `allPhotos` (já presentes na página).

- [ ] **Step 1: Importar o limiar**

Em `src/app/memorial/[slug]/page.tsx`, adicionar após a linha `import ChroniclesSection from '@/components/memorial/ChroniclesSection';`:

```tsx
import { MIN_PRESENTATION_PHOTOS } from '@/lib/memorial/presentation';
```

- [ ] **Step 2: Calcular a elegibilidade**

Logo após a linha `const allPhotos = entries.flatMap(e => e.photo_urls).filter(Boolean);`, adicionar:

```tsx
  const canShowPresentation =
    canUse(ownerPlanId, 'presentation') && allPhotos.length >= MIN_PRESENTATION_PHOTOS;
```

- [ ] **Step 3: Renderizar o CTA no hero**

No hero, localizar o fim do bloco do tributo e inserir o CTA antes do fechamento da `div.relative.z-10`. Trocar:

```tsx
            {pet.tribute_text && (
              <p className="font-serif text-2xl text-on-surface-variant max-w-2xl mx-auto font-light italic break-words" style={{ overflowWrap: 'anywhere' }}>
                “{pet.tribute_text}”
              </p>
            )}
          </div>
```

por:

```tsx
            {pet.tribute_text && (
              <p className="font-serif text-2xl text-on-surface-variant max-w-2xl mx-auto font-light italic break-words" style={{ overflowWrap: 'anywhere' }}>
                “{pet.tribute_text}”
              </p>
            )}

            {canShowPresentation && (
              <div className="mt-10">
                <Link
                  href={`/memorial/${slug}/apresentacao`}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-serif text-on-primary shadow-premium transition-transform hover:-translate-y-0.5"
                >
                  <span className="material-symbols-outlined">slideshow</span>
                  Assistir apresentação
                </Link>
              </div>
            )}
          </div>
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros. (`Link` e `canUse` já estão importados na página.)

- [ ] **Step 5: Commit**

```bash
git add "src/app/memorial/[slug]/page.tsx"
git commit -m "feat: CTA 'Assistir apresentacao' no hero do memorial (premium + 3 fotos)"
```

---

### Task 6: Card de upsell no dashboard (donos grátis)

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx` (import; fetch do plano efetivo; card no aside)

**Interfaces:**
- Consumes: `getEffectivePlanServer` (`@/lib/plans`), `userId` (já presente), `Link` (já importado).

- [ ] **Step 1: Importar o resolvedor de plano**

Em `src/app/(dashboard)/dashboard/page.tsx`, adicionar após a linha `import { getMemorialCompletion } from '@/lib/memorial-completion';`:

```tsx
import { getEffectivePlanServer } from '@/lib/plans';
```

- [ ] **Step 2: Buscar o plano efetivo**

Logo após `const firstName = profile?.full_name?.split(' ')[0] ?? 'Tutor';`, adicionar:

```tsx
  const effectivePlan = await getEffectivePlanServer(userId);
```

- [ ] **Step 3: Renderizar o card de upsell no aside**

No `<aside ...>`, localizar o início do card "A nossa história":

```tsx
          <section className="p-4">
            <div className="rounded-2xl border border-dashed border-outline-variant p-6 flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-outline text-4xl mb-3">pets</span>
```

e inserir **antes** dele:

```tsx
          {effectivePlan === 'free' && (
            <section className="bg-primary/5 p-8 rounded-3xl border border-primary/15">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary">slideshow</span>
                <h3 className="font-serif text-xl text-on-surface">Apresentação premium</h3>
              </div>
              <p className="text-sm text-on-surface-variant mb-6">
                Transforme a linha do tempo do seu pet numa apresentação cinematográfica em tela cheia, para assistir e compartilhar com a família.
              </p>
              <Link
                href="/dashboard/planos"
                className="block w-full text-center py-3 px-4 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim transition-colors"
              >
                Conhecer o Premium
              </Link>
            </section>
          )}

```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Verificação manual (opcional, requer app rodando)**

Com `npm run dev`: numa conta **grátis**, `/dashboard` mostra o card "Apresentação premium"; numa conta **premium**, o card não aparece.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(dashboard)/dashboard/page.tsx"
git commit -m "feat: card de upsell da apresentacao no dashboard (plano gratis)"
```

---

## Verificação manual da experiência (após todas as tasks)

Requer um memorial **premium** público com pelo menos **3 fotos** na timeline (criar via dashboard numa conta premium, ou usar um memorial de exemplo premium). Com `npm run dev`:

1. Abrir `/memorial/<slug>` → o botão "Assistir apresentação" aparece no hero.
2. Clicar → vai para `/memorial/<slug>/apresentacao`; a capa aparece e o autoplay começa.
3. Conferir: crossfade + Ken Burns nas fotos; legenda (título + data) e descrição só no 1º slide do momento; barra de progresso segmentada preenchendo; play/pause; ←/→ e clique nas metades; `Esc` volta ao memorial; encerramento com "Voltar ao memorial" e "Compartilhar".
4. Num memorial **grátis** (ou com < 3 fotos), acessar `/memorial/<slug>/apresentacao` na mão → redireciona para `/memorial/<slug>`.
5. Ativar "reduzir movimento" no SO → sem Ken Burns.

## Self-review (feito)

- **Cobertura do spec:** conceito híbrido (capa/momentos/encerramento) → Task 2 + 3; auto da timeline → Task 2; sem música → nada de áudio; rota dedicada + botão → Task 4 + 5; gating premium + esconder no grátis + upsell → Task 1, 4, 5, 6; abordagem A (sem libs) → Task 3; ISR/reduced-motion/next-image unoptimized → Tasks 3 e 4.
- **Placeholders:** nenhum — todo passo tem código/conteúdo completo.
- **Consistência de tipos:** `PresentationSlide`/`buildPresentationSlides`/`countPresentationPhotos`/`MIN_PRESENTATION_PHOTOS` idênticos entre Task 2 (definição), Task 4 (uso) e Task 5 (uso); props do `PresentationPlayer` idênticas entre Task 3 e Task 4.
