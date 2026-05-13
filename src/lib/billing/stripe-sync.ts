import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';
import { billingError, billingLog } from '@/lib/billing/debug';
import type { PlanId } from '@/types/database';

type StripeRef = string | { id: string } | null | undefined;

function toIsoDate(timestamp?: number | null) {
  return timestamp ? new Date(timestamp * 1000) : null;
}

function stripeCustomerId(customer: StripeRef) {
  if (!customer) return null;
  return typeof customer === 'string' ? customer : customer.id;
}

function paidPlan(planId?: string | null): Extract<PlanId, 'premium' | 'lifetime'> | null {
  return planId === 'premium' || planId === 'lifetime' ? planId : null;
}

function activePlan(status: string, planId: PlanId): PlanId {
  if (planId === 'lifetime') return 'lifetime';
  return ['active', 'trialing', 'past_due'].includes(status) ? planId : 'free';
}

export async function updateProfilePlan(profileId: string, planId: PlanId, status: string) {
  const nextPlan = activePlan(status, planId);
  billingLog('profile.plan.update.start', { profileId, planId, status, nextPlan });

  if (nextPlan === 'free') {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { plan_id: true },
    });
    if (profile?.plan_id === 'lifetime') {
      billingLog('profile.plan.update.skip_lifetime_downgrade', { profileId, planId, status });
      return;
    }
  }

  await prisma.profile.update({
    where: { id: profileId },
    data: { plan_id: nextPlan },
  });
  billingLog('profile.plan.update.success', { profileId, planId, status, nextPlan });
}

export async function upsertStripeSubscription(
  subscription: Stripe.Subscription,
  checkoutSessionId?: string | null,
  fallback?: { profileId?: string | null; planId?: string | null },
) {
  const metadata = subscription.metadata ?? {};
  let profileId: string | null | undefined = metadata.profile_id ?? fallback?.profileId;
  let planId = paidPlan(metadata.plan_id) ?? paidPlan(fallback?.planId) ?? 'premium';

  billingLog('subscription.upsert.start', {
    subscriptionId: subscription.id,
    status: subscription.status,
    metadataProfileId: metadata.profile_id,
    fallbackProfileId: fallback?.profileId,
    checkoutSessionId,
  });

  if (!profileId) {
    const existing = await prisma.subscription.findFirst({
      where: { stripe_subscription_id: subscription.id },
      select: { profile_id: true, plan_id: true },
    });
    profileId = existing?.profile_id ?? undefined;
    planId = paidPlan(metadata.plan_id) ?? paidPlan(fallback?.planId) ?? paidPlan(existing?.plan_id) ?? planId;
    billingLog('subscription.upsert.existing_lookup', {
      subscriptionId: subscription.id,
      profileId,
      planId,
      found: !!existing,
    });
  }

  if (!profileId) {
    billingLog('subscription.upsert.skip_missing_profile', { subscriptionId: subscription.id });
    return null;
  }

  const row = subscription as Stripe.Subscription & {
    current_period_end?: number;
    canceled_at?: number | null;
  };
  const customerId = stripeCustomerId(subscription.customer);

  await prisma.subscription.upsert({
    where: {
      provider_provider_subscription_id: {
        provider: 'stripe',
        provider_subscription_id: subscription.id,
      },
    },
    create: {
      profile_id: profileId,
      provider: 'stripe',
      provider_customer_id: customerId,
      provider_subscription_id: subscription.id,
      provider_checkout_id: checkoutSessionId ?? null,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      plan_id: planId,
      status: subscription.status,
      current_period_end: toIsoDate(row.current_period_end),
      canceled_at: toIsoDate(row.canceled_at),
    },
    update: {
      provider_customer_id: customerId,
      provider_checkout_id: checkoutSessionId ?? undefined,
      stripe_customer_id: customerId,
      plan_id: planId,
      status: subscription.status,
      current_period_end: toIsoDate(row.current_period_end),
      canceled_at: toIsoDate(row.canceled_at),
    },
  });

  billingLog('subscription.upsert.success', {
    profileId,
    subscriptionId: subscription.id,
    planId,
    status: subscription.status,
  });

  await updateProfilePlan(profileId, planId, subscription.status);
  return { planId, effectivePlanId: activePlan(subscription.status, planId), status: subscription.status };
}

