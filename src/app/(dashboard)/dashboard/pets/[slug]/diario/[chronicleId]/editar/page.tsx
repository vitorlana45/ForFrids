import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import ChronicleEditor from '@/components/chronicles/ChronicleEditor';
import UpgradePrompt from '@/components/ui/UpgradePrompt';
import { canUse, getEffectivePlan } from '@/lib/plans';
import { createClient } from '@/lib/supabase/server';
import type { Chronicle, Pet } from '@/types/database';

interface Props {
  params: Promise<{ slug: string; chronicleId: string }>;
}

export default async function EditChroniclePage({ params }: Props) {
  const { slug, chronicleId } = await params;
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

  const { data: chronicleData } = await supabase
    .from('chronicles')
    .select('*')
    .eq('id', chronicleId)
    .eq('pet_id', pet.id)
    .single();

  const chronicle = chronicleData as Chronicle | null;
  if (!chronicle) notFound();

  const planId = await getEffectivePlan(supabase, user.id);
  const canUseChronicles = canUse(planId, 'chronicles');

  return (
    <div className="mx-auto min-h-screen max-w-[1200px] px-6 pb-28 pt-32 animate-fade-in">
      <header className="mb-10">
        <Link href={`/dashboard/pets/${pet.memorial_slug}/diario`} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Voltar ao diario
        </Link>
        <h1 className="font-serif text-5xl text-on-surface">Editar cronica</h1>
        <p className="mt-3 max-w-2xl text-lg text-on-surface-variant">
          Ajuste texto, capa, fase e status de publicacao.
        </p>
      </header>

      {canUseChronicles ? (
        <ChronicleEditor pet={pet} userId={user.id} chronicle={chronicle} />
      ) : (
        <UpgradePrompt
          feature="Diario de Cronicas"
          description="A edicao de cronicas esta disponivel nos planos Premium e Eterno. Voce ainda pode remover cronicas antigas pelo diario."
        />
      )}
    </div>
  );
}
