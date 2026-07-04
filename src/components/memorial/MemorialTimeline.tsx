'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { CalendarDays, Heart, PawPrint, X } from 'lucide-react';
import { formatDayMonth } from '@/lib/utils';
import type { TimelineEntry } from '@/types/database';

interface Props {
  entries: TimelineEntry[];
  isAlive: boolean;
}

// Quantas lembrancas aparecem antes do "continuar a trilha" para manter a pagina
// enxuta mesmo quando o memorial tem dezenas de momentos (Premium: ate 50).
const INITIAL_VISIBLE = 6;
const LOAD_STEP = 10;
const CARD_WIDTH_PERCENT = 42;

const CONSTELLATION_POSITIONS = [
  { x: 5, y: 6, tilt: -1.8 },
  { x: 53, y: 34, tilt: 1.4 },
  { x: 20, y: 14, tilt: 0.8 },
  { x: 58, y: 2, tilt: -1.2 },
  { x: 9, y: 38, tilt: 1.6 },
  { x: 45, y: 18, tilt: -0.7 },
];

type ConstellationPosition = (typeof CONSTELLATION_POSITIONS)[number];

function getConstellationPosition(index: number): ConstellationPosition {
  return CONSTELLATION_POSITIONS[index % CONSTELLATION_POSITIONS.length];
}

function centerX(position: ConstellationPosition) {
  return position.x + CARD_WIDTH_PERCENT / 2;
}

function YearPill({ year }: { year: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-primary/20 bg-surface px-5 py-1.5 font-serif italic text-lg text-primary shadow-sm">
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
  from: ConstellationPosition;
  to: ConstellationPosition;
  year?: string;
}) {
  const desktopSteps = [0, 1, 2, 3, 4];
  const mobileSteps = [0, 1, 2];
  const fromX = centerX(from);
  const toX = centerX(to);
  const goesRight = toX > fromX;

  return (
    <>
      {/* Desktop: pegadas em diagonal entre pontos livres */}
      <div className={`relative hidden md:block ${year ? 'h-36' : 'h-28'}`}>
        {desktopSteps.map(i => {
          const t = i / (desktopSteps.length - 1);
          const left = fromX + (toX - fromX) * t;
          const top = 10 + t * 70;
          const angle = (goesRight ? 145 : 215) + (i % 2 === 0 ? -10 : 12);
          return (
            <PawPrint
              key={i}
              strokeWidth={1}
              className="absolute h-5 w-5 fill-current text-primary/40"
              style={{ left: `${left}%`, top: `${top}%`, transform: `rotate(${angle}deg)` }}
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
      <div className={`relative md:hidden ${year ? 'h-24' : 'h-14'}`}>
        {mobileSteps.map(i => {
          const t = i / (mobileSteps.length - 1);
          const offset = i % 2 === 0 ? -14 : 6;
          const angle = 180 + (i % 2 === 0 ? -12 : 12);
          return (
            <PawPrint
              key={i}
              strokeWidth={1}
              className="absolute h-5 w-5 fill-current text-primary/40"
              style={{ left: `calc(50% + ${offset}px)`, top: `${10 + t * 62}%`, transform: `rotate(${angle}deg)` }}
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

function entryStyle(position: ConstellationPosition): CSSProperties {
  return {
    '--node-left': `${position.x}%`,
    '--node-top': `${position.y}px`,
    '--node-tilt': `${position.tilt}deg`,
  } as CSSProperties;
}

export default function MemorialTimeline({ entries, isAlive }: Props) {
  const [openEntry, setOpenEntry] = useState<TimelineEntry | null>(null);
  // Se a trilha e curta, mostra tudo de uma vez; um botao sozinho para 1-2 itens seria ruido.
  const [visibleCount, setVisibleCount] = useState(
    entries.length <= INITIAL_VISIBLE + 2 ? entries.length : INITIAL_VISIBLE,
  );

  const close = useCallback(() => setOpenEntry(null), []);

  useEffect(() => {
    if (!openEntry) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [openEntry, close]);

  const items = entries.map((entry, index) => {
    const year = String(new Date(entry.date).getUTCFullYear());
    const prevYear = index > 0 ? String(new Date(entries[index - 1].date).getUTCFullYear()) : null;
    return { entry, index, year, isNewYear: year !== prevYear };
  });
  const visibleItems = items.slice(0, visibleCount);
  const hiddenCount = entries.length - visibleCount;

  return (
    <>
      <div className="relative">
        {visibleItems.map(({ entry, index, year }) => {
          const position = getConstellationPosition(index);
          const nextItem = visibleItems[index + 1];
          const cover = entry.photo_urls[0];
          const extraPhotos = entry.photo_urls.length - 1;

          return (
            <div key={entry.id}>
              {/* Primeiro marco de ano, antes da primeira lembranca */}
              {index === 0 && (
                <div className="mb-8 flex justify-center">
                  <YearPill year={year} />
                </div>
              )}

              {/* Lembranca em modo constelacao */}
              <div className="relative md:min-h-[310px]">
                <button
                  type="button"
                  onClick={() => setOpenEntry(entry)}
                  style={entryStyle(position)}
                  className="group w-full min-w-0 overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-lowest text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-md sm:max-w-[420px] md:absolute md:left-[var(--node-left)] md:top-[var(--node-top)] md:w-[42%] md:rotate-[var(--node-tilt)] md:hover:rotate-0"
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
                    <span className="mb-1.5 inline-flex items-center gap-1.5 text-primary/80">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span className="font-serif text-sm italic first-letter:uppercase">{formatDayMonth(entry.date)}</span>
                    </span>
                    <h3 className="mb-0.5 break-words font-serif text-lg text-on-surface">{entry.title}</h3>
                    {entry.description && (
                      <p className="break-words text-sm leading-5 text-on-surface-variant line-clamp-2" style={{ overflowWrap: 'anywhere' }}>
                        {entry.description}
                      </p>
                    )}
                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-primary/60 transition-colors group-hover:text-primary">
                      Ver lembrança
                    </span>
                  </div>
                </button>
              </div>

              {nextItem && (
                <PawBridge
                  from={position}
                  to={getConstellationPosition(nextItem.index)}
                  year={nextItem.isNewYear ? nextItem.year : undefined}
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
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-primary">
                <CalendarDays className="h-3.5 w-3.5" />
                <span className="font-serif text-sm italic first-letter:uppercase">
                  {formatDayMonth(openEntry.date)} de {new Date(openEntry.date).getUTCFullYear()}
                </span>
              </span>
              <h3 className="mb-4 break-words font-serif text-3xl text-on-surface" style={{ overflowWrap: 'anywhere' }}>
                {openEntry.title}
              </h3>
              {openEntry.description && (
                <p className="whitespace-pre-line break-words text-base leading-relaxed text-on-surface-variant" style={{ overflowWrap: 'anywhere' }}>
                  {openEntry.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
