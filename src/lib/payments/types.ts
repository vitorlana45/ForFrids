import type { PlanId } from '@/types/database';

export type PaidPlanId = Extract<PlanId, 'premium'>;
export type PaymentProviderId = 'stripe';

// Intervalo de cobranca do Premium: mensal ou anual (mesmo tier, precos diferentes).
export type BillingInterval = 'month' | 'year';

export interface CheckoutRequest {
  planId: PaidPlanId;
  interval: BillingInterval;
  profileId: string;
  email?: string | null;
  customerId?: string | null;
  siteUrl: string;
}

export interface CheckoutResult {
  url: string;
}

export interface PortalRequest {
  customerId: string;
  returnUrl: string;
}

export interface PaymentGateway {
  id: PaymentProviderId;
  createCheckoutSession(input: CheckoutRequest): Promise<CheckoutResult>;
  createPortalSession(input: PortalRequest): Promise<CheckoutResult>;
}
