'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import {
  LETTER_MIN_CHARS,
  LETTER_MAX_CHARS,
  SIGNATURE_TEXT_MAX,
  isSafeSignaturePath,
} from '@/lib/memorial/letter';

const letterSchema = z.object({
  content: z
    .string()
    .trim()
    .min(LETTER_MIN_CHARS, 'Escreva um pouco mais.')
    .max(LETTER_MAX_CHARS, `Máximo de ${LETTER_MAX_CHARS} caracteres.`),
  isPublic: z.boolean(),
  signatureText: z.string().trim().max(SIGNATURE_TEXT_MAX, 'Assinatura muito longa.').nullish(),
  signatureDrawing: z.string().nullish(),
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
  input: {
    content: string;
    isPublic: boolean;
    signatureText?: string | null;
    signatureDrawing?: string | null;
  },
): Promise<{ error?: string; success?: boolean }> {
  const session = await getServerSession();
  if (!session) return { error: 'Não autenticado' };
  const pet = await ownedPet(petId, session.user.id);
  if (!pet) return { error: 'Não autorizado' };

  const parsed = letterSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const signatureText = parsed.data.signatureText?.trim() || null;
  const signatureDrawing = parsed.data.signatureDrawing?.trim() || null;
  if (signatureDrawing && !isSafeSignaturePath(signatureDrawing)) {
    return { error: 'Assinatura inválida.' };
  }

  await prisma.pet.update({
    where: { id: petId },
    data: {
      letter_content: parsed.data.content,
      letter_is_public: parsed.data.isPublic,
      letter_updated_at: new Date(),
      // Um modo de cada vez: se ha desenho, ignora o texto.
      letter_signature_text: signatureDrawing ? null : signatureText,
      letter_signature_drawing: signatureDrawing,
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
    data: {
      letter_content: null,
      letter_is_public: false,
      letter_updated_at: null,
      letter_signature_text: null,
      letter_signature_drawing: null,
    },
  });

  revalidatePath(`/dashboard/pets/${pet.memorial_slug}/editar`);
  revalidatePath(`/memorial/${pet.memorial_slug}`);
  return { success: true };
}
