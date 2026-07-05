'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth-server';
import { getEffectivePlanServer, maxTimelineEntries } from '@/lib/plans';
import { isPetEditable } from '@/lib/security/access';
import { deletePublicObject, publicUrlMatchesKeyPrefix } from '@/lib/storage/client';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { z } from 'zod';

const MAX_PHOTOS = 4;

const entrySchema = z.object({
  pet_id: z.string().uuid(),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  date: z.string().min(1, 'Data é obrigatória'),
  photo_urls: z.array(z.string()).max(MAX_PHOTOS).default([]),
});

const updateEntrySchema = entrySchema.omit({ pet_id: true }).partial().extend({
  photo_urls: z.array(z.string()).max(MAX_PHOTOS).optional(),
});

type EntryInput = z.infer<typeof entrySchema>;

async function getPetByEntry(petId: string, userId: string) {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: { owner_id: true, memorial_slug: true },
  });
  if (!pet || pet.owner_id !== userId) return null;
  return pet;
}

export async function createTimelineEntry(
  input: EntryInput,
): Promise<{ data?: unknown; error?: string }> {
  const session = await getServerSession();
  if (!session) return { error: 'Não autenticado' };
  const userId = session.user.id;

  const pet = await getPetByEntry(input.pet_id, userId);
  if (!pet) return { error: 'Não autorizado' };
  if (!(await isPetEditable(input.pet_id))) return { error: 'UPGRADE_REQUIRED' };

  const parsed = entrySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const planId = await getEffectivePlanServer(userId);
  const count = await prisma.timelineEntry.count({ where: { pet_id: input.pet_id } });
  if (count >= maxTimelineEntries(planId)) return { error: 'LIMIT_REACHED' };

  const data = await prisma.timelineEntry.create({
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
      photo_urls: [],
    },
  });

  revalidatePath(`/memorial/${pet.memorial_slug}`);
  return { data };
}

export async function updateTimelineEntry(
  entryId: string,
  input: Partial<Omit<EntryInput, 'pet_id'>>,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getServerSession();
  if (!session) return { error: 'Não autenticado' };
  const userId = session.user.id;

  const entry = await prisma.timelineEntry.findUnique({
    where: { id: entryId },
    select: { pet_id: true, photo_urls: true },
  });
  if (!entry) return { error: 'Entrada não encontrada' };

  const pet = await getPetByEntry(entry.pet_id, userId);
  if (!pet) return { error: 'Não autorizado' };
  if (!(await isPetEditable(entry.pet_id))) return { error: 'UPGRADE_REQUIRED' };

  const parsed = updateEntrySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (parsed.data.photo_urls) {
    const existingPhotos = new Set(entry.photo_urls ?? []);
    const keyPrefix = `pets/${userId}/${entry.pet_id}/timeline/${entryId}/`;
    const hasInvalidPhoto = parsed.data.photo_urls.some(url =>
      !existingPhotos.has(url) && !publicUrlMatchesKeyPrefix(url, keyPrefix)
    );
    if (hasInvalidPhoto) return { error: 'Imagem da linha do tempo invalida' };
  }

  await prisma.timelineEntry.update({
    where: { id: entryId },
    data: {
      ...parsed.data,
      date: parsed.data.date ? new Date(parsed.data.date) : undefined,
    },
  });

  revalidatePath(`/memorial/${pet.memorial_slug}`);
  revalidatePath(`/dashboard/pets/${pet.memorial_slug}/editar`);

  if (parsed.data.photo_urls) {
    const nextPhotos = new Set(parsed.data.photo_urls);
    const removedPhotos = (entry.photo_urls ?? []).filter(url => !nextPhotos.has(url));
    for (const url of removedPhotos) {
      const deleteResult = await deletePublicObject(url);
      if (deleteResult.error) {
        log.warn('[timeline:updateTimelineEntry] storage delete failed (non-blocking):', deleteResult.error);
      }
    }
  }

  return { success: true };
}

export async function deleteTimelineEntry(
  entryId: string,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getServerSession();
  if (!session) return { error: 'Não autenticado' };
  const userId = session.user.id;

  const entry = await prisma.timelineEntry.findUnique({
    where: { id: entryId },
    select: { pet_id: true, photo_urls: true },
  });
  if (!entry) return { error: 'Entrada não encontrada' };

  const pet = await getPetByEntry(entry.pet_id, userId);
  if (!pet) return { error: 'Não autorizado' };
  if (!(await isPetEditable(entry.pet_id))) return { error: 'UPGRADE_REQUIRED' };

  await prisma.timelineEntry.delete({ where: { id: entryId } });

  revalidatePath(`/memorial/${pet.memorial_slug}`);
  revalidatePath(`/dashboard/pets/${pet.memorial_slug}/editar`);

  for (const url of entry.photo_urls ?? []) {
    const deleteResult = await deletePublicObject(url);
    if (deleteResult.error) {
      log.warn('[timeline:deleteTimelineEntry] storage delete failed (non-blocking):', deleteResult.error);
    }
  }

  return { success: true };
}
