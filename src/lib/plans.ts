import type { PlanId } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

export type Feature = 'capsules' | 'chronicles' | 'qrcode';

const LIMITS: Record<PlanId, { maxPets: number; capsules: boolean; chronicles: boolean; qrcode: boolean }> = {
  free:     { maxPets: 1,        capsules: false, chronicles: false, qrcode: false },
  premium:  { maxPets: 5,        capsules: true,  chronicles: true,  qrcode: true  },
  lifetime: { maxPets: Infinity, capsules: true,  chronicles: true,  qrcode: true  },
};

export function canUse(planId: PlanId, feature: Feature): boolean {
  return LIMITS[planId][feature];
}

export function maxPets(planId: PlanId): number {
  return LIMITS[planId].maxPets;
}

export function planLabel(planId: PlanId): string {
  const labels: Record<PlanId, string> = { free: 'Gratuito', premium: 'Premium', lifetime: 'Eterno' };
  return labels[planId];
}

export function strongestPaidPlan(
  subscriptions: { plan_id: PlanId; status: string }[],
): PlanId | null {
  const activeSubscriptions = subscriptions.filter(subscription =>
    ['active', 'trialing', 'past_due', 'paid'].includes(subscription.status),
  );

  if (activeSubscriptions.some(subscription => subscription.plan_id === 'lifetime')) {
    return 'lifetime';
  }

  if (activeSubscriptions.some(subscription => subscription.plan_id === 'premium')) {
    return 'premium';
  }

  return null;
}

export async function getEffectivePlan(
  supabase: SupabaseClient,
  userId: string,
): Promise<PlanId> {
  const [{ data: profileData }, { data: subscriptionsData }] = await Promise.all([
    supabase
      .from('profiles')
      .select('plan_id')
      .eq('id', userId)
      .single(),
    supabase
      .from('subscriptions')
      .select('plan_id, status')
      .eq('profile_id', userId)
      .in('status', ['active', 'trialing', 'past_due', 'paid'])
      .order('created_at', { ascending: false }),
  ]);

  const subscriptionPlan = strongestPaidPlan(
    (subscriptionsData as { plan_id: PlanId; status: string }[] | null) ?? [],
  );
  if (subscriptionPlan) return subscriptionPlan;

  return ((profileData as { plan_id?: PlanId } | null)?.plan_id) ?? 'free';
}

/**
 * Server-side plan resolution using the admin client.
 * Use this in server components and server actions to bypass RLS on the
 * subscriptions table and avoid read-after-write replication lag that can
 * occur when the webhook/sync writes via admin and the user client reads
 * from a replica.
 */
export async function getEffectivePlanServer(userId: string): Promise<PlanId> {
  const admin = createAdminClient();

  const [{ data: profileData }, { data: subscriptionsData }] = await Promise.all([
    admin.from('profiles').select('plan_id').eq('id', userId).single(),
    admin
      .from('subscriptions')
      .select('plan_id, status')
      .eq('profile_id', userId)
      .in('status', ['active', 'trialing', 'past_due', 'paid'])
      .order('created_at', { ascending: false }),
  ]);

  const subscriptionPlan = strongestPaidPlan(
    (subscriptionsData as { plan_id: PlanId; status: string }[] | null) ?? [],
  );
  if (subscriptionPlan) return subscriptionPlan;

  return ((profileData as { plan_id?: PlanId } | null)?.plan_id) ?? 'free';
}
