import { prisma } from '@/lib/prisma';

export interface DashboardAlerts {
  pendingApprovalsCount: number;
  readyCapsulesCount: number;
  memorialLikesCount: number;
  total: number;
  billing: { pastDue: boolean; cancelsAt: string | null };
}

export async function getDashboardAlerts(userId: string): Promise<DashboardAlerts> {
  const pets = await prisma.pet.findMany({
    where: { owner_id: userId },
    select: { id: true },
  });

  const petIds = pets.map(p => p.id);

  const billingSub = await prisma.subscription.findFirst({
    where: { profile_id: userId, status: { in: ['active', 'trialing', 'past_due'] } },
    orderBy: { created_at: 'desc' },
    select: { status: true, cancel_at_period_end: true, current_period_end: true },
  });
  const billing = {
    pastDue: billingSub?.status === 'past_due',
    cancelsAt: billingSub?.cancel_at_period_end && billingSub.current_period_end
      ? billingSub.current_period_end.toISOString()
      : null,
  };

  if (petIds.length === 0) {
    return { pendingApprovalsCount: 0, readyCapsulesCount: 0, memorialLikesCount: 0, total: 0, billing };
  }

  const [pendingApprovalsCount, readyCapsulesCount, memorialLikesCount] = await Promise.all([
    prisma.tribute.count({
      where: { pet_id: { in: petIds }, status: 'pending' },
    }),
    prisma.timeCapsule.count({
      where: {
        pet_id: { in: petIds },
        opened: false,
        open_at: { lte: new Date() },
      },
    }),
    prisma.memorialReaction.count({
      where: { pet_id: { in: petIds }, reaction_type: 'heart' },
    }),
  ]);

  return {
    pendingApprovalsCount,
    readyCapsulesCount,
    memorialLikesCount,
    total: pendingApprovalsCount + readyCapsulesCount,
    billing,
  };
}
