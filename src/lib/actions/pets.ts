'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getEffectivePlanServer, maxPets } from '@/lib/plans';
import { deletePublicObject, publicUrlMatchesKeyPrefix } from '@/lib/storage/client';
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const parsed = petSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const planId = await getEffectivePlanServer(user.id);
  const { count } = await supabase
    .from('pets').select('*', { count: 'exact', head: true }).eq('owner_id', user.id);
  if ((count ?? 0) >= maxPets(planId)) return { error: 'UPGRADE_REQUIRED' };

  const slug = slugify(parsed.data.name) + '-' + Date.now();
  const { avatar_url: _ignoredAvatarUrl, ...createData } = parsed.data;

  const { data, error } = await supabase
    .from('pets')
    .insert({ ...createData, avatar_url: null, owner_id: user.id, memorial_slug: slug })
    .select('id, memorial_slug')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  const row = data as { id: string; memorial_slug: string };
  return { petId: row.id, slug: row.memorial_slug };
}

export async function updatePet(
  petId: string,
  input: PetInput,
): Promise<{ error?: string; success?: boolean }> {
  log.info('[pets:updatePet]', { petId, avatar_url: input.avatar_url });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const { data: existing } = await supabase
    .from('pets')
    .select('owner_id, memorial_slug, avatar_url')
    .eq('id', petId)
    .single();
  const pet = existing as { owner_id: string; memorial_slug: string; avatar_url: string | null } | null;
  if (!pet || pet.owner_id !== user.id) return { error: 'Não autorizado' };

  const parsed = petSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (
    parsed.data.avatar_url &&
    parsed.data.avatar_url !== pet.avatar_url &&
    !publicUrlMatchesKeyPrefix(parsed.data.avatar_url, `pets/${user.id}/${petId}/avatar-`)
  ) {
    return { error: 'Foto do pet invalida' };
  }

  const { error } = await supabase.from('pets').update(parsed.data).eq('id', petId);
  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/pets/${pet.memorial_slug}/editar`);
  revalidatePath(`/memorial/${pet.memorial_slug}`);

  const nextAvatarUrl = parsed.data.avatar_url ?? null;
  log.debug('[pets:updatePet] avatar check', { old: pet.avatar_url, next: nextAvatarUrl });
  if (pet.avatar_url && pet.avatar_url !== nextAvatarUrl) {
    const deleteResult = await deletePublicObject(pet.avatar_url);
    if (deleteResult.error) {
      log.warn('[pets:updatePet] storage delete failed (non-blocking):', deleteResult.error);
    }
  }

  return { success: true };
}
