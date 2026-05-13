import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authorizeAdmin } from '@/lib/admin/auth';
import { memorialBlockedEmail } from '@/lib/email/templates';
import { emailFrom, getResend } from '@/lib/email/resend';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const schema = z.object({
  reason: z.string().min(5, 'Informe o motivo do bloqueio.').max(1000),
  blocked_by: z.string().uuid().optional(),
  notify: z.boolean().optional().default(true),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const unauthorized = authorizeAdmin(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const pet = await prisma.pet.findUnique({
    where: { id },
    include: { owner: { select: { email: true, full_name: true } } },
  });
  if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 });

  const updated = await prisma.pet.update({
    where: { id },
    data: {
      moderation_status: 'blocked',
      blocked_reason: parsed.data.reason,
      blocked_at: new Date(),
      blocked_by: parsed.data.blocked_by ?? null,
    },
  });

  if (parsed.data.notify && pet.owner?.email) {
    try {
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eternopet.com.br').replace(/\/$/, '');
      const supportEmail = process.env.RESEND_FROM_EMAIL ?? 'contato@eternopet.com.br';
      const tmpl = memorialBlockedEmail({
        tutorName: pet.owner.full_name?.split(' ')[0] ?? 'Tutor',
        petName: pet.name,
        reason: parsed.data.reason,
        dashboardUrl: `${siteUrl}/dashboard/pets/${pet.memorial_slug}/editar`,
        supportEmail,
      });
      const resend = getResend();
      await resend.emails.send({
        from: emailFrom,
        to: pet.owner.email,
        subject: tmpl.subject,
        html: tmpl.html,
      });
    } catch (error) {
      log.error('[admin:block] email falhou', error);
    }
  }

  return NextResponse.json({ ok: true, pet: { id: updated.id, moderation_status: updated.moderation_status } });
}
