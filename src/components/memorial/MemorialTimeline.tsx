'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Gift,
  Heart,
  Home,
  Map,
  PawPrint,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-react';
import { formatDayMonth } from '@/lib/utils';
import type { TimelineEntry } from '@/types/database';

interface Props {
  entries: TimelineEntry[];
  isAlive: boolean;
  layoutMode?: TimelineLayoutMode;
}

// Quantas lembrancas aparecem antes do "continuar a trilha" para manter a pagina
// enxuta mesmo quando o memorial tem dezenas de momentos (Premium: ate 50).
const INITIAL_VISIBLE = 6;
const LOAD_STEP = 10;
const CARD_WIDTH_PERCENT = 42;
const DEFAULT_TIMELINE_LAYOUT: TimelineLayoutMode = 'waves';

type TrailPosition = { x: number; y: number; tilt: number };
type TimelineLayoutMode = 'waves' | 'constellation';

const WAVE_POSITIONS: TrailPosition[] = [
  { x: 4, y: 4, tilt: -0.45 },
  { x: 29, y: 20, tilt: 0.35 },
  { x: 53, y: 36, tilt: -0.35 },
  { x: 47, y: 8, tilt: 0.35 },
  { x: 24, y: 22, tilt: -0.35 },
  { x: 4, y: 36, tilt: 0.45 },
];

const CONSTELLATION_POSITIONS: TrailPosition[] = [
  { x: 5, y: 6, tilt: -1.8 },
  { x: 53, y: 34, tilt: 1.4 },
  { x: 20, y: 14, tilt: 0.8 },
  { x: 58, y: 2, tilt: -1.2 },
  { x: 9, y: 38, tilt: 1.6 },
  { x: 45, y: 18, tilt: -0.7 },
];

type MomentKind = 'arrival' | 'celebration' | 'adventure' | 'farewell' | 'memory';

const MOMENT_KIND_META: Record<MomentKind, {
  label: string;
  Icon: LucideIcon;
  badgeClass: string;
  accentClass: string;
}> = {
  arrival: {
    label: 'Chegada',
    Icon: Home,
    badgeClass: 'bg-primary/10 text-primary',
    accentClass: 'border-primary/25',
  },
  celebration: {
    label: 'Celebração',
    Icon: Gift,
    badgeClass: 'bg-secondary/15 text-secondary',
    accentClass: 'border-secondary/30',
  },
  adventure: {
    label: 'Aventura',
    Icon: Map,
    badgeClass: 'bg-tertiary/10 text-tertiary',
    accentClass: 'border-tertiary/25',
  },
  farewell: {
    label: 'Saudade',
    Icon: Heart,
    badgeClass: 'bg-error/10 text-error',
    accentClass: 'border-error/20',
  },
  memory: {
    label: 'Memória',
    Icon: Sparkles,
    badgeClass: 'bg-primary-fixed/40 text-primary',
    accentClass: 'border-outline-variant/15',
  },
};

function getTrailPosition(index: number, mode: TimelineLayoutMode): TrailPosition {
  const positions = mode === 'waves' ? WAVE_POSITIONS : CONSTELLATION_POSITIONS;
  return positions[index % positions.length];
}

function centerX(position: TrailPosition) {
  return position.x + CARD_WIDTH_PERCENT / 2;
}

