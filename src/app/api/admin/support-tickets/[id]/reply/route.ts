import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authorizeAdmin } from '@/lib/admin/auth';
import { EMAIL_FROM, getEmailClient } from '@/lib/email/client';
import { supportReplyEmail } from '@/lib/email/templates';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const schema = z.object({
  message: z.string().min(2, 'Mensagem muito curta'),
  status: z.enum(['in_progress', 'resolved']).optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const unauthorized = authorizeAdmin(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: { user: { select: { email: true, full_name: true } } },
  });
  if (!ticket) return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 });

  const sentTo = ticket.contact_email ?? ticket.user?.email ?? null;
  if (!sentTo) {
    return NextResponse.json({ error: 'Ticket sem email de contato' }, { status: 422 });
  }

  const name = ticket.user?.full_name?.split(' ')[0] ?? 'Tutor';
  const template = supportReplyEmail({ name, ticketTitle: ticket.title, replyMessage: parsed.data.message });

  try {
    await getEmailClient().emails.send({
      from: EMAIL_FROM,
      to: sentTo,
      subject: template.subject,
      html: template.html,
    });
  } catch (error) {
    log.error('[admin:tickets] falha ao enviar resposta', { ticketId: id, error });
    return NextResponse.json({ error: 'Falha ao enviar o email de resposta' }, { status: 502 });
  }

  const nextStatus = parsed.data.status ?? 'in_progress';
  const [reply, updated] = await prisma.$transaction([
    prisma.supportTicketReply.create({
      data: { ticket_id: id, message: parsed.data.message, sent_to: sentTo },
      select: { id: true, message: true, sent_to: true, created_at: true },
    }),
    prisma.supportTicket.update({
      where: { id },
      data: { status: nextStatus },
      select: { id: true, status: true },
    }),
  ]);

  return NextResponse.json({ reply, ticket: updated });
}
