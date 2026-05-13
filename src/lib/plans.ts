import type { PlanId } from '@/types/database';
import { prisma } from './prisma';

export type Feature = 'capsules' | 'chronicles' | 'qrcode';

const LIMITS: Record<PlanId, {
  maxPets: number;
  maxTimelineEntries: number;
  maxChroniclesPerPet: number;
  capsules: boolean;
  chronicles: boolean;
  qrcode: boolean;
}> = {
  free:     { maxPets: 1,        maxTimelineEntries: 10,       maxChroniclesPerPet: 0,        capsules: false, chronicles: false, qrcode: false },
  premium:  { maxPets: 5,        maxTimelineEntries: 50,        maxChroniclesPerPet: 20,       capsules: true,  chronicles: true,  qrcode: true  },
  lifetime: { maxPets: Infinity, maxTimelineEntries: Infinity,  maxChroniclesPerPet: Infinity, capsules: true,  chronicles: true,  qrcode: true  },
};

export function canUse(planId: PlanId, feature: Feature): boolean {
  return LIMITS[planId][feature];
}

export function maxPets(planId: PlanId): number {
  return LIMITS[planId].maxPets;
}

export function maxTimelineEntries(planId: PlanId): number {
  return LIMITS[planId].maxTimelineEntries;
}

export function maxChroniclesPerPet(planId: PlanId): number {
  return LIMITS[planId].maxChroniclesPerPet;
}

export function planLabel(planId: PlanId): string {
  const labels: Record<PlanId, string> = { free: 'Gratuito', premium: 'Premium', lifetime: 'Eterno' };
  return labels[planId];
}

export function strongestPaidPlan(
  subscriptions: { plan_id: PlanId; status: string }[],
): PlanId | null {
  const active = subscriptions.filter(s =>
    ['active', 'trialing', 'past_due', 'paid'].includes(s.status),
  );
  if (active.some(s => s.plan_id === 'lifetime')) return 'lifetime';
  if (active.some(s => s.plan_id === 'premium')) return 'premium';
  return null;
}

export async function getEffectivePlan(userId: string): Promise<PlanId> {
  const [profile, subscriptions] = await Promise.all([
    prisma.profile.findUnique({ where: { id: userId }, select: { plan_id: true } }),
    prisma.subscription.findMany({
      where: {
        profile_id: userId,
        status: { in: ['active', 'trialing', 'past_due', 'paid'] },
      },
      select: { plan_id: true, status: true },
      orderBy: { created_at: 'desc' },
    }),
  ]);

  const subscriptionPlan = strongestPaidPlan(
    subscriptions.map(s => ({ plan_id: s.plan_id as PlanId, status: s.status })),
  );
  if (subscriptionPlan) return subscriptionPlan;

  return (profile?.plan_id as PlanId | null) ?? 'free';
}

export const getEffectivePlanServer = getEffectivePlan;
