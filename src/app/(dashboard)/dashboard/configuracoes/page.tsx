import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import SettingsForm from '@/components/dashboard/SettingsForm';
import { getEffectivePlanServer } from '@/lib/plans';
import type { Profile } from '@/types/database';

export default async function ConfiguracoesPage() {
  const session = await getServerSession();
  if (!session) redirect('/entrar');
  const userId = session.user.id;

  const profileData = await prisma.profile.findUnique({ where: { id: userId } });
  const profile = profileData as unknown as Profile | null;
  if (!profile) redirect('/entrar');
  const effectivePlanId = await getEffectivePlanServer(userId);

  return (
    <div className="mx-auto max-w-[680px] px-6 pb-24 animate-fade-in">
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
