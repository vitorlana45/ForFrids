'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { AccessDeniedError, assertPetOwnerOnly } from '@/lib/security/access';

const inviteSchema = z.object({
  pet_id: z.string().uuid(),
  email: z.string().email().toLowerCase(),
});

export async function inviteCollaborator(input: z.infer<typeof inviteSchema>) {
  const session = await getServerSession();
  if (!session) return { error: 'Entre na sua conta.' };
  const userId = session.user.id;

  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await assertPetOwnerOnly(userId, parsed.data.pet_id);
  } catch (error) {
    if (error instanceof AccessDeniedError) return { error: error.message };
    throw error;
  }

  const profile = await prisma.profile.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, full_name: true, email: true },
  });
  if (!profile) {
    return { error: 'Esse e-mail ainda não tem conta no Eterno Pet. Peça para ele se cadastrar primeiro.' };
  }

  if (profile.id === userId) {
    return { error: 'Você já é o dono deste memorial.' };
  }

  try {
    await prisma.petCollaborator.create({
      data: {
        pet_id: parsed.data.pet_id,
        profile_id: profile.id,
        invited_by: userId,
        role: 'editor',
      },
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return { error: 'Esta pessoa já é colaboradora.' };
    }
    throw error;
  }

  const pet = await prisma.pet.findUnique({
    where: { id: parsed.data.pet_id },
    select: { memorial_slug: true },
  });
  if (pet) revalidatePath(`/dashboard/pets/${pet.memorial_slug}/editar`);

  return {
    success: true,
    data: {
      profile_id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
    },
  };
}

const removeSchema = z.object({
  pet_id: z.string().uuid(),
  profile_id: z.string().uuid(),
});

export async function removeCollaborator(input: z.infer<typeof removeSchema>) {
  const session = await getServerSession();
  if (!session) return { error: 'Entre na sua conta.' };
  const userId = session.user.id;

  const parsed = removeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await assertPetOwnerOnly(userId, parsed.data.pet_id);
  } catch (error) {
    if (error instanceof AccessDeniedError) return { error: error.message };
    throw error;
  }

  await prisma.petCollaborator.deleteMany({
    where: { pet_id: parsed.data.pet_id, profile_id: parsed.data.profile_id },
  });

  const pet = await prisma.pet.findUnique({
    where: { id: parsed.data.pet_id },
    select: { memorial_slug: true },
  });
  if (pet) revalidatePath(`/dashboard/pets/${pet.memorial_slug}/editar`);

  return { success: true };
}

export async function listCollaborators(petId: string) {
  const session = await getServerSession();
  if (!session) return { error: 'Entre na sua conta.' };

  try {
    await assertPetOwnerOnly(session.user.id, petId);
  } catch (error) {
    if (error instanceof AccessDeniedError) return { error: error.message };
    throw error;
  }

  const collaborators = await prisma.petCollaborator.findMany({
    where: { pet_id: petId },
    select: {
      id: true,
      profile_id: true,
      role: true,
      created_at: true,
      profile: { select: { full_name: true, email: true, avatar_url: true } },
    },
    orderBy: { created_at: 'asc' },
  });

  return { success: true, data: collaborators };
}
