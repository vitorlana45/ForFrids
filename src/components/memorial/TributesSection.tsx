'use client';

import { useState } from 'react';
import type { Tribute } from '@/types/database';
import TributeCard from './TributeCard';
import TributeForm from './TributeForm';

const INITIAL_COUNT = 6;

interface Props {
  petId: string;
  petName: string;
  memorialSlug: string;
  initialTributes: Tribute[];
  isAuthenticated: boolean;
}

export default function TributesSection({
  petId,
  petName,
  memorialSlug,
  initialTributes,
  isAuthenticated,
}: Props) {
  const [tributes, setTributes] = useState<Tribute[]>(initialTributes);
  const [showForm, setShowForm] = useState(false);
  const [pendingSubmitted, setPendingSubmitted] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const visibleTributes = expanded ? tributes : tributes.slice(0, INITIAL_COUNT);
  const hiddenCount = tributes.length - INITIAL_COUNT;

  const sectionTitle =
    showForm && tributes.length === 0 ? 'Deixe uma Mensagem' : 'Mensagens de Amor';

  const sectionDescription = showForm
    ? `Escreva uma homenagem para ${petName}.`
    : tributes.length > 0
    ? `${tributes.length} ${tributes.length === 1 ? 'homenagem registrada' : 'homenagens registradas'} para ${petName}.`
    : `Seja o primeiro a deixar uma homenagem para ${petName}.`;

  function handleClose() {
    setShowForm(false);
  }

  function handleCreated(tribute: Tribute) {
    if (tribute.status === 'approved') {
      setTributes((prev) => [tribute, ...prev]);
    } else {
      setPendingSubmitted(true);
    }
  }

  return (
    <section className="py-16" id="tributos">
      <div className="flex items-end justify-between mb-16">
        <div>
          <h2 className="font-serif text-4xl text-primary">{sectionTitle}</h2>
          <p className="mt-1 text-tertiary">{sectionDescription}</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 text-primary font-medium hover:underline underline-offset-4"
          >
            <span className="material-symbols-outlined text-xl">edit_note</span>
            Escrever
          </button>
        )}
      </div>

      {showForm && isAuthenticated && (
        <div className="mb-12 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-8">
          <TributeForm
            petId={petId}
            petName={petName}
            memorialSlug={memorialSlug}
            isAuthenticated={isAuthenticated}
            onClose={handleClose}
            onCreated={handleCreated}
          />
        </div>
      )}

      {showForm && !isAuthenticated && (
        <TributeForm
          petId={petId}
          petName={petName}
          memorialSlug={memorialSlug}
          isAuthenticated={isAuthenticated}
          onClose={handleClose}
          onCreated={handleCreated}
        />
      )}

      {pendingSubmitted && !showForm && (
        <div className="mb-8 rounded-2xl border border-secondary/20 bg-secondary/10 px-6 py-4 text-sm text-on-surface-variant">
          Sua homenagem foi enviada e está aguardando aprovação do tutor.
        </div>
      )}

      {tributes.length > 0 ? (
        <>
          <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
            {visibleTributes.map((tribute, i) => (
              <div key={tribute.id} className="mb-6 break-inside-avoid">
                <TributeCard tribute={tribute} index={i} />
              </div>
            ))}
          </div>

          {hiddenCount > 0 && !expanded && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setExpanded(true)}
                className="inline-flex items-center gap-2 rounded-full border border-outline-variant/40 px-8 py-3 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-base">expand_more</span>
                Ver mais {hiddenCount} {hiddenCount === 1 ? 'homenagem' : 'homenagens'}
              </button>
            </div>
          )}

          {expanded && tributes.length > INITIAL_COUNT && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setExpanded(false)}
                className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-base">expand_less</span>
                Mostrar menos
              </button>
            </div>
          )}
        </>
      ) : !showForm ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-low py-20 text-center">
          <span className="material-symbols-outlined mb-4 text-[48px] text-outline">
            format_quote
          </span>
          <p className="mb-2 font-serif text-xl text-on-surface-variant">
            Seja o primeiro a deixar uma mensagem
          </p>
          <p className="mb-6 max-w-xs text-sm text-on-surface-variant">
            Tributos de amigos e familiares aparecerão aqui.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full bg-primary px-8 py-3 font-serif font-medium text-on-primary transition-all hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim"
          >
            Deixar Homenagem
          </button>
        </div>
      ) : null}
    </section>
  );
}
