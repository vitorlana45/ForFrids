import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdmin } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const unauthorized = authorizeAdmin(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const pet = await prisma.pet.findUnique({ where: { id }, select: { id: true } });
  if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 });

  const pendingReports = await prisma.memorialReport.count({
    where: { pet_id: id, status: { in: ['pending', 'under_review'] } },
  });

  const updated = await prisma.pet.update({
    where: { id },
    data: {
      moderation_status: pendingReports > 0 ? 'flagged' : 'active',
      blocked_reason: null,
      blocked_at: null,
      blocked_by: null,
    },
  });

  return NextResponse.json({ ok: true, pet: { id: updated.id, moderation_status: updated.moderation_status } });
}
