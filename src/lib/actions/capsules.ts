'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { canUse, getEffectivePlanServer } from '@/lib/plans';
import { z } from 'zod';

const createSchema = z.object({
  pet_id: z.string().uuid(),
  title: z.string().min(1, 'Título é obrigatório'),
  message: z.string().min(10, 'Mensagem muito curta'),
  open_at: z.string().min(1, 'Data de abertura é obrigatória'),
});

export async function createCapsule(
  input: z.infer<typeof createSchema>,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const planId = await getEffectivePlanServer(user.id);
  if (!canUse(planId, 'capsules')) return { error: 'UPGRADE_REQUIRED' };

  // Verify pet ownership
  const { data: pet } = await supabase
    .from('pets')
    .select('owner_id')
    .eq('id', parsed.data.pet_id)
    .single();
  if (!(pet as { owner_id: string } | null)?.owner_id || (pet as { owner_id: string }).owner_id !== user.id) {
    return { error: 'Não autorizado' };
  }

  const { error } = await supabase.from('time_capsules').insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath('/dashboard/capsulas');
  return { success: true };
}

export async function openCapsule(
  capsuleId: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const planId = await getEffectivePlanServer(user.id);
  if (!canUse(planId, 'capsules')) return { error: 'UPGRADE_REQUIRED' };

  const { data: capsuleData } = await supabase
    .from('time_capsules')
    .select('pet_id, open_at, opened')
    .eq('id', capsuleId)
    .single();
  const capsule = capsuleData as { pet_id: string; open_at: string; opened: boolean } | null;
  if (!capsule) return { error: 'Cápsula não encontrada' };
  if (capsule.opened) return { success: true };
  if (new Date(capsule.open_at) > new Date()) return { error: 'Esta cápsula ainda não pode ser aberta' };

  const { data: pet } = await supabase
    .from('pets')
    .select('owner_id')
    .eq('id', capsule.pet_id)
    .single();
  if ((pet as { owner_id: string } | null)?.owner_id !== user.id) return { error: 'Não autorizado' };

  const { error } = await supabase
    .from('time_capsules')
    .update({ opened: true })
    .eq('id', capsuleId);
  if (error) return { error: error.message };

  revalidatePath('/dashboard/capsulas');
  return { success: true };
}

export async function deleteCapsule(
  capsuleId: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const { data: capsuleData } = await supabase
    .from('time_capsules')
    .select('pet_id')
    .eq('id', capsuleId)
    .single();
  const capsule = capsuleData as { pet_id: string } | null;
  if (!capsule) return { error: 'Cápsula não encontrada' };

  const { data: pet } = await supabase
    .from('pets')
    .select('owner_id')
    .eq('id', capsule.pet_id)
    .single();
  if ((pet as { owner_id: string } | null)?.owner_id !== user.id) return { error: 'Não autorizado' };

  const { error } = await supabase.from('time_capsules').delete().eq('id', capsuleId);
  if (error) return { error: error.message };

  revalidatePath('/dashboard/capsulas');
  return { success: true };
}
