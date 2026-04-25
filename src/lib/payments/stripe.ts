import { getStripe, stripePriceIds } from '@/lib/stripe';
import type { CheckoutRequest, CheckoutResult, PaymentGateway, PortalRequest } from './types';

function getPriceId(planId: CheckoutRequest['planId']) {
  const priceId = stripePriceIds[planId];
  if (!priceId) {
    throw new Error('Plano ainda nao configurado no Stripe.');
  }

  return priceId;
}

export const stripePaymentGateway: PaymentGateway = {
  id: 'stripe',

  async createCheckoutSession(input: CheckoutRequest): Promise<CheckoutResult> {
    const stripe = getStripe();
    const price = getPriceId(input.planId);
    const isSubscription = input.planId === 'premium';
    const metadata = {
      provider: 'stripe',
      profile_id: input.profileId,
      plan_id: input.planId,
    };

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [{ price, quantity: 1 }],
      customer: input.customerId ?? undefined,
      customer_email: input.customerId ? undefined : input.email ?? undefined,
      client_reference_id: input.profileId,
      metadata,
      subscription_data: isSubscription ? { metadata } : undefined,
      payment_intent_data: isSubscription ? undefined : { metadata },
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
