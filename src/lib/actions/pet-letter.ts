'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { LETTER_MIN_CHARS, LETTER_MAX_CHARS } from '@/lib/memorial/letter';

const letterSchema = z.object({
  content: z
    .string()
    .trim()
    .min(LETTER_MIN_CHARS, 'Escreva um pouco mais.')
    .max(LETTER_MAX_CHARS, `Máximo de ${LETTER_MAX_CHARS} caracteres.`),
  isPublic: z.boolean(),
});

// Retorna o pet (com slug) se o usuario logado for o dono; senao null.
async function ownedPet(petId: string, userId: string) {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: { owner_id: true, memorial_slug: true },
  });
  if (!pet || pet.owner_id !== userId) return null;
  return pet;
}

export async function saveLetter(
  petId: string,
  input: { content: string; isPublic: boolean },
): Promise<{ error?: string; success?: boolean }> {
  const session = await getServerSession();
  if (!session) return { error: 'Não autenticado' };
  const pet = await ownedPet(petId, session.user.id);
  if (!pet) return { error: 'Não autorizado' };

  const parsed = letterSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.pet.update({
    where: { id: petId },
    data: {
      letter_content: parsed.data.content,
      letter_is_public: parsed.data.isPublic,
      letter_updated_at: new Date(),
    },
  });

  revalidatePath(`/dashboard/pets/${pet.memorial_slug}/editar`);
  revalidatePath(`/memorial/${pet.memorial_slug}`);
  return { success: true };
}

export async function removeLetter(
  petId: string,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getServerSession();
  if (!session) return { error: 'Não autenticado' };
  const pet = await ownedPet(petId, session.user.id);
  if (!pet) return { error: 'Não autorizado' };

  await prisma.pet.update({
    where: { id: petId },
    data: { letter_content: null, letter_is_public: false, letter_updated_at: null },
  });

  revalidatePath(`/dashboard/pets/${pet.memorial_slug}/editar`);
  revalidatePath(`/memorial/${pet.memorial_slug}`);
  return { success: true };
}
