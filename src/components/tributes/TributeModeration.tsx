'use client';

import { useState, useTransition } from 'react';
import { Check, X } from 'lucide-react';
import { approveTribute, rejectTribute } from '@/lib/actions/tributes';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import type { Tribute } from '@/types/database';

interface Props {
  initialTributes: Tribute[];
}

export default function TributeModeration({ initialTributes }: Props) {
  const confirm = useConfirm();
  const toast = useToast();
  const [tributes, setTributes] = useState(initialTributes);
  const [isPending, startTransition] = useTransition();

  async function review(id: string, action: 'approve' | 'reject') {
    if (action === 'reject') {
      const confirmed = await confirm({
        title: 'Rejeitar homenagem',
        message: 'A homenagem será removida e não aparecerá no memorial.',
        confirmLabel: 'Rejeitar',
        variant: 'danger',
      });
      if (!confirmed) return;
    }

    startTransition(async () => {
      const result = action === 'approve'
        ? await approveTribute(id)
        : await rejectTribute(id);

      if (result.error) {
        toast.error('Erro ao processar a homenagem. Tente novamente.');
      } else {
        toast.success(action === 'approve' ? 'Homenagem aprovada.' : 'Homenagem rejeitada.');
        setTributes(prev => prev.filter(tribute => tribute.id !== id));
      }
    });
  }

  if (tributes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-6 py-10 text-center">
        <span className="material-symbols-outlined mb-3 text-[40px] text-outline">verified</span>
        <p className="font-serif text-lg text-on-surface">Nenhuma homenagem pendente</p>
        <p className="mt-1 text-sm text-on-surface-variant">
          Novas mensagens aparecerão aqui antes de irem para o memorial.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tributes.map((tribute) => (
        <article
          key={tribute.id}
          className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
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
            <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
              Pendente
            </span>
          </div>

          <p
            className="break-words font-serif italic leading-7 text-on-surface"
            style={{ overflowWrap: 'anywhere' }}
          >
            "{tribute.message}"
          </p>

          <div className="mt-5 flex gap-3">
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
  );
}
