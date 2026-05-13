'use server';

import { getServerSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { getPaymentGateway } from '@/lib/payments';
import { billingError, billingLog } from '@/lib/billing/debug';
import type { PaidPlanId } from '@/lib/payments';

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

async function getLatestCustomerId(profileId: string) {
  const sub = await prisma.subscription.findFirst({
    where: { profile_id: profileId },
    select: { provider_customer_id: true, stripe_customer_id: true },
    orderBy: { created_at: 'desc' },
  });
  const customerId = sub?.provider_customer_id ?? sub?.stripe_customer_id ?? null;
  billingLog('checkout.customer.lookup', { profileId, customerId, found: !!sub });
  return customerId;
}

export async function createCheckoutSession(
  planId: PaidPlanId,
): Promise<{ url?: string; error?: string }> {
  const session = await getServerSession();
  if (!session) return { error: 'Nao autenticado' };
  const user = session.user;

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
    const checkoutSession = await gateway.createCheckoutSession({
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
      hasUrl: !!checkoutSession.url,
    });
    return { url: checkoutSession.url };
  } catch (error) {
    billingError('checkout.create.error', error, { profileId: user.id, planId });
    return { error: error instanceof Error ? error.message : 'Erro ao iniciar pagamento.' };
  }
}

export async function createPortalSession(): Promise<{ url?: string; error?: string }> {
  const session = await getServerSession();
  if (!session) return { error: 'Nao autenticado' };
  const user = session.user;

  const customerId = await getLatestCustomerId(user.id);
  if (!customerId) {
    return { error: 'Nenhum cliente de pagamento encontrado para esta conta.' };
  }

  try {
    const gateway = getPaymentGateway();
    const portalSession = await gateway.createPortalSession({
      customerId,
      returnUrl: `${siteUrl()}/dashboard/configuracoes`,
    });
    return { url: portalSession.url };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Erro ao abrir portal de assinatura.' };
  }
}
