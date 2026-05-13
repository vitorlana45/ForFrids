import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authorizeAdmin } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

const schema = z.object({
  status: z.enum(['resolved_valid', 'resolved_invalid', 'duplicate']),
  note: z.string().max(2000).optional(),
  resolved_by: z.string().uuid().optional(),
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

  const report = await prisma.memorialReport.findUnique({
    where: { id },
    select: { id: true, pet_id: true },
  });
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.memorialReport.update({
    where: { id },
    data: {
      status: parsed.data.status,
      resolution_note: parsed.data.note ?? null,
      resolved_at: new Date(),
      resolved_by: parsed.data.resolved_by ?? null,
    },
  });

  // Se nao havia mais reports pendentes, devolve pet para "active" caso esteja flagged
  const stillPending = await prisma.memorialReport.count({
    where: { pet_id: report.pet_id, status: { in: ['pending', 'under_review'] } },
  });
  if (stillPending === 0) {
    await prisma.pet.updateMany({
      where: { id: report.pet_id, moderation_status: 'flagged' },
      data: { moderation_status: 'active' },
    });
  }

  return NextResponse.json(updated);
}
