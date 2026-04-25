'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { Check, ExternalLink, X } from 'lucide-react';
import { approveTribute, rejectTribute } from '@/lib/actions/tributes';
import type { Tribute } from '@/types/database';

export type PendingTribute = Tribute & {
  pet: {
    id: string;
    name: string;
    memorial_slug: string;
  };
};

interface Props {
  initialTributes: PendingTribute[];
}

export default function ApprovalsBoard({ initialTributes }: Props) {
  const [tributes, setTributes] = useState(initialTributes);
  const [isPending, startTransition] = useTransition();

  const grouped = useMemo(() => {
    const map = new Map<string, PendingTribute[]>();
    for (const tribute of tributes) {
      const key = tribute.pet.id;
      map.set(key, [...(map.get(key) ?? []), tribute]);
    }
    return Array.from(map.values());
  }, [tributes]);

  function review(id: string, action: 'approve' | 'reject') {
    startTransition(async () => {
      const result = action === 'approve'
        ? await approveTribute(id)
        : await rejectTribute(id);

      if (!result.error) {
        setTributes(prev => prev.filter(tribute => tribute.id !== id));
      }
    });
  }

  if (tributes.length === 0) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-outline-variant bg-surface-container-low px-6 text-center">
        <span className="material-symbols-outlined mb-4 text-[64px] text-outline">verified</span>
        <h2 className="font-serif text-3xl text-on-surface">Tudo revisado</h2>
        <p className="mt-2 max-w-md text-on-surface-variant">
          Quando alguém enviar uma homenagem para seus memoriais, ela aparecerá aqui antes de ir ao ar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {grouped.map((group) => {
        const pet = group[0].pet;
        return (
          <section key={pet.id} className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">
                  {group.length} {group.length === 1 ? 'pendente' : 'pendentes'}
                </p>
                <h2 className="font-serif text-2xl text-on-surface">{pet.name}</h2>
              </div>
              <Link
                href={`/dashboard/pets/${pet.memorial_slug}/editar`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Abrir pet
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {group.map((tribute) => (
                <article
                  key={tribute.id}
                  className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5"
                >
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">
                        {tribute.author_name}
                      </p>
                      {tribute.author_relation && (
                        <p className="mt-1 text-xs capitalize text-on-surface-variant">
                          {tribute.author_relation}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      {new Date(tribute.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  <p
                    className="break-words font-serif italic leading-7 text-on-surface"
                    style={{ overflowWrap: 'anywhere' }}
                  >
                    "{tribute.message}"
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => review(tribute.id, 'approve')}
                      disabled={isPending}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      Aprovar
                    </button>
                    <button
                      type="button"
                      onClick={() => review(tribute.id, 'reject')}
                      disabled={isPending}
                      className="inline-flex items-center gap-2 rounded-full border border-outline-variant/50 px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Rejeitar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
