'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth-server';
import { canUse, getEffectivePlanServer } from '@/lib/plans';
import { prisma } from '@/lib/prisma';
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
  const session = await getServerSession();
  if (!session) return { error: 'Não autenticado' };
  const userId = session.user.id;

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const planId = await getEffectivePlanServer(userId);
  if (!canUse(planId, 'capsules')) return { error: 'UPGRADE_REQUIRED' };

  const pet = await prisma.pet.findUnique({
    where: { id: parsed.data.pet_id },
    select: { owner_id: true },
  });
  if (pet?.owner_id !== userId) return { error: 'Não autorizado' };

  await prisma.timeCapsule.create({
    data: {
      ...parsed.data,
      open_at: new Date(parsed.data.open_at),
    },
  });

  revalidatePath('/dashboard/capsulas');
  return { success: true };
}

export async function openCapsule(
  capsuleId: string,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getServerSession();
  if (!session) return { error: 'Não autenticado' };
  const userId = session.user.id;

  const planId = await getEffectivePlanServer(userId);
  if (!canUse(planId, 'capsules')) return { error: 'UPGRADE_REQUIRED' };

  const capsule = await prisma.timeCapsule.findUnique({
    where: { id: capsuleId },
    select: { pet_id: true, open_at: true, opened: true },
  });
  if (!capsule) return { error: 'Cápsula não encontrada' };
  if (capsule.opened) return { success: true };
  if (capsule.open_at > new Date()) return { error: 'Esta cápsula ainda não pode ser aberta' };

  const pet = await prisma.pet.findUnique({
    where: { id: capsule.pet_id },
    select: { owner_id: true },
  });
  if (pet?.owner_id !== userId) return { error: 'Não autorizado' };

  await prisma.timeCapsule.update({
    where: { id: capsuleId },
    data: { opened: true },
  });

  revalidatePath('/dashboard/capsulas');
  return { success: true };
}

export async function deleteCapsule(
  capsuleId: string,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getServerSession();
  if (!session) return { error: 'Não autenticado' };
  const userId = session.user.id;

  const capsule = await prisma.timeCapsule.findUnique({
    where: { id: capsuleId },
    select: { pet_id: true },
  });
  if (!capsule) return { error: 'Cápsula não encontrada' };

  const pet = await prisma.pet.findUnique({
    where: { id: capsule.pet_id },
    select: { owner_id: true },
  });
  if (pet?.owner_id !== userId) return { error: 'Não autorizado' };

  await prisma.timeCapsule.delete({ where: { id: capsuleId } });

  revalidatePath('/dashboard/capsulas');
  return { success: true };
}
