'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Edit3, Plus, Sparkles, X } from 'lucide-react';
import ChronicleDeleteButton from './ChronicleDeleteButton';
import { formatDate } from '@/lib/utils';
import type { Chronicle, Pet } from '@/types/database';

interface Props {
  pet: Pet;
  chronicles: Chronicle[];
}

export default function ChronicleList({ pet, chronicles }: Props) {
  const [activePhase, setActivePhase] = useState<string | null>(null);
  const [activeMood, setActiveMood] = useState<string | null>(null);

  const phases = useMemo(
    () => Array.from(new Set(chronicles.map((c) => c.life_phase).filter(Boolean))) as string[],
    [chronicles],
  );
  const moods = useMemo(
    () => Array.from(new Set(chronicles.map((c) => c.mood).filter(Boolean))) as string[],
    [chronicles],
  );

  const filtered = useMemo(() => {
    return chronicles.filter((c) => {
      if (activePhase && c.life_phase !== activePhase) return false;
      if (activeMood && c.mood !== activeMood) return false;
      return true;
    });
  }, [chronicles, activePhase, activeMood]);

  const hasFilters = activePhase !== null || activeMood !== null;

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* Sidebar */}
      <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
        <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
              Fases da vida
            </h2>
            {activePhase && (
              <button
                onClick={() => setActivePhase(null)}
                className="flex items-center gap-1 text-[10px] text-on-surface-variant hover:text-on-surface"
              >
                <X className="h-3 w-3" /> Limpar
              </button>
            )}
          </div>
          {phases.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              As fases aparecem conforme você escreve.
            </p>
          ) : (
            <div className="space-y-1">
              {phases.map((phase) => (
                <button
                  key={phase}
                  onClick={() => setActivePhase(activePhase === phase ? null : phase)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                    activePhase === phase
                      ? 'bg-primary/10 font-semibold text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      activePhase === phase ? 'bg-primary' : 'bg-secondary'
                    }`}
                  />
                  {phase}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Tons</h2>
            {activeMood && (
              <button
                onClick={() => setActiveMood(null)}
                className="flex items-center gap-1 text-[10px] text-on-surface-variant hover:text-on-surface"
              >
                <X className="h-3 w-3" /> Limpar
              </button>
            )}
          </div>
          {moods.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              Marque o tom das próximas crônicas.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {moods.map((mood) => (
                <button
                  key={mood}
                  onClick={() => setActiveMood(activeMood === mood ? null : mood)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    activeMood === mood
                      ? 'bg-secondary text-on-secondary'
                      : 'bg-secondary/10 text-secondary hover:bg-secondary/20'
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          )}
        </section>

        {hasFilters && (
          <button
            onClick={() => { setActivePhase(null); setActiveMood(null); }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <X className="h-4 w-4" />
            Limpar filtros
          </button>
        )}
      </aside>

      {/* List */}
      <main className="min-w-0">
        {filtered.length === 0 && chronicles.length === 0 ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-outline-variant bg-surface-container-low px-6 text-center">
            <Sparkles className="mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-2 font-serif text-3xl text-on-surface">Nenhuma crônica ainda</h2>
            <p className="mb-6 max-w-md text-on-surface-variant">
              Comece por uma lembrança simples: um passeio, uma mania, uma despedida ou uma pequena alegria.
            </p>
            <Link
              href={`/dashboard/pets/${pet.memorial_slug}/diario/novo`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim"
            >
              <Plus className="h-4 w-4" />
              Escrever primeira crônica
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-dashed border-outline-variant/40 bg-surface-container-low px-6 text-center">
            <p className="font-serif text-xl text-on-surface-variant">Nenhuma crônica para este filtro</p>
            <button
              onClick={() => { setActivePhase(null); setActiveMood(null); }}
              className="mt-4 text-sm font-semibold text-primary hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {hasFilters && (
              <p className="text-sm text-on-surface-variant">
                {filtered.length} {filtered.length === 1 ? 'crônica' : 'crônicas'} encontrada{filtered.length !== 1 ? 's' : ''}
                {activePhase && <> · <span className="font-semibold text-primary">{activePhase}</span></>}
                {activeMood && <> · <span className="font-semibold text-secondary">{activeMood}</span></>}
              </p>
            )}
            {filtered.map((chronicle) => (
              <article
                key={chronicle.id}
                className="group grid min-w-0 gap-5 rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-card transition-colors hover:border-outline-variant/30 sm:grid-cols-[180px_minmax(0,1fr)]"
              >
                <div>
                  <div className="relative aspect-[4/5] max-h-[220px] overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container sm:h-[220px] sm:aspect-auto">
                    {chronicle.cover_url ? (
                      <Image
                        src={chronicle.cover_url}
                        alt={chronicle.title}
                        fill
                        unoptimized
                        className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="material-symbols-outlined text-[42px] text-outline">
                          menu_book
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex min-w-0 flex-col justify-center py-2">
                  <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-secondary">
                    <span>{formatDate(chronicle.event_date ?? chronicle.created_at)}</span>
                    <span className="text-outline">/</span>
                    <span>{chronicle.reading_minutes} min</span>
                    {chronicle.life_phase && (
                      <button
                        onClick={() => setActivePhase(chronicle.life_phase!)}
                        className="rounded-full bg-primary/10 px-2 py-0.5 text-primary transition-colors hover:bg-primary/20"
                      >
                        {chronicle.life_phase}
                      </button>
                    )}
                    {chronicle.mood && (
                      <button
                        onClick={() => setActiveMood(chronicle.mood!)}
                        className="rounded-full bg-secondary/10 px-2 py-0.5 text-secondary transition-colors hover:bg-secondary/20"
                      >
                        {chronicle.mood}
                      </button>
                    )}
                    {!chronicle.is_published && (
                      <span className="rounded-full bg-surface-container-high px-2 py-1 text-on-surface-variant">
                        Rascunho
                      </span>
                    )}
                  </div>
                  <h2 className="max-w-full break-words font-serif text-2xl text-primary transition-colors group-hover:text-secondary sm:text-3xl">
                    {chronicle.title}
                  </h2>
                  <p
                    className="mt-3 max-w-full break-words text-base leading-7 text-on-surface-variant line-clamp-4 sm:text-lg"
                    style={{ overflowWrap: 'anywhere' }}
                  >
                    {chronicle.excerpt ?? chronicle.content.slice(0, 220)}
                  </p>
                  <div className="mt-6 flex items-center gap-2">
                    <Link
                      href={`/dashboard/pets/${pet.memorial_slug}/diario/${chronicle.id}/editar`}
                      className="inline-flex items-center gap-2 rounded-full border border-outline-variant/40 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-surface-container"
                    >
                      <Edit3 className="h-4 w-4" />
                      Editar
                    </Link>
                    <ChronicleDeleteButton chronicleId={chronicle.id} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
