import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { canUse, getEffectivePlan } from '@/lib/plans';
import CapsulaClient from '@/components/capsules/CapsulaClient';
import UpgradePrompt from '@/components/ui/UpgradePrompt';

export default async function CapsulaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  const planId = await getEffectivePlan(supabase, user.id);

  if (!canUse(planId, 'capsules')) {
    return (
      <div className="mx-auto max-w-[800px] px-6 pt-32 pb-24">
        <div className="mb-12">
          <span className="text-[11px] font-bold tracking-[0.3em] text-secondary uppercase block mb-2">
            CÁPSULA DO TEMPO
          </span>
          <h1 className="font-serif text-5xl text-on-surface">Mensagens para o Futuro</h1>
        </div>
        <UpgradePrompt
          feature="Cápsula do Tempo"
          description="Escreva cartas seladas para o futuro com os planos Premium e Eterno."
        />
      </div>
    );
  }

  return <CapsulaClient />;
}
