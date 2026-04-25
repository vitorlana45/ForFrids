'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const entrySchema = z.object({
  pet_id: z.string().uuid(),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  date: z.string().min(1, 'Data é obrigatória'),
  photo_urls: z.array(z.string()).default([]),
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

  const { data, error } = await supabase
    .from('timeline_entries')
    .insert(parsed.data)
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
    .select('pet_id')
    .eq('id', entryId)
    .single();
  const entry = entryData as { pet_id: string } | null;
  if (!entry) return { error: 'Entrada não encontrada' };

  const pet = await getPetByEntry(supabase, entry.pet_id, user.id);
  if (!pet) return { error: 'Não autorizado' };

  const { error } = await supabase
    .from('timeline_entries')
    .update(input)
    .eq('id', entryId);
  if (error) return { error: error.message };

  revalidatePath(`/memorial/${pet.memorial_slug}`);
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
    .select('pet_id')
    .eq('id', entryId)
    .single();
  const entry = entryData as { pet_id: string } | null;
  if (!entry) return { error: 'Entrada não encontrada' };

  const pet = await getPetByEntry(supabase, entry.pet_id, user.id);
  if (!pet) return { error: 'Não autorizado' };

  const { error } = await supabase
    .from('timeline_entries')
    .delete()
    .eq('id', entryId);
  if (error) return { error: error.message };

  revalidatePath(`/memorial/${pet.memorial_slug}`);
  return { success: true };
}
