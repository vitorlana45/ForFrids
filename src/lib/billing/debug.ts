import { log } from '@/lib/logger';

export function billingLog(event: string, data?: Record<string, unknown>) {
  if (process.env.BILLING_DEBUG !== 'true') return;
  log.info('[billing]', event, data ?? {});
}

export function billingError(event: string, error: unknown, data?: Record<string, unknown>) {
  log.error('[billing]', event, {
    ...data,
    error: error instanceof Error ? error.message : error,
  });
}
