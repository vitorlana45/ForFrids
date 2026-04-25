'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

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
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();

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

  const { error } = await supabase.from('tributes').insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath(`/memorial/${memorialSlug}`);
  return { success: true };
}
