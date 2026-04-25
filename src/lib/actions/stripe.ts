'use server';

import { createClient } from '@/lib/supabase/server';
import { getPaymentGateway } from '@/lib/payments';
import { billingError, billingLog } from '@/lib/billing/debug';
import type { PaidPlanId } from '@/lib/payments';

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

async function getLatestCustomerId(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
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

  const customerId = subscription?.provider_customer_id ?? subscription?.stripe_customer_id ?? null;
  billingLog('checkout.customer.lookup', { profileId, customerId, found: !!subscription });
  return customerId;
}

export async function createCheckoutSession(
  planId: PaidPlanId,
): Promise<{ url?: string; error?: string }> {
  const { user } = await getCurrentUser();
  if (!user) return { error: 'Nao autenticado' };

  try {
    const gateway = getPaymentGateway();
    const customerId = await getLatestCustomerId(user.id);
    billingLog('checkout.create.start', {
      profileId: user.id,
      email: user.email,
      planId,
      provider: gateway.id,
      customerId,
      siteUrl: siteUrl(),
    });
    const session = await gateway.createCheckoutSession({
      planId,
      profileId: user.id,
      email: user.email,
      customerId,
      siteUrl: siteUrl(),
    });

    billingLog('checkout.create.success', {
      profileId: user.id,
      planId,
      provider: gateway.id,
      hasUrl: !!session.url,
    });
    return { url: session.url };
  } catch (error) {
    billingError('checkout.create.error', error, { profileId: user.id, planId });
    return { error: error instanceof Error ? error.message : 'Erro ao iniciar pagamento.' };
  }
}

export async function createPortalSession(): Promise<{ url?: string; error?: string }> {
  const { user } = await getCurrentUser();
  if (!user) return { error: 'Nao autenticado' };

  const customerId = await getLatestCustomerId(user.id);
  if (!customerId) {
    return { error: 'Nenhum cliente de pagamento encontrado para esta conta.' };
  }

  try {
    const gateway = getPaymentGateway();
    const session = await gateway.createPortalSession({
      customerId,
      returnUrl: `${siteUrl()}/dashboard/configuracoes`,
    });

    return { url: session.url };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Erro ao abrir portal de assinatura.' };
  }
}