export async function recordStripeLifetimeCheckout(session: Stripe.Checkout.Session) {
  const profileId = session.metadata?.profile_id;
  const planId = paidPlan(session.metadata?.plan_id);
  billingLog('lifetime.checkout.start', {
    sessionId: session.id,
    profileId,
    planId,
    paymentStatus: session.payment_status,
  });
  if (!profileId || planId !== 'lifetime') {
    billingLog('lifetime.checkout.skip', { sessionId: session.id, profileId, planId });
    return;
  }

  const customerId = stripeCustomerId(session.customer);
  const payload = {
    profile_id: profileId,
    provider: 'stripe',
    provider_customer_id: customerId,
    provider_subscription_id: null as string | null,
    provider_checkout_id: session.id,
    stripe_customer_id: customerId,
    stripe_subscription_id: null as string | null,
    plan_id: 'lifetime' as const,
    status: session.payment_status === 'paid' ? 'paid' : session.payment_status,
    current_period_end: null as Date | null,
    canceled_at: null as Date | null,
  };

  const existing = await prisma.subscription.findFirst({
    where: { provider: 'stripe', provider_checkout_id: session.id },
    select: { id: true },
  });

  if (existing) {
    await prisma.subscription.update({ where: { id: existing.id }, data: payload });
  } else {
    await prisma.subscription.create({ data: payload });
  }
  billingLog('lifetime.checkout.subscription_saved', { sessionId: session.id, profileId });

  if (session.payment_status === 'paid') {
    await updateProfilePlan(profileId, 'lifetime', 'paid');
  }
}

export async function syncStripeInvoice(invoice: Stripe.Invoice) {
  billingLog('invoice.sync.start', { invoiceId: invoice.id, status: invoice.status });
  const invoiceWithSubscription = invoice as Stripe.Invoice & {
    subscription?: StripeRef;
    parent?: { subscription_details?: { subscription?: string | null } | null } | null;
  };
  const subscriptionRef =
    invoiceWithSubscription.subscription ??
    invoiceWithSubscription.parent?.subscription_details?.subscription;
  const subscriptionId = typeof subscriptionRef === 'string'
    ? subscriptionRef
    : subscriptionRef?.id;

  if (!subscriptionId) {
    billingLog('invoice.sync.skip_missing_subscription', { invoiceId: invoice.id });
    return;
  }

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await upsertStripeSubscription(subscription);
}

export async function syncStripeCheckoutSession(sessionId: string, expectedProfileId?: string) {
  billingLog('checkout.sync.start', { sessionId, expectedProfileId });
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription'],
  });

  const profileId = session.metadata?.profile_id;
  if (!profileId || (expectedProfileId && profileId !== expectedProfileId)) {
    billingLog('checkout.sync.skip_profile_mismatch', { sessionId, profileId, expectedProfileId });
    return { synced: false, planId: null };
  }

  if (session.mode === 'subscription') {
    const subscription = typeof session.subscription === 'string'
      ? await stripe.subscriptions.retrieve(session.subscription)
      : session.subscription;

    if (subscription) {
      const result = await upsertStripeSubscription(subscription as Stripe.Subscription, session.id, {
        profileId,
        planId: session.metadata?.plan_id,
      });
      return { synced: !!result, planId: result?.effectivePlanId ?? null };
    }
  }

  if (session.mode === 'payment') {
    await recordStripeLifetimeCheckout(session);
    const planId = paidPlan(session.metadata?.plan_id);
    return { synced: !!planId, planId };
  }

  return { synced: false, planId: null };
}

export async function syncLatestStripeSubscriptionForProfile(profileId: string) {
  billingLog('profile.reconcile.start', { profileId });

  const lifetimeRow = await prisma.subscription.findFirst({
    where: { profile_id: profileId, plan_id: 'lifetime', status: 'paid' },
    select: { id: true },
  });

  if (lifetimeRow) {
    billingLog('profile.reconcile.lifetime_restore', { profileId });
    await updateProfilePlan(profileId, 'lifetime', 'paid');
    return 'lifetime' as const;
  }

  const sub = await prisma.subscription.findFirst({
    where: { profile_id: profileId },
    select: { provider_customer_id: true, stripe_customer_id: true },
    orderBy: { created_at: 'desc' },
  });

  const customerId = sub?.provider_customer_id ?? sub?.stripe_customer_id;
  if (!customerId) {
    billingLog('profile.reconcile.skip_missing_customer', { profileId });
    return null;
  }

  const stripe = getStripe();
  const { data: stripeSubscriptions } = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 10,
  });

  const candidates = stripeSubscriptions
    .filter(item => item.metadata?.profile_id === profileId)
    .map(item => ({
      subscription: item,
      planId: paidPlan(item.metadata?.plan_id) ?? 'premium',
      effectivePlanId: activePlan(item.status, paidPlan(item.metadata?.plan_id) ?? 'premium'),
    }))
    .filter(item => item.effectivePlanId !== 'free')
    .sort((a, b) => b.subscription.created - a.subscription.created);

  const latest = candidates[0];
  if (!latest) return null;

  const result = await upsertStripeSubscription(latest.subscription);
  return result?.effectivePlanId ?? null;
}