function clampPercent(value: number) {
  return Math.min(92, Math.max(8, value));
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getMomentKind(entry: TimelineEntry): MomentKind {
  const text = normalizeText(`${entry.title} ${entry.description ?? ''}`);

  if (/(despedida|saudade|partida|adeus|faleceu|morreu|luto)/.test(text)) {
    return 'farewell';
  }
  if (/(aniversario|parabens|festa|celebracao|natal|presente)/.test(text)) {
    return 'celebration';
  }
  if (/(chegada|chegou|nasceu|nascimento|adocao|adotad|primeiro dia|casa)/.test(text)) {
    return 'arrival';
  }
  if (/(viagem|praia|passeio|trilha|parque|aventura|corrida|rua)/.test(text)) {
    return 'adventure';
  }

  return 'memory';
}

function validYear(date: string | Date | null | undefined) {
  if (!date) return null;
  const year = new Date(date).getUTCFullYear();
  const nextYear = new Date().getUTCFullYear() + 1;
  return year >= 1900 && year <= nextYear ? String(year) : null;
}

function YearPill({ year }: { year: string }) {
  return (
    <span className="relative z-10 inline-flex items-center rounded-full border border-primary/20 bg-surface px-5 py-1.5 font-serif italic text-lg text-primary shadow-sm">
      {year}
    </span>
  );
}

/**
 * Trilha de pegadas entre dois pontos livres da constelacao. No mobile, a
 * trilha fica vertical para preservar leitura e toque.
 */
function PawBridge({
  from,
  to,
  year,
}: {
  from: TrailPosition;
  to: TrailPosition;
  year?: string;
}) {
  const desktopSteps = [0, 1, 2, 3];
  const mobileSteps = [0, 1, 2];
  const fromX = centerX(from);
  const toX = centerX(to);
  const deltaX = toX - fromX;
  const goesRight = toX > fromX;
  const isTightTurn = Math.abs(deltaX) < 10;
  const turnDirection = fromX > 50 ? -1 : 1;

  return (
    <>
      {/* Desktop: pegadas em diagonal entre pontos livres */}
      <div className={`pointer-events-none relative z-0 hidden md:block ${year ? 'h-32' : 'h-24'}`}>
        {desktopSteps.map(i => {
          const t = i / (desktopSteps.length - 1);
          const curve = Math.sin(t * Math.PI) * (isTightTurn ? 9 * turnDirection : 3.5 * (goesRight ? 1 : -1));
          const stride = i % 2 === 0 ? -1.5 : 1.5;
          const left = clampPercent(fromX + deltaX * t + curve + stride);
          const top = 18 + t * 60;
          const baseAngle = isTightTurn ? (turnDirection > 0 ? 155 : 205) : goesRight ? 145 : 215;
          const angle = baseAngle + (i % 2 === 0 ? -9 : 9);
          return (
            <PawPrint
              key={i}
              strokeWidth={1}
              className="absolute h-3.5 w-3.5 fill-current text-primary/25"
              style={{ left: `${left}%`, top: `${top}%`, transform: `translate(-50%, -50%) rotate(${angle}deg)` }}
            />
          );
        })}
        {year && (
          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            <YearPill year={year} />
          </div>
        )}
      </div>

      {/* Mobile: pegadas descendo em coluna */}
      <div className={`pointer-events-none relative z-0 md:hidden ${year ? 'h-24' : 'h-14'}`}>
        {mobileSteps.map(i => {
          const t = i / (mobileSteps.length - 1);
          const offset = i % 2 === 0 ? -14 : 6;
          const angle = 180 + (i % 2 === 0 ? -12 : 12);
          return (
            <PawPrint
              key={i}
              strokeWidth={1}
              className="absolute h-3.5 w-3.5 fill-current text-primary/25"
              style={{ left: `calc(50% + ${offset}px)`, top: `${12 + t * 64}%`, transform: `translate(-50%, -50%) rotate(${angle}deg)` }}
            />
          );
        })}
        {year && (
          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            <YearPill year={year} />
          </div>
        )}
      </div>
    </>
  );
}

function entryStyle(position: TrailPosition): CSSProperties {
  return {
    '--node-left': `${position.x}%`,
    '--node-top': `${position.y}px`,
    '--node-tilt': `${position.tilt}deg`,
  } as CSSProperties;
}

export default function MemorialTimeline({
  entries,
  isAlive,
  layoutMode = DEFAULT_TIMELINE_LAYOUT,
}: Props) {
  const [openEntry, setOpenEntry] = useState<TimelineEntry | null>(null);
  // Se a trilha e curta, mostra tudo de uma vez; um botao sozinho para 1-2 itens seria ruido.
  const [visibleCount, setVisibleCount] = useState(
    entries.length <= INITIAL_VISIBLE + 2 ? entries.length : INITIAL_VISIBLE,
  );

  const close = useCallback(() => setOpenEntry(null), []);
  const moveOpenEntry = useCallback((direction: -1 | 1) => {
    setOpenEntry(current => {
      if (!current) return current;
      const currentIndex = entries.findIndex(entry => entry.id === current.id);
      if (currentIndex < 0) return current;
      return entries[currentIndex + direction] ?? current;
    });
  }, [entries]);

  useEffect(() => {
    if (!openEntry) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') moveOpenEntry(-1);
      if (e.key === 'ArrowRight') moveOpenEntry(1);
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [openEntry, close, moveOpenEntry]);

  const items = entries.map((entry, index) => {
    const year = validYear(entry.date);
    const prevYear = index > 0 ? validYear(entries[index - 1].date) : null;
    return { entry, index, year, isNewYear: year !== null && year !== prevYear };
  });
  const visibleItems = items.slice(0, visibleCount);
  const hiddenCount = entries.length - visibleCount;
  const openIndex = openEntry ? entries.findIndex(entry => entry.id === openEntry.id) : -1;
  const previousEntry = openIndex > 0 ? entries[openIndex - 1] : null;
  const nextEntry = openIndex >= 0 && openIndex < entries.length - 1 ? entries[openIndex + 1] : null;
  const openMomentMeta = openEntry ? MOMENT_KIND_META[getMomentKind(openEntry)] : null;
  const OpenMomentIcon = openMomentMeta?.Icon ?? Sparkles;
  const openYear = openEntry ? validYear(openEntry.date) : null;

  return (
    <>
      <div className="relative">
        {visibleItems.map(({ entry, index, year }) => {
          const position = getTrailPosition(index, layoutMode);
          const nextItem = visibleItems[index + 1];
          const cover = entry.photo_urls[0];
          const extraPhotos = entry.photo_urls.length - 1;
          const stageHeightClass = cover ? 'md:min-h-[470px]' : 'md:min-h-[220px]';
          const momentMeta = MOMENT_KIND_META[getMomentKind(entry)];
          const MomentIcon = momentMeta.Icon;

          return (
            <div key={entry.id}>
              {/* Primeiro marco de ano, antes da primeira lembranca */}
              {index === 0 && year && (
                <div className="mb-8 flex justify-center">
                  <YearPill year={year} />
                </div>
              )}

              {/* Lembranca em modo constelacao */}
              <div className={`relative z-10 ${stageHeightClass}`}>
                <button
                  type="button"
                  onClick={() => setOpenEntry(entry)}
                  style={entryStyle(position)}
                  className={`group relative z-10 w-full min-w-0 overflow-hidden rounded-2xl border bg-surface-container-lowest text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-md sm:max-w-[420px] md:absolute md:left-[var(--node-left)] md:top-[var(--node-top)] md:w-[42%] md:rotate-[var(--node-tilt)] md:hover:rotate-0 ${momentMeta.accentClass}`}
                >
                  {cover && (
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-container">
                      <Image
                        src={cover}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 92vw, 340px"
                        unoptimized
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {extraPhotos > 0 && (
                        <span className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                          +{extraPhotos} {extraPhotos === 1 ? 'foto' : 'fotos'}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest ${momentMeta.badgeClass}`}>
                        <MomentIcon className="h-3.5 w-3.5" />
                        {momentMeta.label}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-primary/80">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span className="font-serif text-sm italic first-letter:uppercase">{formatDayMonth(entry.date)}</span>
                      </span>
                    </div>
                    <h3 className="mb-0.5 break-words font-serif text-lg text-on-surface">{entry.title}</h3>
                    {entry.description && (
                      <p className="break-words text-sm leading-5 text-on-surface-variant line-clamp-2" style={{ overflowWrap: 'anywhere' }}>
                        {entry.description}
                      </p>
                    )}
                    <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-primary/60 transition-colors group-hover:text-primary">
                      Ver lembrança
                    </span>
                  </div>
                </button>
              </div>

              {nextItem && (
                <PawBridge
                  from={position}
                  to={getTrailPosition(nextItem.index, layoutMode)}
                  year={nextItem.isNewYear ? nextItem.year ?? undefined : undefined}
                />
              )}
            </div>
          );
        })}

        {hiddenCount > 0 ? (
          /* A trilha continua: revela as proximas lembrancas sem esticar a pagina */
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount(c => Math.min(c + LOAD_STEP, entries.length))}
              className="inline-flex items-center gap-2.5 rounded-full border border-primary/25 bg-surface px-6 py-3 font-serif italic text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
            >
              <PawPrint strokeWidth={1} className="h-4 w-4 fill-current text-primary/50" />
              Continuar a trilha
              <span className="text-sm text-primary/60">
                +{hiddenCount} {hiddenCount === 1 ? 'lembrança' : 'lembranças'}
              </span>
            </button>
          </div>
        ) : (
          /* Fecho da trilha */
          <div className="mt-14 flex flex-col items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-container shadow-sm">
              <Heart className="h-5 w-5 fill-current text-on-primary-container" />
            </div>
            <p className="text-center font-serif italic text-sm text-on-surface-variant">
              {isAlive ? 'E a trilha continua sendo caminhada…' : 'Para sempre em nossa história.'}
            </p>
          </div>
        )}
      </div>

      {/* Modal amplo da lembranca */}
      {openEntry && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={openEntry.title}
        >
          <div
            className="relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-surface shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-surface/80 text-on-surface backdrop-blur transition-colors hover:bg-surface-container"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            {previousEntry && (
              <button
                type="button"
                onClick={() => moveOpenEntry(-1)}
                className="absolute left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/80 text-on-surface shadow-sm backdrop-blur transition-colors hover:bg-surface-container md:flex"
                aria-label="Lembranca anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {nextEntry && (
              <button
                type="button"
                onClick={() => moveOpenEntry(1)}
                className="absolute right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/80 text-on-surface shadow-sm backdrop-blur transition-colors hover:bg-surface-container md:flex"
                aria-label="Proxima lembranca"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            {openEntry.photo_urls.length > 0 && (
              <div className={`grid gap-1.5 ${openEntry.photo_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {openEntry.photo_urls.map((url, j) => (
                  <div
                    key={`${openEntry.id}-modal-${j}`}
                    className={`relative min-h-0 w-full overflow-hidden bg-surface-container ${
                      openEntry.photo_urls.length === 1
                        ? 'aspect-[16/9]'
                        : j === 0 && openEntry.photo_urls.length === 3
                          ? 'col-span-2 aspect-[16/9]'
                          : 'aspect-square'
                    }`}
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 92vw, 736px"
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="p-8 md:p-10">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {openMomentMeta && (
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest ${openMomentMeta.badgeClass}`}>
                    <OpenMomentIcon className="h-3.5 w-3.5" />
                    {openMomentMeta.label}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-primary">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span className="font-serif text-sm italic first-letter:uppercase">
                    {formatDayMonth(openEntry.date)}
                    {openYear ? ` de ${openYear}` : ''}
                  </span>
                </span>
              </div>
              <h3 className="mb-4 break-words font-serif text-3xl text-on-surface" style={{ overflowWrap: 'anywhere' }}>
                {openEntry.title}
              </h3>
              {openEntry.description && (
                <p className="whitespace-pre-line break-words text-base leading-relaxed text-on-surface-variant" style={{ overflowWrap: 'anywhere' }}>
                  {openEntry.description}
                </p>
              )}

              {(previousEntry || nextEntry) && (
                <div className="mt-8 flex flex-col gap-3 border-t border-outline-variant/20 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => moveOpenEntry(-1)}
                    disabled={!previousEntry}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-outline-variant/30 px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => moveOpenEntry(1)}
                    disabled={!nextEntry}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-outline-variant/30 px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-30"
                  >
                    Proxima
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
