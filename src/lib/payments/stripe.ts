import { getStripe, stripePriceIds } from '@/lib/stripe';
import type { CheckoutRequest, CheckoutResult, PaymentGateway, PortalRequest } from './types';

function getPriceId(interval: CheckoutRequest['interval']) {
  const priceId = interval === 'year' ? stripePriceIds.premium_annual : stripePriceIds.premium_monthly;
  if (!priceId) {
    throw new Error('Plano ainda nao configurado no Stripe.');
  }

  return priceId;
}

export const stripePaymentGateway: PaymentGateway = {
  id: 'stripe',

  async createCheckoutSession(input: CheckoutRequest): Promise<CheckoutResult> {
    const stripe = getStripe();
    const price = getPriceId(input.interval);
    const metadata = {
      provider: 'stripe',
      profile_id: input.profileId,
      plan_id: input.planId,
      billing_interval: input.interval,
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price, quantity: 1 }],
      customer: input.customerId ?? undefined,
      customer_email: input.customerId ? undefined : input.email ?? undefined,
      client_reference_id: input.profileId,
      metadata,
      subscription_data: { metadata },
      success_url: `${input.siteUrl}/dashboard/planos?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${input.siteUrl}/dashboard/planos?cancelled=true`,
      allow_promotion_codes: true,
      locale: 'pt-BR',
    });

    if (!session.url) {
      throw new Error('Erro ao criar sessao de pagamento.');
    }

    return { url: session.url };
  },

  async createPortalSession(input: PortalRequest): Promise<CheckoutResult> {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: input.customerId,
      return_url: input.returnUrl,
      locale: 'pt-BR',
    });

    return { url: session.url };
  },
};
