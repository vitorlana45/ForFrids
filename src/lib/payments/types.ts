import type { PlanId } from '@/types/database';

export type PaidPlanId = Extract<PlanId, 'premium' | 'lifetime'>;
export type PaymentProviderId = 'stripe';

export interface CheckoutRequest {
  planId: PaidPlanId;
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
