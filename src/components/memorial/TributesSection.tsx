'use client';

import { useState } from 'react';
import type { Tribute } from '@/types/database';
import TributeCard from './TributeCard';
import TributeForm from './TributeForm';

interface Props {
  petId: string;
  petName: string;
  memorialSlug: string;
  initialTributes: Tribute[];
}

export default function TributesSection({ petId, petName, memorialSlug, initialTributes }: Props) {
  const [tributes, setTributes] = useState<Tribute[]>(initialTributes);
  const [showForm, setShowForm] = useState(false);

  function handleClose() {
    setShowForm(false);
  }

  return (
    <section className="py-16" id="tributos">
      <div className="flex justify-between items-end mb-16">
        <div>
          <h2 className="font-serif text-4xl text-primary">Mensagens de Amor</h2>
          <p className="text-tertiary mt-1">O que os amigos dizem sobre {petName}</p>
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

      {/* Tribute form inline */}
      {showForm && (
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-8 mb-12">
          <TributeForm
            petId={petId}
            petName={petName}
            memorialSlug={memorialSlug}
            onClose={handleClose}
          />
        </div>
      )}

      {/* Tribute cards */}
      {tributes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tributes.map((tribute, i) => (
            <TributeCard key={tribute.id} tribute={tribute} index={i} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-low py-20 text-center">
          <span className="material-symbols-outlined text-[48px] text-outline mb-4">format_quote</span>
          <p className="font-serif text-xl text-on-surface-variant mb-2">Seja o primeiro a deixar uma mensagem</p>
          <p className="text-sm text-on-surface-variant mb-6 max-w-xs">
            Tributos de amigos e familiares aparecerão aqui.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-8 py-3 bg-primary text-on-primary rounded-full font-serif font-medium hover:bg-[#3d4d41] transition-all"
          >
            Deixar Homenagem
          </button>
        </div>
      )}
    </section>
  );
}
