# Apresentação de Slides Premium do Memorial — Design

**Data:** 2026-07-23
**Status:** Aprovado (brainstorming) — pronto para virar plano de implementação

## Objetivo

Oferecer, dentro do memorial público, uma **apresentação de slides cinematográfica**
da vida do pet — um "tributo em movimento" premium, montado automaticamente a
partir da timeline existente, acessível por um link dedicado e compartilhável.

## Decisões do brainstorm

| Tema | Decisão |
|---|---|
| Conceito | **Híbrido cinematográfico**: capa → momentos da timeline como slides → encerramento, com autoplay |
| Conteúdo | **Automático da timeline** (zero builder no dashboard) |
| Música | **Nenhuma** por ora (fast-follow) |
| Entrada | **Rota dedicada** `/memorial/[slug]/apresentacao` + botão "Assistir apresentação" no memorial |
| Gating | **Premium** (plano do dono); memorial grátis **esconde** o botão + **upsell no dashboard** |
| Técnica | **React + CSS puro, sem libs novas** (abordagem A) |

## Escopo

Player fullscreen que roda na rota dedicada, montando os slides da timeline do pet.
Botão de entrada no memorial (premium + ≥ 3 fotos). Card de upsell no dashboard para
donos de plano grátis. Flag de plano `presentation`.

### Fora de escopo (YAGNI)

- Trilha sonora / seleção de música
- Builder de curadoria no dashboard (escolher/ordenar/legendar manualmente)
- Geração de vídeo real (MP4) server-side
- Transições configuráveis pelo tutor

## Restrições globais

- Todo texto de UI em **português brasileiro**.
- **Sem novas dependências** — só Tailwind + React + `next/image` (o projeto não usa lib de animação).
- Imagens via `next/image` com `unoptimized` (consistente com memorial/R2).
- A rota herda **ISR** do memorial: `export const revalidate = 60`.
- Respeitar `prefers-reduced-motion` (desliga Ken Burns, usa fade curto).
- Tokens do design system (`surface`, `primary`, `font-serif`, etc.); nada hardcoded fora do tema.
- Gating idêntico em conceito ao das Crônicas: `canUse(ownerPlanId, 'presentation')`.

## Estrutura dos slides

Montados por um helper puro na ordem cronológica dos momentos (`orderBy date asc`,
como o memorial já faz).

1. **Capa** — avatar do pet em destaque (fundo suave desfocado do próprio avatar),
   nome, datas ("2012 – 2024", ou só nascimento se vivo) e o tributo (`tribute_text`)
   quando houver.
2. **Momentos** — cada **foto** de cada momento vira um slide fullscreen (`object-cover`)
   com leve **Ken Burns**. Legenda sobreposta embaixo: **título do momento + data**
   (formatada no client, ex.: "Mar 2018"). A **descrição** aparece só no **primeiro
   slide de cada momento** (para não repetir). Momento com N fotos = N slides com a
   mesma legenda de contexto.
3. **Encerramento** — falecido → "Para sempre, {nome}" + datas; vivo → "A história de
   {nome} continua". Marca Eterno Pet discreta + ações **Voltar ao memorial** e
   **Compartilhar** (Web Share API com fallback de copiar link).

**Regra de exibição:** o botão/rota só valem para memorial **premium** e com pelo
menos **3 fotos** na timeline (`MIN_PRESENTATION_PHOTOS = 3`, ajustável). Abaixo disso
não há apresentação.

## Player e controles

- **Autoplay:** `SLIDE_MS ≈ 5000` por slide (`COVER_MS ≈ 4000`; o encerramento fica
  parado aguardando ação). **Não** faz loop — para no encerramento. Constantes no topo
  do componente.
- **Transições:** crossfade (`CROSSFADE_MS ≈ 800`) + Ken Burns durante cada foto. Com
  `prefers-reduced-motion`: sem Ken Burns e fade curto.
- **Controles** (aparecem ao mover mouse/tocar; somem após inatividade ~3s):
  - Barra de progresso **segmentada** no topo (um traço por slide, estilo "stories",
    preenchendo com o tempo do slide atual)
  - Play/Pause · Anterior/Próximo · Fechar (X → volta ao memorial)
  - **Toque/clique:** metade direita avança, esquerda volta; **swipe** no mobile
  - **Teclado:** `←`/`→` navega, `Espaço` pausa/continua, `Esc` fecha
- **Performance:** pré-carrega a próxima imagem (`next/image` priority na atual e na próxima).
- **Acessibilidade:** `aria-label` nos controles; `alt` nas imagens (nome do pet/momento);
  foco visível; reduced-motion.

## Arquitetura e arquivos

