'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth-server';
import { deletePublicObject, publicUrlMatchesKeyPrefix } from '@/lib/storage/client';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

const profileSchema = z.object({
  full_name: z.string().trim().min(1, 'Nome e obrigatorio').max(120, 'Nome muito longo'),
  guardian_title: z.string().trim().max(80, 'Titulo muito longo').nullable().optional(),
  bio: z.string().trim().max(420, 'Mensagem muito longa').nullable().optional(),
  avatar_url: z.string().nullable().optional(),
});

type ProfileInput = z.infer<typeof profileSchema>;

export async function updateProfile(input: ProfileInput): Promise<{ error?: string; success?: boolean }> {
  const session = await getServerSession();
  if (!session) return { error: 'Nao autenticado' };
  const userId = session.user.id;

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await prisma.profile.findUnique({
    where: { id: userId },
    select: { avatar_url: true },
  });
  if (!existing) return { error: 'Perfil nao encontrado' };

  const nextAvatarUrl = parsed.data.avatar_url ?? null;
  if (
    nextAvatarUrl &&
    nextAvatarUrl !== existing.avatar_url &&
    !publicUrlMatchesKeyPrefix(nextAvatarUrl, `profiles/${userId}/avatar-`)
  ) {
    return { error: 'Foto do tutor invalida' };
  }

  await prisma.profile.update({
    where: { id: userId },
    data: {
      full_name: parsed.data.full_name,
      guardian_title: parsed.data.guardian_title || null,
      bio: parsed.data.bio || null,
      avatar_url: nextAvatarUrl,
    },
  });

  if (existing.avatar_url && existing.avatar_url !== nextAvatarUrl) {
    const deleteResult = await deletePublicObject(existing.avatar_url);
    if (deleteResult.error) {
      log.warn('[profile:updateProfile] storage delete failed (non-blocking):', deleteResult.error);
    }
  }

  revalidatePath('/dashboard/configuracoes');
  revalidatePath('/dashboard/perfil');
  revalidatePath('/dashboard');

  return { success: true };
}
