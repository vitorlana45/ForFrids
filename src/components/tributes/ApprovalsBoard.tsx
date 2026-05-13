'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, ExternalLink, X } from 'lucide-react';
import { approveTribute, rejectTribute } from '@/lib/actions/tributes';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/toast';
import type { Tribute } from '@/types/database';

export type PendingTribute = Tribute & {
  pet: {
    id: string;
    name: string;
    memorial_slug: string;
  };
};

export type ReviewedTribute = Tribute & {
  pet: {
    id: string;
    name: string;
    memorial_slug: string;
  };
};

interface Props {
  initialTributes: PendingTribute[];
  initialApprovedHistory: ReviewedTribute[];
}

export default function ApprovalsBoard({ initialTributes, initialApprovedHistory }: Props) {
  const confirm = useConfirm();
  const toast = useToast();
  const [tributes, setTributes] = useState(initialTributes);
  const [approvedHistory, setApprovedHistory] = useState(initialApprovedHistory);
  const [historyPetFilter, setHistoryPetFilter] = useState<'all' | string>('all');
  const [historyPeriodFilter, setHistoryPeriodFilter] = useState<'today' | '7d' | '30d'>('30d');
  const [expandedTribute, setExpandedTribute] = useState<ReviewedTribute | null>(null);
  const [mounted, setMounted] = useState(false);
  const [petFilterOpen, setPetFilterOpen] = useState(false);
  const petFilterRef = useRef<HTMLDivElement | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
    function handleOutsideClick(event: MouseEvent) {
      if (!petFilterRef.current) return;
      if (!petFilterRef.current.contains(event.target as Node)) {
        setPetFilterOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setPetFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, PendingTribute[]>();
    for (const tribute of tributes) {
      const key = tribute.pet.id;
      map.set(key, [...(map.get(key) ?? []), tribute]);
    }
    return Array.from(map.values());
  }, [tributes]);

  const historyPets = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const tribute of approvedHistory) {
      map.set(tribute.pet.id, { id: tribute.pet.id, name: tribute.pet.name });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [approvedHistory]);

  const filteredHistory = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysLimit = historyPeriodFilter === '7d' ? 7 : historyPeriodFilter === '30d' ? 30 : null;

    return approvedHistory.filter((tribute) => {
      if (historyPetFilter !== 'all' && tribute.pet.id !== historyPetFilter) return false;

      const reviewedAt = new Date(tribute.reviewed_at ?? tribute.created_at);
      if (historyPeriodFilter === 'today') {
        return reviewedAt >= startOfToday;
      }
      if (daysLimit) {
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - daysLimit);
        return reviewedAt >= cutoff;
      }
      return true;
    });
  }, [approvedHistory, historyPetFilter, historyPeriodFilter]);

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
      const tributeToReview = tributes.find(tribute => tribute.id === id);
      const result = action === 'approve'
        ? await approveTribute(id)
        : await rejectTribute(id);

      if (result.error) {
        toast.error('Erro ao processar a homenagem. Tente novamente.');
      } else {
        toast.success(action === 'approve' ? 'Homenagem aprovada.' : 'Homenagem rejeitada.');
        setTributes(prev => prev.filter(tribute => tribute.id !== id));
        if (action === 'approve' && tributeToReview) {
          setApprovedHistory(prev => [
            {
              ...tributeToReview,
              status: 'approved' as const,
              reviewed_at: new Date().toISOString(),
            },
            ...prev,
          ].slice(0, 40));
        }
      }
    });
  }

  return (
    <div className="space-y-8">
      {tributes.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-outline-variant bg-surface-container-low px-6 text-center">
          <span className="material-symbols-outlined mb-4 text-[64px] text-outline">verified</span>
          <h2 className="font-serif text-3xl text-on-surface">Tudo revisado</h2>
          <p className="mt-2 max-w-md text-on-surface-variant">
            Quando alguém enviar uma homenagem para seus memoriais, ela aparecerá aqui antes de ir ao ar.
          </p>
        </div>
      ) : grouped.map((group) => {
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

      <section className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-6">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">
            Histórico
          </p>
          <h2 className="font-serif text-2xl text-on-surface">Homenagens aprovadas</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Registro das últimas aprovações, com data e horário de revisão.
          </p>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">
              Filtrar por pet
            </label>
            <div className="relative" ref={petFilterRef}>
              <button
                type="button"
                onClick={() => setPetFilterOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-2xl border border-outline-variant/35 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface transition-colors hover:border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-expanded={petFilterOpen}
                aria-haspopup="listbox"
              >
                <span>
                  {historyPetFilter === 'all'
                    ? 'Todos os pets'
                    : (historyPets.find((pet) => pet.id === historyPetFilter)?.name ?? 'Todos os pets')}
                </span>
                <ChevronDown className={`h-4 w-4 text-on-surface-variant transition-transform ${petFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {petFilterOpen && (
                <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface shadow-2xl ring-1 ring-black/5">
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryPetFilter('all');
                      setPetFilterOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${historyPetFilter === 'all' ? 'bg-surface-container text-on-surface' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                  >
                    <span>Todos os pets</span>
                    {historyPetFilter === 'all' && <Check className="h-4 w-4 text-primary" />}
                  </button>
                  {historyPets.map((pet) => (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() => {
                        setHistoryPetFilter(pet.id);
                        setPetFilterOpen(false);
                      }}
                      className={`flex w-full items-center justify-between border-t border-outline-variant/20 px-4 py-3 text-left text-sm transition-colors ${historyPetFilter === pet.id ? 'bg-surface-container text-on-surface' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                    >
                      <span>{pet.name}</span>
                      {historyPetFilter === pet.id && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">Período</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'today', label: 'Hoje' },
                { value: '7d', label: '7 dias' },
                { value: '30d', label: '30 dias' },
              ].map((period) => (
                <button
                  key={period.value}
                  type="button"
                  onClick={() => setHistoryPeriodFilter(period.value as 'today' | '7d' | '30d')}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    historyPeriodFilter === period.value
                      ? 'bg-primary text-on-primary'
                      : 'border border-outline-variant/50 text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {approvedHistory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-lowest px-5 py-6 text-sm text-on-surface-variant">
            Você ainda não aprovou homenagens.
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-lowest px-5 py-6 text-sm text-on-surface-variant">
            Nenhuma homenagem aprovada para os filtros selecionados.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((tribute) => (
              <article
                key={tribute.id}
                className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-on-surface">
                    <span className="font-semibold">{tribute.author_name}</span> em{' '}
                    <span className="font-semibold">{tribute.pet.name}</span>
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Aprovada em {new Date(tribute.reviewed_at ?? tribute.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <p className="mt-2 text-sm italic text-on-surface-variant" style={{ overflowWrap: 'anywhere' }}>
                  "{tribute.message}"
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setExpandedTribute(tribute)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Ver completa
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {mounted && expandedTribute && createPortal(
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setExpandedTribute(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Mensagem completa da homenagem"
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-outline-variant/20 bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">Mensagem completa</p>
                <h3 className="font-serif text-2xl text-on-surface">{expandedTribute.author_name} em {expandedTribute.pet.name}</h3>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Aprovada em {new Date(expandedTribute.reviewed_at ?? expandedTribute.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpandedTribute(null)}
                className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-xl bg-surface-container-low px-4 py-4 text-sm leading-7 text-on-surface" style={{ overflowWrap: 'anywhere' }}>
              {expandedTribute.message}
            </p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
