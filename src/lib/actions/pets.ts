'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getEffectivePlanServer, maxPets } from '@/lib/plans';
import { z } from 'zod';
import { slugify } from '@/lib/utils';

const petSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  species: z.string().min(1, 'Espécie é obrigatória'),
  breed: z.string().optional(),
  birth_date: z.string().optional(),
  death_date: z.string().optional(),
  tribute_text: z.string().optional(),
  is_public: z.boolean(),
  avatar_url: z.string().optional(),
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

  const { data, error } = await supabase
    .from('pets')
    .insert({ ...parsed.data, owner_id: user.id, memorial_slug: slug })
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const { data: existing } = await supabase
    .from('pets')
    .select('owner_id, memorial_slug')
    .eq('id', petId)
    .single();
  const pet = existing as { owner_id: string; memorial_slug: string } | null;
  if (!pet || pet.owner_id !== user.id) return { error: 'Não autorizado' };

  const parsed = petSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase.from('pets').update(parsed.data).eq('id', petId);
  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  revalidatePath(`/memorial/${pet.memorial_slug}`);
  return { success: true };
}
