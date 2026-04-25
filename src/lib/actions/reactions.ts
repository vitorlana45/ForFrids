'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

interface ToggleResult {
  liked?: boolean;
  count?: number;
  error?: string;
}

async function countPetReactions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  petId: string,
) {
  const { count } = await supabase
    .from('memorial_reactions')
    .select('id', { count: 'exact', head: true })
    .eq('pet_id', petId)
    .eq('reaction_type', 'heart');

  return count ?? 0;
}

export async function toggleMemorialReaction(
  petId: string,
  memorialSlug: string,
): Promise<ToggleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Entre para favoritar este memorial.' };
  }

  const { data: petData } = await supabase
    .from('pets')
    .select('id, is_public')
    .eq('id', petId)
    .eq('memorial_slug', memorialSlug)
    .single();

  const pet = petData as { id: string; is_public: boolean } | null;
  if (!pet?.is_public) {
    return { error: 'Memorial nao encontrado.' };
  }

  const { data: existingData } = await supabase
    .from('memorial_reactions')
    .select('id')
    .eq('pet_id', petId)
    .eq('user_id', user.id)
    .eq('reaction_type', 'heart')
    .maybeSingle();

  const existing = existingData as { id: string } | null;

  if (existing) {
    const { error } = await supabase
      .from('memorial_reactions')
      .delete()
      .eq('id', existing.id)
      .eq('user_id', user.id);

    if (error) return { error: error.message };

    const count = await countPetReactions(supabase, petId);
    revalidatePath(`/memorial/${memorialSlug}`);
    revalidatePath('/dashboard');
    return { liked: false, count };
  }

  const { error } = await supabase
    .from('memorial_reactions')
    .insert({
      pet_id: petId,
      user_id: user.id,
      reaction_type: 'heart',
    });

  if (error) return { error: error.message };

  const count = await countPetReactions(supabase, petId);
  revalidatePath(`/memorial/${memorialSlug}`);
  revalidatePath('/dashboard');
  return { liked: true, count };
}
