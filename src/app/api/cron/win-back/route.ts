import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getEffectivePlanServer } from '@/lib/plans';
import { sendBillingEmailOnce } from '@/lib/billing/emails';
import { winBackEmail } from '@/lib/email/templates';

const WIN_BACK_AFTER_DAYS = 7;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - WIN_BACK_AFTER_DAYS * 24 * 60 * 60 * 1000);

  // Âncora: email de downgrade enviado há 7+ dias, sem win-back posterior.
  const downgrades = await prisma.billingEmail.findMany({
    where: { type: 'downgrade', created_at: { lte: cutoff } },
    select: { id: true, profile_id: true, profile: { select: { full_name: true } } },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  let sent = 0;

  for (const downgrade of downgrades) {
    const plan = await getEffectivePlanServer(downgrade.profile_id);
    if (plan !== 'free') continue; // já voltou — não incomodar

    const template = winBackEmail({
      tutorName: downgrade.profile.full_name?.split(' ')[0] ?? 'Tutor',
      plansUrl: `${siteUrl}/dashboard/planos`,
    });
    const wasSent = await sendBillingEmailOnce({
      profileId: downgrade.profile_id,
      type: 'win_back',
      dedupeKey: `downgrade_${downgrade.id}`,
      subject: template.subject,
      html: template.html,
    });
    if (wasSent) sent += 1;
  }

  return NextResponse.json({ sent });
}
