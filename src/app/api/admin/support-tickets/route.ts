import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdmin } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['open', 'in_progress', 'resolved'] as const;

export async function GET(request: Request) {
  const unauthorized = authorizeAdmin(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const statusParam = url.searchParams.get('status');
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '50'), 200);
  const offset = Math.max(Number(url.searchParams.get('offset') ?? '0'), 0);

  const where: { status?: (typeof VALID_STATUSES)[number] } = {};
  if (statusParam && (VALID_STATUSES as readonly string[]).includes(statusParam)) {
    where.status = statusParam as (typeof VALID_STATUSES)[number];
  }

  const [items, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
      include: { user: { select: { id: true, email: true, full_name: true } } },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return NextResponse.json({ total, limit, offset, items });
}
