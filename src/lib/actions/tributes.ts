'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getResend, FROM_EMAIL } from '@/lib/resend';
import { tributeNotificationEmail } from '@/lib/emails/tribute-notification';
import { rateLimit } from '@/lib/security/rate-limit';
import { verifyTurnstileToken } from '@/lib/security/turnstile';
import type { Tribute } from '@/types/database';

const schema = z.object({
  pet_id: z.string().uuid(),
  author_name: z.string().min(1, 'Seu nome é obrigatório'),
  author_relation: z.string().optional(),
  message: z.string().min(3, 'Mensagem muito curta').max(600, 'Máximo 600 caracteres'),
  turnstile_token: z.string().optional(),
});

type TributeInput = z.infer<typeof schema>;

export async function createTribute(
  input: TributeInput,
  memorialSlug: string,
): Promise<{ data?: Tribute; error?: string; success?: boolean }> {
  const session = await getServerSession();
  if (!session) {
    return { error: 'Entre na sua conta para enviar uma homenagem.' };
  }
  const userId = session.user.id;

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const limit = rateLimit({ key: `tribute:${userId}`, windowSec: 3600, max: 5 });
  if (!limit.allowed) {
    return { error: `Muitas homenagens em pouco tempo. Tente novamente em ${Math.ceil((limit.retryAfterSec ?? 60) / 60)} min.` };
  }

  if (process.env.TURNSTILE_SECRET_KEY) {
    const captchaOk = await verifyTurnstileToken(parsed.data.turnstile_token);
    if (!captchaOk) {
      return { error: 'Não foi possível validar o desafio anti-spam. Recarregue e tente de novo.' };
    }
  }

  const pet = await prisma.pet.findUnique({
    where: { id: input.pet_id },
    select: { is_public: true },
  });
  if (!pet?.is_public) return { error: 'Memorial não encontrado' };

  const { turnstile_token: _ignored, ...createData } = parsed.data;
  void _ignored;

  const data = await prisma.tribute.create({
    data: {
      ...createData,
      author_user_id: userId,
      status: 'pending',
    },
  });

  revalidatePath(`/memorial/${memorialSlug}`);

  try {
    const petWithOwner = await prisma.pet.findUnique({
      where: { id: input.pet_id },
      select: {
        name: true,
        owner: { select: { full_name: true, email: true } },
      },
    });

    if (petWithOwner?.owner?.email) {
      const { subject, html } = tributeNotificationEmail({
        ownerName: petWithOwner.owner.full_name ?? 'Tutor',
        petName: petWithOwner.name,
        petSlug: memorialSlug,
        authorName: parsed.data.author_name,
        authorRelation: parsed.data.author_relation ?? null,
        message: parsed.data.message,
      });
      const resend = getResend();
      await resend.emails.send({
        from: FROM_EMAIL,
        to: petWithOwner.owner.email,
        subject,
        html,
      });
    }
  } catch {
    // email failure must never break tribute submission
  }

  return { data: data as unknown as Tribute, success: true };
}

async function reviewTribute(
  tributeId: string,
  status: 'approved' | 'rejected',
): Promise<{ error?: string; success?: boolean }> {
  const session = await getServerSession();
  if (!session) return { error: 'Não autenticado' };
  const userId = session.user.id;

  const tribute = await prisma.tribute.findUnique({
    where: { id: tributeId },
    select: { pet_id: true },
  });
  if (!tribute) return { error: 'Homenagem não encontrada' };

  const pet = await prisma.pet.findUnique({
    where: { id: tribute.pet_id },
    select: { owner_id: true, memorial_slug: true },
  });
  if (!pet || pet.owner_id !== userId) return { error: 'Não autorizado' };

  await prisma.tribute.update({
    where: { id: tributeId },
    data: { status, reviewed_at: new Date() },
  });

  revalidatePath(`/dashboard/pets/${pet.memorial_slug}/editar`);
  revalidatePath(`/memorial/${pet.memorial_slug}`);
  return { success: true };
}

export async function approveTribute(tributeId: string) {
  return reviewTribute(tributeId, 'approved');
}

export async function rejectTribute(tributeId: string) {
  return reviewTribute(tributeId, 'rejected');
}
