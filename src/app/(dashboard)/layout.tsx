import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardNav from '@/components/dashboard/DashboardNav';
import { getDashboardAlerts } from '@/lib/dashboard/alerts';
import type { Profile } from '@/types/database';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  const { data: profileData } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  const profile = profileData as Profile | null;

  const alerts = await getDashboardAlerts(supabase, user.id);

  return (
    <div className="min-h-screen bg-surface">
      <DashboardNav
        profile={profile}
        pendingApprovalsCount={alerts.pendingApprovalsCount}
        readyCapsulesCount={alerts.readyCapsulesCount}
        memorialLikesCount={alerts.memorialLikesCount}
      />
      <main className="pt-32">{children}</main>
    </div>
  );
}
