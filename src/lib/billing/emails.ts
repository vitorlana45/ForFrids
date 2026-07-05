import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getEmailClient, EMAIL_FROM } from '@/lib/email/client';
import { billingError, billingLog } from '@/lib/billing/debug';

export type BillingEmailType = 'payment_failed' | 'farewell' | 'downgrade' | 'win_back';

// Registra a intenção ANTES de enviar: sob retry de webhook, o segundo insert
// viola o unique (type, dedupe_key) e o email não é reenviado.
export async function sendBillingEmailOnce(input: {
  profileId: string;
  type: BillingEmailType;
  dedupeKey: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  try {
    await prisma.billingEmail.create({
      data: { profile_id: input.profileId, type: input.type, dedupe_key: input.dedupeKey },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      billingLog('billing_email.dedupe_hit', { type: input.type, dedupeKey: input.dedupeKey });
      return false;
    }
    billingError('billing_email.claim_failed', error, { type: input.type });
    return false;
  }

  const profile = await prisma.profile.findUnique({
    where: { id: input.profileId },
    select: { email: true },
  });
  if (!profile?.email) return false;

  try {
    await getEmailClient().emails.send({
      from: EMAIL_FROM,
      to: profile.email,
      subject: input.subject,
      html: input.html,
    });
    billingLog('billing_email.sent', { type: input.type, profileId: input.profileId });
    return true;
  } catch (error) {
    billingError('billing_email.send_failed', error, { type: input.type, profileId: input.profileId });
    return false;
  }
}
