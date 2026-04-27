'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getEffectivePlanServer, maxTimelineEntries } from '@/lib/plans';
import { deletePublicObject, publicUrlMatchesKeyPrefix } from '@/lib/storage/client';
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

async function getPetByEntry(supabase: Awaited<ReturnType<typeof createClient>>, petId: string, userId: string) {
  const { data } = await supabase
    .from('pets')
    .select('owner_id, memorial_slug')
    .eq('id', petId)
    .single();
  const pet = data as { owner_id: string; memorial_slug: string } | null;
  if (!pet || pet.owner_id !== userId) return null;
  return pet;
}

export async function createTimelineEntry(
  input: EntryInput,
): Promise<{ data?: unknown; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const pet = await getPetByEntry(supabase, input.pet_id, user.id);
  if (!pet) return { error: 'Não autorizado' };

  const parsed = entrySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const planId = await getEffectivePlanServer(user.id);
  const { count } = await supabase
    .from('timeline_entries')
    .select('*', { count: 'exact', head: true })
    .eq('pet_id', input.pet_id);
  if ((count ?? 0) >= maxTimelineEntries(planId)) return { error: 'LIMIT_REACHED' };

  const { data, error } = await supabase
    .from('timeline_entries')
    .insert({ ...parsed.data, photo_urls: [] })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/memorial/${pet.memorial_slug}`);
  return { data };
}

export async function updateTimelineEntry(
  entryId: string,
  input: Partial<Omit<EntryInput, 'pet_id'>>,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const { data: entryData } = await supabase
    .from('timeline_entries')
    .select('pet_id, photo_urls')
    .eq('id', entryId)
    .single();
  const entry = entryData as { pet_id: string; photo_urls: string[] | null } | null;
  if (!entry) return { error: 'Entrada não encontrada' };

  const pet = await getPetByEntry(supabase, entry.pet_id, user.id);
  if (!pet) return { error: 'Não autorizado' };

  const parsed = updateEntrySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (parsed.data.photo_urls) {
    const existingPhotos = new Set(entry.photo_urls ?? []);
    const keyPrefix = `pets/${user.id}/${entry.pet_id}/timeline/${entryId}/`;
    const hasInvalidPhoto = parsed.data.photo_urls.some(url =>
      !existingPhotos.has(url) && !publicUrlMatchesKeyPrefix(url, keyPrefix)
    );

    if (hasInvalidPhoto) return { error: 'Imagem da linha do tempo invalida' };
  }

  const { error } = await supabase
    .from('timeline_entries')
    .update(parsed.data)
    .eq('id', entryId);
  if (error) return { error: error.message };

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const { data: entryData } = await supabase
    .from('timeline_entries')
    .select('pet_id, photo_urls')
    .eq('id', entryId)
    .single();
  const entry = entryData as { pet_id: string; photo_urls: string[] | null } | null;
  if (!entry) return { error: 'Entrada não encontrada' };

  const pet = await getPetByEntry(supabase, entry.pet_id, user.id);
  if (!pet) return { error: 'Não autorizado' };

  const { error } = await supabase
    .from('timeline_entries')
    .delete()
    .eq('id', entryId);
  if (error) return { error: error.message };

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
