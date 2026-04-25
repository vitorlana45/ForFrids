import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SettingsForm from '@/components/dashboard/SettingsForm';
import { getEffectivePlan } from '@/lib/plans';
import type { Profile } from '@/types/database';

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const profile = data as Profile | null;
  if (!profile) redirect('/entrar');
  const effectivePlanId = await getEffectivePlan(supabase, user.id);

  return (
    <div className="mx-auto min-h-screen max-w-[680px] px-6 pb-24 pt-32 animate-fade-in">
      <header className="mb-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary">
          Conta
        </p>
        <h1 className="font-serif text-5xl text-on-surface">Configurações</h1>
        <p className="mt-3 text-on-surface-variant">
          Gerencie seu perfil e segurança.
        </p>
      </header>

      <SettingsForm profile={profile} effectivePlanId={effectivePlanId} />
    </div>
  );
}
