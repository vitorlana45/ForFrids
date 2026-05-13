import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import type { TimeCapsule, Pet } from '@/types/database';

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  const petsData = await prisma.pet.findMany({
    where: { owner_id: userId },
    select: { id: true, name: true, species: true, avatar_url: true },
  });

  const pets = petsData as Pick<Pet, 'id' | 'name' | 'species' | 'avatar_url'>[];

  if (pets.length === 0) {
    return NextResponse.json({ capsules: [], pets: [] });
  }

  const petIds = pets.map(p => p.id);

  const capsulesData = await prisma.timeCapsule.findMany({
    where: { pet_id: { in: petIds } },
    orderBy: { open_at: 'asc' },
  });

  const capsules = capsulesData as unknown as TimeCapsule[];

  return NextResponse.json({ capsules, pets });
}
