'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/security/rate-limit';
import { verifyTurnstileToken } from '@/lib/security/turnstile';
import { getStripe } from '@/lib/stripe';

const ticketSchema = z.object({
  type: z.enum(['support', 'suggestion', 'bug']),
  title: z.string().min(3, 'Título muito curto').max(120, 'Título muito longo'),
  message: z.string().min(10, 'Descreva com mais detalhes').max(3000, 'Mensagem muito longa'),
  category: z.string().max(80).optional(),
  impact: z.string().max(120).optional(),
  steps: z.string().max(2500).optional(),
  expected_result: z.string().max(1200).optional(),
  actual_result: z.string().max(1200).optional(),
  contact_email: z.string().email('E-mail inválido').optional(),
  page_url: z.string().url().optional(),
  user_agent: z.string().max(500).optional(),
  image_url: z.string().url().optional(),
  turnstile_token: z.string().optional(),
});

type TicketInput = z.infer<typeof ticketSchema>;

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

export async function createSupportTicket(input: TicketInput): Promise<{ success?: boolean; id?: string; error?: string }> {
  const parsed = ticketSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const session = await getServerSession();
  const hdrs = await headers();
  const forwardedFor = hdrs.get('x-forwarded-for') ?? 'unknown';
  const ip = forwardedFor.split(',')[0]?.trim() || 'unknown';
  const key = session?.user.id ? `support:user:${session.user.id}` : `support:ip:${ip}`;
  const limit = rateLimit({ key, windowSec: 3600, max: 8 });
  if (!limit.allowed) {
    return { error: `Muitas solicitações. Tente novamente em ${Math.ceil((limit.retryAfterSec ?? 60) / 60)} min.` };
  }

  if (!session?.user.id) {
    if (!parsed.data.contact_email) {
      return { error: 'Informe um e-mail para contato.' };
    }
    const captchaOk = await verifyTurnstileToken(parsed.data.turnstile_token);
    if (!captchaOk) {
      return { error: 'Não foi possível validar o desafio anti-spam.' };
    }
  }

  const created = await prisma.supportTicket.create({
    data: {
      user_id: session?.user.id ?? null,
      type: parsed.data.type,
      title: parsed.data.title.trim(),
      message: parsed.data.message.trim(),
      category: parsed.data.category?.trim() || null,
      impact: parsed.data.impact?.trim() || null,
      steps: parsed.data.steps?.trim() || null,
      expected_result: parsed.data.expected_result?.trim() || null,
      actual_result: parsed.data.actual_result?.trim() || null,
      contact_email: parsed.data.contact_email?.trim() || session?.user.email || null,
      page_url: parsed.data.page_url || null,
      user_agent: parsed.data.user_agent || null,
      image_url: parsed.data.image_url || null,
    },
    select: { id: true },
  });

  return { success: true, id: created.id };
}

const donationSchema = z.object({
  amount_brl: z
    .number({ message: 'Informe um valor válido para doação.' })
    .int('Use um valor inteiro em reais.')
    .min(1, 'O valor mínimo da doação é R$ 1.')
    .max(1000, 'O valor máximo da doação é R$ 1000.'),
  email: z.string().email('E-mail inválido.').optional(),
});

export async function createDonationCheckoutSession(
  input: z.infer<typeof donationSchema>,
): Promise<{ url?: string; error?: string }> {
  const parsed = donationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const session = await getServerSession();
  const email = session?.user.email ?? parsed.data.email;
  if (!email) return { error: 'Informe um e-mail para continuar.' };

  try {
    const stripe = getStripe();
    const amount = parsed.data.amount_brl * 100;
    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'brl',
            unit_amount: amount,
            product_data: {
              name: 'Doação Eterno Pet',
              description: 'Apoio voluntário para manutenção da plataforma.',
            },
          },
        },
      ],
      success_url: `${siteUrl()}/dashboard?donation=success`,
      cancel_url: `${siteUrl()}/dashboard?donation=cancel`,
      metadata: {
        source: 'help_fab',
        type: 'donation',
      },
    });

    await prisma.supportTicket.create({
      data: {
        user_id: session?.user.id ?? null,
        type: 'donation_intent',
        title: 'Intenção de doação',
        message: `Checkout iniciado para doação de R$ ${parsed.data.amount_brl}.`,
        contact_email: email,
        page_url: `${siteUrl()}/dashboard`,
      },
    });

    return { url: checkout.url ?? undefined };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Não foi possível iniciar a doação.' };
  }
}
