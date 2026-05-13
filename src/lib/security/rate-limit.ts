const buckets = new Map<string, { count: number; expiresAt: number }>();

interface CheckInput {
  key: string;
  windowSec: number;
  max: number;
}

export function rateLimit({ key, windowSec, max }: CheckInput): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.expiresAt < now) {
    buckets.set(key, { count: 1, expiresAt: now + windowSec * 1000 });
    return { allowed: true };
  }

  if (existing.count >= max) {
    return { allowed: false, retryAfterSec: Math.ceil((existing.expiresAt - now) / 1000) };
  }

  existing.count += 1;
  return { allowed: true };
}

export function pruneRateLimit() {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.expiresAt < now) buckets.delete(key);
  }
}
