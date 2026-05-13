import { prisma } from '@/lib/prisma';

export interface DashboardAlerts {
  pendingApprovalsCount: number;
  readyCapsulesCount: number;
  memorialLikesCount: number;
  total: number;
}

export async function getDashboardAlerts(userId: string): Promise<DashboardAlerts> {
  const pets = await prisma.pet.findMany({
    where: { owner_id: userId },
    select: { id: true },
  });

  const petIds = pets.map(p => p.id);

  if (petIds.length === 0) {
    return { pendingApprovalsCount: 0, readyCapsulesCount: 0, memorialLikesCount: 0, total: 0 };
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
  };
}
