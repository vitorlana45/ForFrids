import type { PlanId } from '@/types/database';
import { getEffectivePlanServer } from '@/lib/plans';
import { createAdminClient } from '@/lib/supabase/admin';

const MB = 1024 * 1024;

export type UploadScope = 'profile_avatar' | 'pet_avatar' | 'pet_timeline' | 'chronicle_cover';

const LIMITS: Record<PlanId, {
  maxUploadsPerMinute: number;
  maxUploadsPerDay: number;
  maxBytesPerDay: number;
}> = {
  free: {
    maxUploadsPerMinute: 8,
    maxUploadsPerDay: 20,
    maxBytesPerDay: 25 * MB,
  },
  premium: {
    maxUploadsPerMinute: 20,
    maxUploadsPerDay: 150,
    maxBytesPerDay: 250 * MB,
  },
  lifetime: {
    maxUploadsPerMinute: 30,
    maxUploadsPerDay: 300,
    maxBytesPerDay: 1024 * MB,
  },
};

export class UploadLimitExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadLimitExceededError';
  }
}

function toNumber(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  return 0;
}

export async function assertUploadAllowed(userId: string, bytes: number) {
  let minuteUsage = { uploads: 0, bytes: 0 };
  let dailyUsage = { uploads: 0, bytes: 0 };
  let planId: PlanId;

  try {
    [planId, minuteUsage, dailyUsage] = await Promise.all([
      getEffectivePlanServer(userId),
      getUsageSince(userId, new Date(Date.now() - 60 * 1000)),
      getUsageSince(userId, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    ]);
  } catch (err) {
    // upload_events table might not exist yet (migration pending) — allow upload
    console.warn('[upload-limits] quota check skipped (migration pending?):', (err as Error).message);
    return;
  }

  const limits = LIMITS[planId!];
  if (minuteUsage.uploads >= limits.maxUploadsPerMinute) {
    throw new UploadLimitExceededError('Muitas imagens enviadas em pouco tempo. Aguarde um minuto e tente novamente.');
  }

  if (dailyUsage.uploads >= limits.maxUploadsPerDay) {
    throw new UploadLimitExceededError('Limite diario de uploads atingido para o seu plano.');
  }

  if (dailyUsage.bytes + bytes > limits.maxBytesPerDay) {
    throw new UploadLimitExceededError('Limite diario de armazenamento atingido para o seu plano.');
  }
}

export async function recordUploadEvent(input: {
  userId: string;
  scope: UploadScope;
  objectKey: string;
  bytes: number;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from('upload_events').insert({
    user_id: input.userId,
    scope: input.scope,
    object_key: input.objectKey,
    bytes: input.bytes,
  });

  if (error) {
    // Log but do not throw — upload already succeeded, quota tracking is best-effort
    console.warn('[upload-limits] recordUploadEvent failed (migration pending?):', error.message);
  }
}

async function getUsageSince(userId: string, since: Date) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('upload_events')
    .select('bytes')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString());

  if (error) {
    throw error;
  }

  const rows = (data as { bytes: number | string | null }[] | null) ?? [];
  return {
    uploads: rows.length,
    bytes: rows.reduce((total, row) => total + toNumber(row.bytes), 0),
  };
}
