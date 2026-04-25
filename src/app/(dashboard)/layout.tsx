import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardNav from '@/components/dashboard/DashboardNav';
import type { Profile } from '@/types/database';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  const { data: profileData } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  const profile = profileData as Profile | null;

  return (
    <div className="min-h-screen bg-surface">
      <DashboardNav profile={profile} />
      <main>{children}</main>
    </div>
  );
}
