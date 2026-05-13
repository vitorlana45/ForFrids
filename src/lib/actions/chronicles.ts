'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth-server';
import { canUse, getEffectivePlanServer, maxChroniclesPerPet } from '@/lib/plans';
import { publicUrlMatchesKeyPrefix } from '@/lib/storage/client';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const optionalText = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  });

const chronicleSchema = z.object({
  pet_id: z.string().uuid(),
  title: z.string().min(3, 'Titulo muito curto').max(120, 'Titulo muito longo'),
  content: z.string().min(20, 'Conte um pouco mais sobre essa memoria'),
  excerpt: optionalText,
  cover_url: optionalText,
  event_date: optionalText,
  life_phase: optionalText,
  mood: optionalText,
  is_published: z.boolean().default(false),
});

const updateSchema = chronicleSchema.omit({ pet_id: true });

type ChronicleInput = z.input<typeof chronicleSchema>;
type ChronicleUpdateInput = z.input<typeof updateSchema>;

function estimateReadingMinutes(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

async function getOwnedPet(petId: string, userId: string) {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: { owner_id: true, memorial_slug: true },
  });
  if (!pet || pet.owner_id !== userId) return null;
  return pet;
}

async function getOwnedPetByChronicle(chronicleId: string, userId: string) {
  const chronicle = await prisma.chronicle.findUnique({
    where: { id: chronicleId },
    select: { pet_id: true, cover_url: true },
  });
  if (!chronicle) return null;
  const pet = await getOwnedPet(chronicle.pet_id, userId);
  if (!pet) return null;
  return { ...pet, pet_id: chronicle.pet_id, cover_url: chronicle.cover_url };
}

export async function createChronicle(
  input: ChronicleInput,
): Promise<{ data?: unknown; error?: string }> {
  const session = await getServerSession();
  if (!session) return { error: 'Nao autenticado' };
  const userId = session.user.id;

  const parsed = chronicleSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const planId = await getEffectivePlanServer(userId);
  if (!canUse(planId, 'chronicles')) return { error: 'UPGRADE_REQUIRED' };

  const pet = await getOwnedPet(parsed.data.pet_id, userId);
  if (!pet) return { error: 'Nao autorizado' };

  if (
    parsed.data.cover_url &&
    !publicUrlMatchesKeyPrefix(parsed.data.cover_url, `chronicles/${userId}/${parsed.data.pet_id}/`)
  ) {
    return { error: 'Imagem de capa invalida' };
  }

  const count = await prisma.chronicle.count({ where: { pet_id: parsed.data.pet_id } });
  if (count >= maxChroniclesPerPet(planId)) return { error: 'LIMIT_REACHED' };

  const data = await prisma.chronicle.create({
    data: {
      ...parsed.data,
      event_date: parsed.data.event_date ? new Date(parsed.data.event_date) : null,
      reading_minutes: estimateReadingMinutes(parsed.data.content),
    },
  });

  revalidatePath(`/dashboard/pets/${pet.memorial_slug}/diario`);
  revalidatePath(`/memorial/${pet.memorial_slug}`);
  return { data };
}

export async function updateChronicle(
  chronicleId: string,
  input: ChronicleUpdateInput,
): Promise<{ data?: unknown; error?: string }> {
  const session = await getServerSession();
  if (!session) return { error: 'Nao autenticado' };
  const userId = session.user.id;

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const planId = await getEffectivePlanServer(userId);
  if (!canUse(planId, 'chronicles')) return { error: 'UPGRADE_REQUIRED' };

  const pet = await getOwnedPetByChronicle(chronicleId, userId);
  if (!pet) return { error: 'Nao autorizado' };

  if (
    parsed.data.cover_url &&
    parsed.data.cover_url !== pet.cover_url &&
    !publicUrlMatchesKeyPrefix(parsed.data.cover_url, `chronicles/${userId}/${pet.pet_id}/`)
  ) {
    return { error: 'Imagem de capa invalida' };
  }

  const data = await prisma.chronicle.update({
    where: { id: chronicleId },
    data: {
      ...parsed.data,
      event_date: parsed.data.event_date ? new Date(parsed.data.event_date) : null,
      reading_minutes: estimateReadingMinutes(parsed.data.content),
    },
  });

  revalidatePath(`/dashboard/pets/${pet.memorial_slug}/diario`);
  revalidatePath(`/dashboard/pets/${pet.memorial_slug}/diario/${chronicleId}/editar`);
  revalidatePath(`/memorial/${pet.memorial_slug}`);
  return { data };
}

export async function deleteChronicle(
  chronicleId: string,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getServerSession();
  if (!session) return { error: 'Nao autenticado' };
  const userId = session.user.id;

  const pet = await getOwnedPetByChronicle(chronicleId, userId);
  if (!pet) return { error: 'Nao autorizado' };

  await prisma.chronicle.delete({ where: { id: chronicleId } });

  revalidatePath(`/dashboard/pets/${pet.memorial_slug}/diario`);
  revalidatePath(`/memorial/${pet.memorial_slug}`);
  return { success: true };
}
