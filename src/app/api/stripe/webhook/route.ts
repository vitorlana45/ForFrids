import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import {
  syncStripeInvoice,
  upsertStripeSubscription,
} from '@/lib/billing/stripe-sync';
import { billingError, billingLog } from '@/lib/billing/debug';

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
      case 'invoice.payment_failed':
        billingLog('webhook.invoice', { eventId: event.id, type: event.type });
        await syncStripeInvoice(event.data.object as Stripe.Invoice);
        break;

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
