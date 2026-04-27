'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { deletePublicObject, publicUrlMatchesKeyPrefix } from '@/lib/storage/client';
import { log } from '@/lib/logger';

const profileSchema = z.object({
  full_name: z.string().trim().min(1, 'Nome e obrigatorio').max(120, 'Nome muito longo'),
  guardian_title: z.string().trim().max(80, 'Titulo muito longo').nullable().optional(),
  bio: z.string().trim().max(420, 'Mensagem muito longa').nullable().optional(),
  avatar_url: z.string().nullable().optional(),
});

type ProfileInput = z.infer<typeof profileSchema>;

export async function updateProfile(input: ProfileInput): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Nao autenticado' };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .single();

  if (fetchError) return { error: fetchError.message };

  const profile = existing as { avatar_url: string | null } | null;
  if (!profile) return { error: 'Perfil nao encontrado' };

  const nextAvatarUrl = parsed.data.avatar_url ?? null;
  if (
    nextAvatarUrl &&
    nextAvatarUrl !== profile.avatar_url &&
    !publicUrlMatchesKeyPrefix(nextAvatarUrl, `profiles/${user.id}/avatar-`)
  ) {
    return { error: 'Foto do tutor invalida' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      guardian_title: parsed.data.guardian_title || null,
      bio: parsed.data.bio || null,
      avatar_url: nextAvatarUrl,
    })
    .eq('id', user.id);

  if (error) return { error: error.message };

  if (profile.avatar_url && profile.avatar_url !== nextAvatarUrl) {
    const deleteResult = await deletePublicObject(profile.avatar_url);
    if (deleteResult.error) {
      log.warn('[profile:updateProfile] storage delete failed (non-blocking):', deleteResult.error);
    }
  }

  revalidatePath('/dashboard/configuracoes');
  revalidatePath('/dashboard/perfil');
  revalidatePath('/dashboard');

  return { success: true };
}
