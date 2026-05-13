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

  const pet = await prisma.pet.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, email: true, full_name: true, plan_id: true } },
      reports: {
        orderBy: { created_at: 'desc' },
        take: 50,
        include: { reporter: { select: { email: true, full_name: true } } },
      },
      _count: {
        select: {
          tributes: true,
          chronicles: true,
          timeline_entries: true,
          reactions: true,
        },
      },
    },
  });

  if (!pet) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(pet);
}
