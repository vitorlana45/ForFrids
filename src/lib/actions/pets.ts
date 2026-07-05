'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth-server';
import { getEffectivePlanServer, maxPets } from '@/lib/plans';
import { isPetEditable } from '@/lib/security/access';
import { deletePublicObject, publicUrlMatchesKeyPrefix } from '@/lib/storage/client';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { slugify } from '@/lib/utils';

const petSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  species: z.string().min(1, 'Espécie é obrigatória'),
  breed: z.string().trim().max(80, 'Raca muito longa').optional(),
  birth_date: z.string().optional(),
  death_date: z.string().optional(),
  tribute_text: z.string().trim().max(400, 'Maximo de 400 caracteres').optional(),
  is_public: z.boolean(),
  avatar_url: z.string().nullable().optional(),
});

type PetInput = z.infer<typeof petSchema>;

export async function createPet(
  input: PetInput,
): Promise<{ petId?: string; slug?: string; error?: string }> {
  const session = await getServerSession();
  if (!session) return { error: 'Não autenticado' };
  const userId = session.user.id;

  const parsed = petSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const planId = await getEffectivePlanServer(userId);
  const count = await prisma.pet.count({ where: { owner_id: userId } });
  if (count >= maxPets(planId)) return { error: 'UPGRADE_REQUIRED' };

  const slug = slugify(parsed.data.name) + '-' + Date.now();
  const { avatar_url: _ignored, ...createData } = parsed.data;

  const pet = await prisma.pet.create({
    data: {
      ...createData,
      birth_date: createData.birth_date ? new Date(createData.birth_date) : null,
      death_date: createData.death_date ? new Date(createData.death_date) : null,
      avatar_url: null,
      owner_id: userId,
      memorial_slug: slug,
    },
    select: { id: true, memorial_slug: true },
  });

  revalidatePath('/dashboard');
  return { petId: pet.id, slug: pet.memorial_slug };
}

export async function updatePet(
  petId: string,
  input: PetInput,
): Promise<{ error?: string; success?: boolean }> {
  log.info('[pets:updatePet]', { petId, avatar_url: input.avatar_url });
  const session = await getServerSession();
  if (!session) return { error: 'Não autenticado' };
  const userId = session.user.id;

  const existing = await prisma.pet.findUnique({
    where: { id: petId },
    select: { owner_id: true, memorial_slug: true, avatar_url: true },
  });
  if (!existing || existing.owner_id !== userId) return { error: 'Não autorizado' };
  if (!(await isPetEditable(petId))) return { error: 'UPGRADE_REQUIRED' };

  const parsed = petSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (
    parsed.data.avatar_url &&
    parsed.data.avatar_url !== existing.avatar_url &&
    !publicUrlMatchesKeyPrefix(parsed.data.avatar_url, `pets/${userId}/${petId}/avatar-`)
  ) {
    return { error: 'Foto do pet invalida' };
  }

  await prisma.pet.update({
    where: { id: petId },
    data: {
      ...parsed.data,
      birth_date: parsed.data.birth_date ? new Date(parsed.data.birth_date) : null,
      death_date: parsed.data.death_date ? new Date(parsed.data.death_date) : null,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/pets/${existing.memorial_slug}/editar`);
  revalidatePath(`/memorial/${existing.memorial_slug}`);

  const nextAvatarUrl = parsed.data.avatar_url ?? null;
  if (existing.avatar_url && existing.avatar_url !== nextAvatarUrl) {
    const deleteResult = await deletePublicObject(existing.avatar_url);
    if (deleteResult.error) {
      log.warn('[pets:updatePet] storage delete failed (non-blocking):', deleteResult.error);
    }
  }

  return { success: true };
}
