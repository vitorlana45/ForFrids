import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdmin } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Params) {
  const unauthorized = authorizeAdmin(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const report = await prisma.memorialReport.findUnique({
    where: { id },
    include: {
      pet: {
        select: {
          id: true,
          name: true,
          species: true,
          memorial_slug: true,
          moderation_status: true,
          blocked_reason: true,
          blocked_at: true,
          owner: { select: { id: true, email: true, full_name: true } },
        },
      },
      reporter: { select: { id: true, email: true, full_name: true } },
    },
  });

  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(report);
}
