'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/security/rate-limit';
import { verifyTurnstileToken } from '@/lib/security/turnstile';

const REPORT_CATEGORIES = [
  'sexual_content',
  'child_safety',
  'animal_cruelty',
  'hate_speech',
  'spam',
  'fake_memorial',
  'copyright',
  'harassment',
  'personal_info',
  'other',
] as const;

const schema = z.object({
  memorial_slug: z.string().min(1).max(120),
  category: z.enum(REPORT_CATEGORIES),
  description: z.string().min(10, 'Conte mais sobre o problema (mín. 10 caracteres).').max(2000),
  reporter_email: z.string().email().optional(),
  turnstile_token: z.string().optional(),
});

type ReportInput = z.infer<typeof schema>;

const AUTO_FLAG_THRESHOLD = 3;

async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return h.get('x-real-ip') ?? null;
}

export async function reportMemorial(
  input: ReportInput,
): Promise<{ success?: boolean; error?: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const session = await getServerSession();
  const userId = session?.user.id ?? null;
  const ip = await getClientIp();

  if (!userId) {
    if (!parsed.data.reporter_email) {
      return { error: 'Informe seu e-mail para enviar a denúncia.' };
    }
    if (!process.env.TURNSTILE_SECRET_KEY) {
      // Captcha não configurado: aceita mas registra.
    } else {
      const captchaOk = await verifyTurnstileToken(parsed.data.turnstile_token);
      if (!captchaOk) {
        return { error: 'Não foi possível validar o desafio anti-spam.' };
      }
    }
  }

  const rateKey = userId ? `report:user:${userId}` : `report:ip:${ip ?? 'unknown'}`;
  const limit = rateLimit({ key: rateKey, windowSec: 3600, max: 5 });
  if (!limit.allowed) {
    return { error: 'Muitas denúncias em pouco tempo. Tente novamente mais tarde.' };
  }

  const pet = await prisma.pet.findUnique({
    where: { memorial_slug: parsed.data.memorial_slug },
    select: { id: true, owner_id: true, moderation_status: true, memorial_slug: true },
  });
  if (!pet) return { error: 'Memorial não encontrado.' };

  if (userId && pet.owner_id === userId) {
    return { error: 'Você não pode denunciar seu próprio memorial.' };
  }

  if (userId) {
    const existing = await prisma.memorialReport.findFirst({
      where: {
        pet_id: pet.id,
        reporter_user_id: userId,
        status: { in: ['pending', 'under_review'] },
      },
      select: { id: true },
    });
    if (existing) {
      return { error: 'Você já denunciou este memorial. Estamos analisando.' };
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eternopet.com.br';
  const memorialUrl = `${siteUrl.replace(/\/$/, '')}/memorial/${pet.memorial_slug}`;

  await prisma.memorialReport.create({
    data: {
      pet_id: pet.id,
      reporter_user_id: userId,
      reporter_email: userId ? null : parsed.data.reporter_email ?? null,
      reporter_ip: ip,
      category: parsed.data.category,
      description: parsed.data.description,
      memorial_url: memorialUrl,
    },
  });

  if (pet.moderation_status === 'active') {
    const pendingCount = await prisma.memorialReport.count({
      where: { pet_id: pet.id, status: { in: ['pending', 'under_review'] } },
    });
    if (pendingCount >= AUTO_FLAG_THRESHOLD) {
      await prisma.pet.update({
        where: { id: pet.id },
        data: { moderation_status: 'flagged' },
      });
    }
  }

  revalidatePath(`/memorial/${pet.memorial_slug}`);

  return { success: true };
}
