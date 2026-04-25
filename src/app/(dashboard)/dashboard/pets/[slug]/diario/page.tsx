import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import ChronicleList from '@/components/chronicles/ChronicleList';
import UpgradePrompt from '@/components/ui/UpgradePrompt';
import { createClient } from '@/lib/supabase/server';
import { canUse, getEffectivePlanServer } from '@/lib/plans';
import type { Chronicle, Pet } from '@/types/database';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function DiaryPage({ params }: Props) {
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

  if (!canUse(planId, 'chronicles')) {
    return (
      <div className="mx-auto max-w-[800px] px-6 pt-32 pb-24">
        <Link
          href={`/dashboard/pets/${pet.memorial_slug}/editar`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Voltar para o pet
        </Link>
        <h1 className="mb-10 font-serif text-5xl text-on-surface">Crônicas de {pet.name}</h1>
        <UpgradePrompt
          feature="Diário de Crônicas"
          description="Transforme lembranças em histórias com os planos Premium e Eterno."
        />
      </div>
    );
  }

  const { data: chroniclesData } = await supabase
    .from('chronicles')
    .select('*')
    .eq('pet_id', pet.id)
    .order('event_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  const chronicles = (chroniclesData as Chronicle[] | null) ?? [];

  return (
    <div className="mx-auto min-h-screen max-w-[1120px] px-6 pb-28 pt-32 animate-fade-in">
      <header className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            href={`/dashboard/pets/${pet.memorial_slug}/editar`}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Voltar para o pet
          </Link>
          <h1 className="font-serif text-5xl text-on-surface">Crônicas de {pet.name}</h1>
          <p className="mt-3 max-w-2xl text-lg text-on-surface-variant">
            Um diário para transformar lembranças em histórias cuidadas, com contexto, data e sentimento.
          </p>
        </div>
        <Link
          href={`/dashboard/pets/${pet.memorial_slug}/diario/novo`}
          className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim"
        >
          <Plus className="h-4 w-4" />
          Nova crônica
        </Link>
      </header>

      <ChronicleList pet={pet} chronicles={chronicles} />
    </div>
  );
}
