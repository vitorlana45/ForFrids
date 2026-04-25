import { stripePaymentGateway } from './stripe';
import type { PaymentGateway } from './types';

export function getPaymentGateway(): PaymentGateway {
  const provider = process.env.PAYMENT_PROVIDER ?? 'stripe';

  if (provider === 'stripe') return stripePaymentGateway;

  throw new Error(`Payment provider not supported: ${provider}`);
}

export type { PaidPlanId, PaymentProviderId } from './types';
