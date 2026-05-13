import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export const metadata = { title: 'Bem-vindo ao Eterno Pet' };

export default async function OnboardingPage() {
  const session = await getServerSession();
  if (!session) redirect('/entrar');
  const userId = session.user.id;

  const count = await prisma.pet.count({ where: { owner_id: userId } });
  if (count > 0) redirect('/dashboard');

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { full_name: true },
  });

  const firstName = (profile?.full_name ?? 'Tutor').split(' ')[0];

  return <OnboardingWizard firstName={firstName} userId={userId} />;
}
