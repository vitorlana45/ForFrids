import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';
import { billingError, billingLog } from '@/lib/billing/debug';
import type { PlanId } from '@/types/database';

type StripeRef = string | { id: string } | null | undefined;

function toIsoDate(timestamp?: number | null) {
  return timestamp ? new Date(timestamp * 1000).toISOString() : null;
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
  const admin = createAdminClient();
  const nextPlan = activePlan(status, planId);
  billingLog('profile.plan.update.start', { profileId, planId, status, nextPlan });

  if (nextPlan === 'free') {
    const { data: profileData } = await admin
      .from('profiles')
      .select('plan_id')
      .eq('id', profileId)
      .single();

    const currentPlan = (profileData as { plan_id?: PlanId } | null)?.plan_id;
    if (currentPlan === 'lifetime') {
      billingLog('profile.plan.update.skip_lifetime_downgrade', { profileId, planId, status });
      return;
    }
  }

  const { error } = await admin.from('profiles').update({ plan_id: nextPlan }).eq('id', profileId);
  if (error) {
    billingError('profile.plan.update.error', error, { profileId, planId, status, nextPlan });
    throw error;
  }
  billingLog('profile.plan.update.success', { profileId, planId, status, nextPlan });
}

export async function upsertStripeSubscription(
  subscription: Stripe.Subscription,
  checkoutSessionId?: string | null,
  fallback?: { profileId?: string | null; planId?: string | null },
) {
  const admin = createAdminClient();
  const metadata = subscription.metadata ?? {};
  let profileId: string | null | undefined = metadata.profile_id ?? fallback?.profileId;
  let planId = paidPlan(metadata.plan_id) ?? paidPlan(fallback?.planId) ?? 'premium';

  billingLog('subscription.upsert.start', {
    subscriptionId: subscription.id,
    status: subscription.status,
    metadataProfileId: metadata.profile_id,
    metadataPlanId: metadata.plan_id,
    fallbackProfileId: fallback?.profileId,
    fallbackPlanId: fallback?.planId,
    checkoutSessionId,
  });

  if (!profileId) {
    const { data: existingData } = await admin
      .from('subscriptions')
      .select('profile_id, plan_id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();

    const existing = existingData as { profile_id?: string | null; plan_id?: PlanId | null } | null;
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
    billingLog('subscription.upsert.skip_missing_profile', {
      subscriptionId: subscription.id,
      status: subscription.status,
      planId,
    });
    return null;
  }

  const row = subscription as Stripe.Subscription & {
    current_period_end?: number;
    canceled_at?: number | null;
  };
  const customerId = stripeCustomerId(subscription.customer);

  const { error } = await admin.from('subscriptions').upsert(
    {
      profile_id: profileId,
      provider: 'stripe',
      provider_customer_id: customerId,
      provider_subscription_id: subscription.id,
      provider_checkout_id: checkoutSessionId ?? undefined,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      plan_id: planId,
      status: subscription.status,
      current_period_end: toIsoDate(row.current_period_end),
      canceled_at: toIsoDate(row.canceled_at),
    },
    { onConflict: 'stripe_subscription_id' },
  );
  if (error) {
    billingError('subscription.upsert.error', error, {
      profileId,
      subscriptionId: subscription.id,
      planId,
      status: subscription.status,
      customerId,
      checkoutSessionId,
    });
    throw error;
  }
  billingLog('subscription.upsert.success', {
    profileId,
    subscriptionId: subscription.id,
    planId,
    status: subscription.status,
    effectivePlanId: activePlan(subscription.status, planId),
    customerId,
    checkoutSessionId,
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

  const admin = createAdminClient();
  const customerId = stripeCustomerId(session.customer);

  const payload = {
    profile_id: profileId,
    provider: 'stripe',
    provider_customer_id: customerId,
    provider_subscription_id: null,
    provider_checkout_id: session.id,
    stripe_customer_id: customerId,
    stripe_subscription_id: null,
    plan_id: 'lifetime' as const,
    status: session.payment_status === 'paid' ? 'paid' : session.payment_status,
    current_period_end: null,
    canceled_at: null,
  };

  const { data: existingData } = await admin
    .from('subscriptions')
    .select('id')
    .eq('provider', 'stripe')
    .eq('provider_checkout_id', session.id)
    .maybeSingle();

  const existing = existingData as { id: string } | null;

  if (existing) {
    const { error } = await admin.from('subscriptions').update(payload).eq('id', existing.id);
    if (error) {
      billingError('lifetime.checkout.update.error', error, { sessionId: session.id, profileId });
      throw error;
    }
  } else {
    const { error } = await admin.from('subscriptions').insert(payload);
    if (error) {
      billingError('lifetime.checkout.insert.error', error, { sessionId: session.id, profileId });
      throw error;
    }
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
    parent?: {
      subscription_details?: {
        subscription?: string | null;
      } | null;
    } | null;
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
  billingLog('checkout.sync.session_loaded', {
    sessionId,
    mode: session.mode,
    paymentStatus: session.payment_status,
    status: session.status,
    metadataProfileId: session.metadata?.profile_id,
    metadataPlanId: session.metadata?.plan_id,
    customer: typeof session.customer === 'string' ? session.customer : session.customer?.id,
    subscription: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
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
      billingLog('checkout.sync.subscription_result', {
        sessionId,
        synced: !!result,
        planId: result?.planId,
        effectivePlanId: result?.effectivePlanId,
        status: result?.status,
      });
      return { synced: !!result, planId: result?.effectivePlanId ?? null };
    }
  }

  if (session.mode === 'payment') {
    await recordStripeLifetimeCheckout(session);
    const planId = paidPlan(session.metadata?.plan_id);
    billingLog('checkout.sync.payment_result', { sessionId, synced: !!planId, planId });
    return { synced: !!planId, planId };
  }

  billingLog('checkout.sync.noop', { sessionId, mode: session.mode });
  return { synced: false, planId: null };
}

export async function syncLatestStripeSubscriptionForProfile(profileId: string) {
  billingLog('profile.reconcile.start', { profileId });
  const admin = createAdminClient();

  // Lifetime purchases are one-time payments (no Stripe subscription object).
  // If a paid lifetime record already exists in the DB, restore the profile directly.
  const { data: lifetimeRow } = await admin
    .from('subscriptions')
    .select('id')
    .eq('profile_id', profileId)
    .eq('plan_id', 'lifetime')
    .eq('status', 'paid')
    .maybeSingle();

  if (lifetimeRow) {
    billingLog('profile.reconcile.lifetime_restore', { profileId });
    await updateProfilePlan(profileId, 'lifetime', 'paid');
    return 'lifetime' as const;
  }

  const { data } = await admin
    .from('subscriptions')
    .select('provider_customer_id, stripe_customer_id')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const subscription = data as {
    provider_customer_id?: string | null;
    stripe_customer_id?: string | null;
  } | null;
  const customerId = subscription?.provider_customer_id ?? subscription?.stripe_customer_id;
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
  billingLog('profile.reconcile.candidates', {
    profileId,
    customerId,
    total: stripeSubscriptions.length,
    eligible: candidates.length,
    latestSubscriptionId: latest?.subscription.id,
    latestStatus: latest?.subscription.status,
    latestEffectivePlanId: latest?.effectivePlanId,
  });
  if (!latest) return null;

  const result = await upsertStripeSubscription(latest.subscription);
  billingLog('profile.reconcile.result', {
    profileId,
    customerId,
    planId: result?.planId,
    effectivePlanId: result?.effectivePlanId,
    status: result?.status,
  });
  return result?.effectivePlanId ?? null;
}
