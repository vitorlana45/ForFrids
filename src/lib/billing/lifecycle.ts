export type SubSnapshot = { status: string; cancelAtPeriodEnd: boolean };
export type BillingTransition = 'farewell' | 'downgrade' | null;

const PREMIUM_STATUSES = ['active', 'trialing', 'past_due'];

export function detectTransition(prev: SubSnapshot | null, next: SubSnapshot): BillingTransition {
  const wasPremium = prev !== null && PREMIUM_STATUSES.includes(prev.status);
  const isPremium = PREMIUM_STATUSES.includes(next.status);

  if (wasPremium && !isPremium) return 'downgrade';
  if (isPremium && next.cancelAtPeriodEnd && !prev?.cancelAtPeriodEnd) return 'farewell';
  return null;
}
