import Stripe from 'stripe';

let stripe: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }

  stripe ??= new Stripe(secretKey);
  return stripe;
}

export const stripePriceIds = {
  premium_monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY ?? process.env.STRIPE_PREMIUM_PRICE_ID,
  premium_annual: process.env.STRIPE_PRICE_PREMIUM_ANNUAL ?? process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID,
} as const;
