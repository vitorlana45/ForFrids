import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import {
  syncStripeInvoice,
  upsertStripeSubscription,
} from '@/lib/billing/stripe-sync';
import { billingError, billingLog } from '@/lib/billing/debug';
import { prisma } from '@/lib/prisma';
import { sendBillingEmailOnce } from '@/lib/billing/emails';
import { paymentFailedEmail } from '@/lib/email/templates';

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    billingError('webhook.missing_secret', 'Missing webhook secret');
    return NextResponse.json({ error: 'Missing webhook secret' }, { status: 500 });
  }

  const stripe = getStripe();
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    billingError('webhook.missing_signature', 'Missing signature');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    billingError('webhook.invalid_signature', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid webhook' },
      { status: 400 },
    );
  }

  billingLog('webhook.received', { eventId: event.id, type: event.type });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        billingLog('webhook.checkout.completed', {
          eventId: event.id,
          sessionId: session.id,
          mode: session.mode,
          paymentStatus: session.payment_status,
          metadataProfileId: session.metadata?.profile_id,
          metadataPlanId: session.metadata?.plan_id,
          customer: typeof session.customer === 'string' ? session.customer : session.customer?.id,
          subscription: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
        });

        if (session.mode === 'subscription' && typeof session.subscription === 'string') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await upsertStripeSubscription(subscription, session.id, {
            profileId: session.metadata?.profile_id,
            planId: session.metadata?.plan_id,
          });
        }

        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        billingLog('webhook.subscription.changed', {
          eventId: event.id,
          subscriptionId: subscription.id,
          status: subscription.status,
          metadataProfileId: subscription.metadata?.profile_id,
          metadataPlanId: subscription.metadata?.plan_id,
        });
        await upsertStripeSubscription(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        billingLog('webhook.subscription.deleted', {
          eventId: event.id,
          subscriptionId: subscription.id,
          status: subscription.status,
        });
        await upsertStripeSubscription(subscription);
        break;
      }

      case 'invoice.payment_succeeded':
        billingLog('webhook.invoice', { eventId: event.id, type: event.type });
        await syncStripeInvoice(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        billingLog('webhook.invoice', { eventId: event.id, type: event.type });
        await syncStripeInvoice(invoice);
        try {
          await notifyPaymentFailed(invoice);
        } catch (error) {
          billingError('webhook.notify_payment_failed.error', error, {
            eventId: event.id,
            type: event.type,
          });
        }
        break;
      }

      default:
        billingLog('webhook.ignored', { eventId: event.id, type: event.type });
        break;
    }
  } catch (error) {
    billingError('webhook.handler.error', error, { eventId: event.id, type: event.type });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook handler failed' },
      { status: 500 },
    );
  }

  billingLog('webhook.processed', { eventId: event.id, type: event.type });
  return NextResponse.json({ received: true });
}

async function notifyPaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId || !invoice.id) return;

  const sub = await prisma.subscription.findFirst({
    where: { provider: 'stripe', provider_customer_id: customerId },
    select: { profile_id: true, profile: { select: { full_name: true } } },
    orderBy: { created_at: 'desc' },
  });
  if (!sub) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const template = paymentFailedEmail({
    tutorName: sub.profile.full_name?.split(' ')[0] ?? 'Tutor',
    plansUrl: `${siteUrl}/dashboard/planos`,
  });
  await sendBillingEmailOnce({
    profileId: sub.profile_id,
    type: 'payment_failed',
    dedupeKey: `invoice_${invoice.id}`,
    subject: template.subject,
    html: template.html,
  });
}
