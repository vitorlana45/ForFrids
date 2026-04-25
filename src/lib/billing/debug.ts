export function billingLog(event: string, data?: Record<string, unknown>) {
  if (process.env.BILLING_DEBUG !== 'true') return;
  console.log(`[billing] ${event}`, data ?? {});
}

export function billingError(event: string, error: unknown, data?: Record<string, unknown>) {
  console.error(`[billing] ${event}`, {
    ...data,
    error: error instanceof Error ? error.message : error,
  });
}
