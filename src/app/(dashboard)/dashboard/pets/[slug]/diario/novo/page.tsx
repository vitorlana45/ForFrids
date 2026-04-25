import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import ChronicleEditor from '@/components/chronicles/ChronicleEditor';
import UpgradePrompt from '@/components/ui/UpgradePrompt';
import { canUse, getEffectivePlanServer } from '@/lib/plans';
import { createClient } from '@/lib/supabase/server';
import type { Pet } from '@/types/database';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function NewChroniclePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  const { data: petData } = await supabase
    .from('pets')
    .select('*')
    .eq('memorial_slug', slug)
    .eq('owner_id', user.id)
    .single();

  const pet = petData as Pet | null;
  if (!pet) notFound();

  const planId = await getEffectivePlanServer(user.id);
  const canUseChronicles = canUse(planId, 'chronicles');

  return (
    <div className="mx-auto min-h-screen max-w-[1200px] px-6 pb-28 pt-32 animate-fade-in">
      <header className="mb-10">
        <Link href={`/dashboard/pets/${pet.memorial_slug}/diario`} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Voltar ao diario
        </Link>
        <h1 className="font-serif text-5xl text-on-surface">Nova cronica</h1>
        <p className="mt-3 max-w-2xl text-lg text-on-surface-variant">
          Escreva uma memoria de {pet.name} com calma. Ela pode nascer como rascunho e ser publicada depois.
        </p>
      </header>

      {canUseChronicles ? (
        <ChronicleEditor pet={pet} userId={user.id} />
      ) : (
        <UpgradePrompt
          feature="Diario de Cronicas"
          description="Crie textos mais longos, com capa, fase da vida e publicacao no memorial nos planos Premium e Eterno."
        />
      )}
    </div>
  );
}