Fluxo: **rota server** busca pet + momentos → **helper puro** monta os slides → passa
para o **player client**.

### Criar

**`src/lib/memorial/presentation.ts`** — helper puro (sem React), alvo de TDD.

```ts
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
  momentDate: string | null; // ISO cru; o client formata para exibição
  description: string | null; // só no 1º slide do momento; senão null
}
export interface ClosingSlide {
  kind: 'closing';
  petName: string;
  birthYear: number | null;
  deathYear: number | null;
  isAlive: boolean;
}
export type PresentationSlide = CoverSlide | PhotoSlide | ClosingSlide;

export const MIN_PRESENTATION_PHOTOS = 3;

// Conta as fotos elegíveis (todos os photo_urls não vazios dos momentos).
export function countPresentationPhotos(entries: TimelineEntry[]): number;

// Monta [capa, ...fotos, encerramento]. Fotos na ordem dos momentos; dentro do
// momento, na ordem de photo_urls. description só no primeiro slide de cada momento.
export function buildPresentationSlides(
  pet: Pet,
  entries: TimelineEntry[],
): PresentationSlide[];
```

**`src/app/memorial/[slug]/apresentacao/page.tsx`** — rota server, `revalidate = 60`.
- Busca pet (`is_public`, não `blocked`) + momentos (`orderBy date asc`), igual ao memorial.
- Gates: pet inexistente/privado/bloqueado → `notFound()`; dono **não-premium** OU
  `countPresentationPhotos(entries) < MIN_PRESENTATION_PHOTOS` → `redirect('/memorial/[slug]')`.
- Monta `buildPresentationSlides(pet, entries)` e renderiza `<PresentationPlayer slides={...} memorialSlug={slug} petName={pet.name} memorialUrl={...} />`.
- `generateMetadata`: título "Apresentação — {nome}".

**`src/components/memorial/PresentationPlayer.tsx`** — `'use client'` fullscreen.
- Props: `slides: PresentationSlide[]`, `memorialSlug`, `petName`, `memorialUrl`.
- Estado: índice atual, playing, visibilidade dos controles.
- Autoplay por timer; transições CSS; controles; teclado/touch/swipe; reduced-motion;
  formata `momentDate` para pt-BR ("Mar 2018") na exibição.

### Modificar

**`src/lib/plans.ts`**
- `Feature` ganha `'presentation'`.
- `LIMITS` type ganha `presentation: boolean`; `free.presentation = false`,
  `premium.presentation = true`.

**`src/app/memorial/[slug]/page.tsx`**
- Calcular `canShowPresentation = canUse(ownerPlanId, 'presentation') && allPhotos.length >= MIN_PRESENTATION_PHOTOS`.
- Se verdadeiro, CTA "Assistir apresentação" no hero (abaixo do tributo), `Link` para
  `/memorial/${slug}/apresentacao`, estilo premium (ícone + `bg-primary`/`shadow-premium`).

**`src/app/(dashboard)/dashboard/page.tsx`**
- Para dono de plano **grátis**, card de upsell no sidebar: "Apresentação premium —
  transforme a timeline num tributo cinematográfico" + link para `/dashboard/planos`.
  (Usa o plano efetivo já disponível na página; sem novas queries pesadas.)

## Testes

**Unit — `src/lib/memorial/presentation.test.ts`** (Vitest/Jest conforme o projeto; se
não houver runner unit, usar o mesmo padrão dos testes existentes):
- `buildPresentationSlides`: 1º slide é `cover`; último é `closing`; momentos na ordem;
  cada foto vira 1 `photo` slide; `description` só no primeiro slide de cada momento;
  pet vivo (`isAlive true`, sem deathYear) vs falecido; pet sem tributo/sem datas
  (campos null); timeline sem fotos → apenas `[cover, closing]`.
- `countPresentationPhotos`: ignora strings vazias/nulas em `photo_urls`.

**e2e — `e2e/*.spec.ts` (Playwright):**
- Memorial **premium** com ≥ 3 fotos: `/memorial/[slug]/apresentacao` renderiza o player;
  `→` avança; `Esc` volta ao memorial.
- Memorial **grátis** (ou < 3 fotos): `/memorial/[slug]/apresentacao` **redireciona**
  para `/memorial/[slug]`.
- Página do memorial: botão "Assistir apresentação" presente para premium+fotos, ausente
  caso contrário.

## Decisões abertas (baixo risco, resolver na implementação)

- Runner de teste unit: confirmar se o projeto tem Vitest/Jest; se só houver Playwright,
  os testes de `buildPresentationSlides` podem virar testes de nó simples ou e2e. (O
  plano deve checar `package.json`.)
- Estilo exato do CTA no hero e do card de upsell — seguir tokens e componentes existentes.
