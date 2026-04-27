import type { Feature } from '@/lib/plans';
import { canUse, getEffectivePlanServer } from '@/lib/plans';
import { createClient } from '@/lib/supabase/server';

export class AccessDeniedError extends Error {
  constructor(
    public code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'UPGRADE_REQUIRED',
    message: string,
  ) {
    super(message);
  }
}

export async function assertFeatureAccess(userId: string, feature: Feature) {
  const planId = await getEffectivePlanServer(userId);
  if (!canUse(planId, feature)) {
    throw new AccessDeniedError('UPGRADE_REQUIRED', 'Upgrade required');
  }
  return planId;
}

export async function assertOwnsPet(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  petId: string | undefined,
) {
  if (!petId) {
    throw new AccessDeniedError('FORBIDDEN', 'Forbidden');
  }

  const { data } = await supabase
    .from('pets')
    .select('owner_id')
    .eq('id', petId)
    .single();

  if ((data as { owner_id: string } | null)?.owner_id !== userId) {
    throw new AccessDeniedError('FORBIDDEN', 'Forbidden');
  }
}
