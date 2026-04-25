'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { getResend, FROM_EMAIL } from '@/lib/resend';
import { tributeNotificationEmail } from '@/lib/emails/tribute-notification';
import type { Tribute } from '@/types/database';

const schema = z.object({
  pet_id: z.string().uuid(),
  author_name: z.string().min(1, 'Seu nome é obrigatório'),
  author_relation: z.string().optional(),
  message: z.string().min(3, 'Mensagem muito curta').max(600, 'Máximo 600 caracteres'),
});

type TributeInput = z.infer<typeof schema>;

export async function createTribute(
  input: TributeInput,
  memorialSlug: string,
): Promise<{ data?: Tribute; error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Entre na sua conta para enviar uma homenagem.' };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Verify the pet is public
  const { data: pet } = await supabase
    .from('pets')
    .select('is_public')
    .eq('id', input.pet_id)
    .single();
  if (!pet || !(pet as { is_public: boolean }).is_public) {
    return { error: 'Memorial não encontrado' };
  }

  const { data, error } = await supabase
    .from('tributes')
    .insert({
      ...parsed.data,
      author_user_id: user.id,
      status: 'pending',
    })
    .select('*')
    .single();
  if (error) return { error: error.message };

  revalidatePath(`/memorial/${memorialSlug}`);

  // Notify pet owner
  try {
    const { data: petData } = await supabase
      .from('pets')
      .select('name, owner_id')
      .eq('id', input.pet_id)
      .single();

    if (petData) {
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', (petData as { name: string; owner_id: string }).owner_id)
        .single();

      const owner = ownerProfile as { full_name: string | null; email: string } | null;
      const pet = petData as { name: string; owner_id: string };

      if (owner?.email) {
        const { subject, html } = tributeNotificationEmail({
          ownerName: owner.full_name ?? 'Tutor',
          petName: pet.name,
          petSlug: memorialSlug,
          authorName: parsed.data.author_name,
          authorRelation: parsed.data.author_relation ?? null,
          message: parsed.data.message,
        });
        const resend = getResend();
        await resend.emails.send({
          from: FROM_EMAIL,
          to: owner.email,
          subject,
          html,
        });
      }
    }
  } catch {
    // Email failure must never break the tribute submission
  }

  return { data: data as Tribute, success: true };
}

async function reviewTribute(
  tributeId: string,
  status: 'approved' | 'rejected',
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const { data: tributeData } = await supabase
    .from('tributes')
    .select('pet_id')
    .eq('id', tributeId)
    .single();

  const tribute = tributeData as { pet_id: string } | null;
  if (!tribute) return { error: 'Homenagem não encontrada' };

  const { data: petData } = await supabase
    .from('pets')
    .select('owner_id, memorial_slug')
    .eq('id', tribute.pet_id)
    .single();

  const pet = petData as { owner_id: string; memorial_slug: string } | null;
  if (!pet || pet.owner_id !== user.id) return { error: 'Não autorizado' };

  const { error } = await supabase
    .from('tributes')
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq('id', tributeId);

  if (error) return { error: error.message };

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
