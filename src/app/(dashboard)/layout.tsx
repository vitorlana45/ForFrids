import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import DashboardNav from '@/components/dashboard/DashboardNav';
import { getDashboardAlerts } from '@/lib/dashboard/alerts';
import type { Profile } from '@/types/database';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect('/entrar');
  const userId = session.user.id;

  const profileData = await prisma.profile.findUnique({ where: { id: userId } });
  const profile = profileData as unknown as Profile | null;

  const alerts = await getDashboardAlerts(userId);

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
