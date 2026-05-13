'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

interface ToggleResult {
  liked?: boolean;
  count?: number;
  error?: string;
}

export async function toggleMemorialReaction(
  petId: string,
  memorialSlug: string,
): Promise<ToggleResult> {
  const session = await getServerSession();
  if (!session) {
    return { error: 'Entre para favoritar este memorial.' };
  }
  const userId = session.user.id;

  const pet = await prisma.pet.findFirst({
    where: { id: petId, memorial_slug: memorialSlug },
    select: { id: true, is_public: true },
  });
  if (!pet?.is_public) return { error: 'Memorial nao encontrado.' };

  const existing = await prisma.memorialReaction.findFirst({
    where: { pet_id: petId, user_id: userId, reaction_type: 'heart' },
    select: { id: true },
  });

  if (existing) {
    await prisma.memorialReaction.delete({ where: { id: existing.id } });
    const count = await prisma.memorialReaction.count({
      where: { pet_id: petId, reaction_type: 'heart' },
    });
    revalidatePath(`/memorial/${memorialSlug}`);
    revalidatePath('/dashboard');
    return { liked: false, count };
  }

  await prisma.memorialReaction.create({
    data: { pet_id: petId, user_id: userId, reaction_type: 'heart' },
  });
  const count = await prisma.memorialReaction.count({
    where: { pet_id: petId, reaction_type: 'heart' },
  });
  revalidatePath(`/memorial/${memorialSlug}`);
  revalidatePath('/dashboard');
  return { liked: true, count };
}
