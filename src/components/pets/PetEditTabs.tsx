'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BarChart2, BookOpen, Clock3, ExternalLink, Heart, PawPrint, QrCode } from 'lucide-react';
import PetForm from './PetForm';
import TimelineManager from '@/components/timeline/TimelineManager';
import TributeModeration from '@/components/tributes/TributeModeration';
import type { Pet, TimelineEntry, Tribute } from '@/types/database';

type Tab = 'dados' | 'timeline' | 'diario' | 'homenagens' | 'engajamento';

interface Props {
  userId: string;
  pet: Pet;
  entries: TimelineEntry[];
  pendingTributes: Tribute[];
  likesCount: number;
  approvedTributesCount: number;
  chroniclesCount: number;
}

const TABS: { id: Tab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dados',        label: 'Dados',          Icon: PawPrint  },
  { id: 'timeline',    label: 'Linha do Tempo',  Icon: Clock3    },
  { id: 'diario',      label: 'Diário',          Icon: BookOpen  },
  { id: 'homenagens',  label: 'Homenagens',      Icon: Heart     },
  { id: 'engajamento', label: 'Engajamento',     Icon: BarChart2 },
];

export default function PetEditTabs({
  userId,
  pet,
  entries,
  pendingTributes,
  likesCount,
  approvedTributesCount,
  chroniclesCount,
}: Props) {
  const [active, setActive] = useState<Tab>('dados');

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-8 flex justify-center gap-1 overflow-x-auto rounded-2xl border border-outline-variant/20 bg-surface-container-low p-1.5">
        {TABS.map(({ id, label, Icon }) => {
          const badge = id === 'homenagens' && pendingTributes.length > 0
            ? pendingTributes.length : null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={`relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                active === id
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {badge !== null && (
                <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-[10px] font-bold leading-none text-on-secondary">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Dados ── */}
      {active === 'dados' && (
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Form */}
          <div className="lg:col-span-7">
            <PetForm userId={userId} pet={pet} />
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-5 lg:col-span-5">
            {/* Avatar card */}
            <div className="overflow-hidden rounded-3xl border border-outline-variant/20 bg-surface-container-low">
              <div className="relative aspect-square w-full overflow-hidden bg-surface-container">
                {pet.avatar_url ? (
                  <Image
                    src={pet.avatar_url}
                    alt={pet.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="material-symbols-outlined text-[80px] text-outline/40">
                      cruelty_free
                    </span>
                  </div>
                )}
              </div>
              <div className="px-6 py-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                  {pet.species}
                </p>
                <h3 className="font-serif text-2xl text-on-surface">{pet.name}</h3>
                {pet.birth_date && (
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Nasceu em {new Date(pet.birth_date).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </div>

            {/* Status card */}
            <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-on-surface">Memorial</p>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    {pet.is_public ? 'Público — qualquer pessoa pode acessar' : 'Privado — só você vê'}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  pet.is_public
                    ? 'bg-primary-fixed text-primary'
                    : 'bg-surface-container text-on-surface-variant'
                }`}>
                  {pet.is_public ? 'Público' : 'Privado'}
                </span>
              </div>

              {pet.is_public && (
                <div className="mt-4 rounded-xl bg-surface-container px-4 py-3">
                  <p className="mb-1 text-xs text-on-surface-variant">Link do memorial</p>
                  <p className="truncate font-mono text-xs text-on-surface">
                    /memorial/{pet.memorial_slug}
                  </p>
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low px-6 py-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant/60">
                Ações rápidas
              </p>
              <div className="space-y-1">
                {pet.is_public && (
                  <Link
                    href={`/memorial/${pet.memorial_slug}`}
                    target="_blank"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    Ver memorial público
                  </Link>
                )}
                <Link
                  href="/dashboard/qrcode"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                >
                  <QrCode className="h-4 w-4 shrink-0" />
                  Gerar QR Code
                </Link>
                <Link
                  href={`/dashboard/pets/${pet.memorial_slug}/diario/novo`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                >
                  <BookOpen className="h-4 w-4 shrink-0" />
                  Escrever crônica
                </Link>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ── Linha do Tempo ── */}
      {active === 'timeline' && (
        <div>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                {entries.length} {entries.length === 1 ? 'momento registrado' : 'momentos registrados'}
              </p>
              <h2 className="font-serif text-3xl text-on-surface">Linha do Tempo</h2>
              <p className="mt-1 text-on-surface-variant">
                Registre os momentos marcantes da vida de {pet.name}.
              </p>
            </div>
          </div>
          <TimelineManager petId={pet.id} userId={userId} initialEntries={entries} />
        </div>
      )}

      {/* ── Diário ── */}
      {active === 'diario' && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main card */}
          <div className="lg:col-span-8">
            <div className="flex min-h-[420px] flex-col justify-between overflow-hidden rounded-3xl border border-outline-variant/20 bg-surface-container-low p-10">
              <div>
                <span className="material-symbols-outlined mb-6 block text-[56px] text-primary/30">
                  menu_book
                </span>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">
                  Diário de Crônicas
                </p>
                <h2 className="mt-2 font-serif text-4xl text-on-surface">
                  {chroniclesCount === 0
                    ? 'Ainda não há crônicas'
                    : `${chroniclesCount} ${chroniclesCount === 1 ? 'crônica escrita' : 'crônicas escritas'}`}
                </h2>
                <p className="mt-4 max-w-md text-on-surface-variant">
                  Transforme lembranças em histórias cuidadas — com contexto, data e sentimento.
                  Cada crônica é um pedaço da vida de {pet.name} guardado para sempre.
                </p>
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  href={`/dashboard/pets/${pet.memorial_slug}/diario/novo`}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim"
                >
                  <BookOpen className="h-4 w-4" />
                  Escrever crônica
                </Link>
                {chroniclesCount > 0 && (
                  <Link
                    href={`/dashboard/pets/${pet.memorial_slug}/diario`}
                    className="inline-flex items-center gap-2 rounded-full border border-outline-variant/40 px-6 py-3 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container"
                  >
                    Ver todas
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Stats sidebar */}
          <div className="flex flex-col gap-5 lg:col-span-4">
            <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-6">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-secondary">Total</p>
              <p className="font-serif text-5xl text-on-surface">{chroniclesCount}</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {chroniclesCount === 1 ? 'crônica' : 'crônicas'} no diário
              </p>
            </div>

            <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant/60">
                Fases da vida
              </p>
              <div className="space-y-2">
                {['Infância', 'Maturidade', 'Velhice', 'Despedida', 'Depois da saudade'].map(phase => (
                  <div key={phase} className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                    {phase}
                  </div>
                ))}
              </div>
              <Link
                href={`/dashboard/pets/${pet.memorial_slug}/diario`}
                className="mt-4 block text-xs font-semibold text-primary hover:underline"
              >
                Ver com filtros →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Homenagens ── */}
      {active === 'homenagens' && (
        <div>
          {/* Stats row */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
              <p className="font-serif text-3xl text-on-surface">{pendingTributes.length}</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {pendingTributes.length === 1 ? 'pendente' : 'pendentes'}
              </p>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
              <p className="font-serif text-3xl text-on-surface">{approvedTributesCount}</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {approvedTributesCount === 1 ? 'aprovada' : 'aprovadas'}
              </p>
            </div>
            <div className="col-span-2 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5 sm:col-span-1">
              <p className="font-serif text-3xl text-on-surface">
                {pendingTributes.length + approvedTributesCount}
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">total recebidas</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="font-serif text-2xl text-on-surface">Para aprovar</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Revise mensagens antes que apareçam no memorial público.
            </p>
          </div>
          <TributeModeration initialTributes={pendingTributes} />
        </div>
      )}

      {/* ── Engajamento ── */}
      {active === 'engajamento' && (
        <div className="space-y-6">
          {/* Hero metric */}
          <div className="relative overflow-hidden rounded-3xl border border-outline-variant/20 bg-surface-container-low px-10 py-10">
            <span className="absolute -right-6 -top-6 font-serif text-[160px] font-bold leading-none text-primary/5 select-none">
              {likesCount + approvedTributesCount + chroniclesCount}
            </span>
            <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-secondary">
              Resumo geral
            </p>
            <p className="relative mt-2 font-serif text-3xl text-on-surface">
              {pet.name} recebeu carinho de muitas pessoas.
            </p>
            {pet.is_public && (
              <Link
                href={`/memorial/${pet.memorial_slug}`}
                target="_blank"
                className="relative mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4"
              >
                <ExternalLink className="h-4 w-4" />
                Ver memorial público
              </Link>
            )}
          </div>

          {/* Metrics grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-7">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-400 dark:bg-red-900/20 dark:text-red-300">
                <Heart className="h-6 w-6" />
              </div>
              <p className="font-serif text-4xl text-on-surface">{likesCount}</p>
              <p className="mt-1 text-sm font-semibold text-on-surface">
                {likesCount === 1 ? 'Curtida' : 'Curtidas'}
              </p>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                Visitantes que marcaram como favorito
              </p>
            </div>

            <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-7">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                <span className="material-symbols-outlined text-xl">format_quote</span>
              </div>
              <p className="font-serif text-4xl text-on-surface">{approvedTributesCount}</p>
              <p className="mt-1 text-sm font-semibold text-on-surface">
                {approvedTributesCount === 1 ? 'Homenagem' : 'Homenagens'}
              </p>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                Mensagens publicadas no memorial
              </p>
            </div>

            <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-7">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
                <BookOpen className="h-6 w-6" />
              </div>
              <p className="font-serif text-4xl text-on-surface">{chroniclesCount}</p>
              <p className="mt-1 text-sm font-semibold text-on-surface">
                {chroniclesCount === 1 ? 'Crônica' : 'Crônicas'}
              </p>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                Histórias escritas no diário
              </p>
            </div>
          </div>

          {/* Coming soon */}
          <div className="flex items-center gap-4 rounded-3xl border border-dashed border-outline-variant/40 px-8 py-6 text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl text-outline">insert_chart</span>
            <div>
              <p className="text-sm font-semibold text-on-surface">Em breve: visualizações e scans de QR</p>
              <p className="text-xs">Gráfico de acessos ao memorial ao longo do tempo.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
