import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authorizeAdmin } from '@/lib/admin/auth';

const schema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved']),
});

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const unauthorized = authorizeAdmin(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, full_name: true, plan_id: true } },
      replies: {
        orderBy: { created_at: 'desc' },
        select: { id: true, message: true, sent_to: true, created_at: true },
      },
    },
  });

  if (!ticket) return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 });

  return NextResponse.json({ ticket });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const unauthorized = authorizeAdmin(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: { status: parsed.data.status },
  }).catch(() => null);

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
