import type { PlanId } from '@/types/database';
import { prisma } from './prisma';

export type Feature = 'capsules' | 'chronicles' | 'qrcode' | 'presentation';

const LIMITS: Record<PlanId, {
  maxPets: number;
  maxTimelineEntries: number;
  maxChroniclesPerPet: number;
  capsules: boolean;
  chronicles: boolean;
  qrcode: boolean;
  presentation: boolean;
}> = {
  free:     { maxPets: 1,        maxTimelineEntries: 5,        maxChroniclesPerPet: 0,        capsules: false, chronicles: false, qrcode: false, presentation: false },
  premium:  { maxPets: 5,        maxTimelineEntries: 50,        maxChroniclesPerPet: 20,       capsules: true,  chronicles: true,  qrcode: true,  presentation: true  },
};

// Normaliza valores legados vindos do banco (ex.: 'lifetime') para o plano atual.
export function normalizePlan(value?: string | null): PlanId {
  if (value === 'premium' || value === 'lifetime') return 'premium';
  return 'free';
}

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
  const labels: Record<PlanId, string> = { free: 'Gratuito', premium: 'Premium' };
  return labels[planId];
}

export function strongestPaidPlan(
  subscriptions: { plan_id: PlanId; status: string }[],
): PlanId | null {
  const active = subscriptions.filter(s =>
    ['active', 'trialing', 'past_due', 'paid'].includes(s.status),
  );
  if (active.some(s => normalizePlan(s.plan_id) === 'premium')) return 'premium';
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
    subscriptions.map(s => ({ plan_id: normalizePlan(s.plan_id), status: s.status })),
  );
  if (subscriptionPlan) return subscriptionPlan;

  return normalizePlan(profile?.plan_id);
}

export const getEffectivePlanServer = getEffectivePlan;
