import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { canUse, getEffectivePlanServer } from '@/lib/plans';
import CapsulaClient from '@/components/capsules/CapsulaClient';
import LockedFeaturePreview from '@/components/ui/LockedFeaturePreview';

function CapsulePreview() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="relative overflow-hidden rounded-3xl border border-outline-variant/10 bg-surface-container-low p-10 lg:col-span-8">
        <span className="material-symbols-outlined absolute -right-8 -top-8 select-none text-[200px] text-primary/5">
          lock_clock
        </span>
        <div className="relative z-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container font-serif font-bold text-secondary">
              F
            </div>
            <div>
              <p className="font-semibold text-on-surface">Fridis</p>
              <p className="text-xs capitalize text-on-surface-variant">Cachorro</p>
            </div>
          </div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-secondary">
            CAPSULA SELADA
          </p>
          <h2 className="mb-8 font-serif text-3xl text-on-surface">
            Abrir no proximo aniversario
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              ['42', 'dias'],
              ['08', 'horas'],
              ['15', 'min'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl bg-surface-container-lowest px-4 py-5 text-center">
                <p className="font-serif text-4xl text-primary">{value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-on-surface-variant">Agendada para 12/08/2026</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:col-span-4">
        {[
          ['Primeira carta guardada', 'Selada'],
          ['Mensagem de saudade', 'Pronta para abrir'],
          ['Lembranca especial', 'Aberta'],
        ].map(([title, status]) => (
          <div key={title} className="flex items-start gap-4 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6">
            <span className="material-symbols-outlined mt-0.5 shrink-0 text-2xl text-secondary">lock</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-base text-on-surface">{title}</p>
              <p className="mt-0.5 text-xs text-on-surface-variant">{status}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60">
                Fridis
              </p>
            </div>
          </div>
        ))}
        <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-outline-variant py-4 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-base">add</span>
          Nova capsula
        </button>
      </div>
    </div>
  );
}

export default async function CapsulaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  const planId = await getEffectivePlanServer(user.id);

  if (!canUse(planId, 'capsules')) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-32">
        <div className="mb-12">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.3em] text-secondary">
            CAPSULA DO TEMPO
          </span>
          <h1 className="font-serif text-5xl text-on-surface">Mensagens para o Futuro</h1>
          <p className="mt-3 max-w-lg text-on-surface-variant">
            Escreva cartas seladas que so poderao ser lidas na data que voce escolher.
          </p>
        </div>
        <LockedFeaturePreview
          feature="Capsula do Tempo"
          description="Escreva cartas seladas para o futuro com os planos Premium e Eterno."
          minHeight="min-h-[620px]"
        >
          <CapsulePreview />
        </LockedFeaturePreview>
      </div>
    );
  }

  return <CapsulaClient />;
}
