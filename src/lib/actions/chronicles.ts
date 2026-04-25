'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { canUse, getEffectivePlan } from '@/lib/plans';
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

async function getOwnedPet(
  supabase: Awaited<ReturnType<typeof createClient>>,
  petId: string,
  userId: string,
) {
  const { data } = await supabase
    .from('pets')
    .select('owner_id, memorial_slug')
    .eq('id', petId)
    .single();

  const pet = data as { owner_id: string; memorial_slug: string } | null;
  if (!pet || pet.owner_id !== userId) return null;
  return pet;
}

async function getOwnedPetByChronicle(
  supabase: Awaited<ReturnType<typeof createClient>>,
  chronicleId: string,
  userId: string,
) {
  const { data } = await supabase
    .from('chronicles')
    .select('pet_id')
    .eq('id', chronicleId)
    .single();

  const chronicle = data as { pet_id: string } | null;
  if (!chronicle) return null;
  return getOwnedPet(supabase, chronicle.pet_id, userId);
}

export async function createChronicle(
  input: ChronicleInput,
): Promise<{ data?: unknown; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Nao autenticado' };

  const parsed = chronicleSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const planId = await getEffectivePlan(supabase, user.id);
  if (!canUse(planId, 'chronicles')) return { error: 'UPGRADE_REQUIRED' };

  const pet = await getOwnedPet(supabase, parsed.data.pet_id, user.id);
  if (!pet) return { error: 'Nao autorizado' };

  const { data, error } = await supabase
    .from('chronicles')
    .insert({
      ...parsed.data,
      reading_minutes: estimateReadingMinutes(parsed.data.content),
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/pets/${pet.memorial_slug}/diario`);
  revalidatePath(`/memorial/${pet.memorial_slug}`);
  return { data };
}

export async function updateChronicle(
  chronicleId: string,
  input: ChronicleUpdateInput,
): Promise<{ data?: unknown; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Nao autenticado' };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const planId = await getEffectivePlan(supabase, user.id);
  if (!canUse(planId, 'chronicles')) return { error: 'UPGRADE_REQUIRED' };

  const pet = await getOwnedPetByChronicle(supabase, chronicleId, user.id);
  if (!pet) return { error: 'Nao autorizado' };

  const { data, error } = await supabase
    .from('chronicles')
    .update({
      ...parsed.data,
      reading_minutes: estimateReadingMinutes(parsed.data.content),
    })
    .eq('id', chronicleId)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/pets/${pet.memorial_slug}/diario`);
  revalidatePath(`/dashboard/pets/${pet.memorial_slug}/diario/${chronicleId}/editar`);
  revalidatePath(`/memorial/${pet.memorial_slug}`);
  return { data };
}

export async function deleteChronicle(
  chronicleId: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Nao autenticado' };

  const pet = await getOwnedPetByChronicle(supabase, chronicleId, user.id);
  if (!pet) return { error: 'Nao autorizado' };

  const { error } = await supabase.from('chronicles').delete().eq('id', chronicleId);
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/pets/${pet.memorial_slug}/diario`);
  revalidatePath(`/memorial/${pet.memorial_slug}`);
  return { success: true };
}
