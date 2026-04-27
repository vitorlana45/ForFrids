import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export const metadata = { title: 'Bem-vindo ao Eterno Pet' };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  const { count } = await supabase
    .from('pets')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id);

  if (count && count > 0) redirect('/dashboard');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const firstName = (profile?.full_name ?? 'Tutor').split(' ')[0];

  return <OnboardingWizard firstName={firstName} userId={user.id} />;
}
