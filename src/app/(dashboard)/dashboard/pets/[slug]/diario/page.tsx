import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import ChronicleList from '@/components/chronicles/ChronicleList';
import LockedFeaturePreview from '@/components/ui/LockedFeaturePreview';
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
    const previewChronicles: Chronicle[] = [
      {
        id: 'preview-1',
        pet_id: pet.id,
        title: `O dia em que ${pet.name} chegou`,
        content: 'Uma lembranca longa, com detalhes do primeiro encontro, dos pequenos gestos e de tudo que fez esse momento ficar guardado.',
        excerpt: 'Uma memoria com capa, data, fase da vida e um texto cuidado para guardar no memorial.',
        cover_url: pet.avatar_url,
        event_date: pet.birth_date ?? pet.created_at,
        life_phase: 'Infancia',
        mood: 'Grato',
        is_published: true,
        reading_minutes: 3,
        created_at: pet.created_at,
        updated_at: pet.updated_at,
      },
      {
        id: 'preview-2',
        pet_id: pet.id,
        title: 'Pequenas manias inesqueciveis',
        content: 'Um registro de habitos, brincadeiras e sinais de carinho que transformam uma historia comum em memoria viva.',
        excerpt: 'Organize historias por tom, fase da vida e publicacao no memorial.',
        cover_url: null,
        event_date: null,
        life_phase: 'Maturidade',
        mood: 'Nostalgico',
        is_published: false,
        reading_minutes: 2,
        created_at: pet.created_at,
        updated_at: pet.updated_at,
      },
    ];

    return (
      <div className="mx-auto min-h-screen max-w-[1120px] px-6 pb-28 pt-32 animate-fade-in">
        <Link
          href={`/dashboard/pets/${pet.memorial_slug}/editar`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Voltar para o pet
        </Link>
        <header className="mb-10">
          <h1 className="font-serif text-5xl text-on-surface">Cronicas de {pet.name}</h1>
          <p className="mt-3 max-w-2xl text-lg text-on-surface-variant">
            Um diario para transformar lembrancas em historias cuidadas, com contexto, data e sentimento.
          </p>
        </header>
        <LockedFeaturePreview
          feature="Diario de Cronicas"
          description="Transforme lembrancas em historias com os planos Premium e Eterno."
        >
          <ChronicleList pet={pet} chronicles={previewChronicles} />
        </LockedFeaturePreview>
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
          <h1 className="font-serif text-5xl text-on-surface">Cronicas de {pet.name}</h1>
          <p className="mt-3 max-w-2xl text-lg text-on-surface-variant">
            Um diario para transformar lembrancas em historias cuidadas, com contexto, data e sentimento.
          </p>
        </div>
        <Link
          href={`/dashboard/pets/${pet.memorial_slug}/diario/novo`}
          className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim"
        >
          <Plus className="h-4 w-4" />
          Nova cronica
        </Link>
      </header>

      <ChronicleList pet={pet} chronicles={chronicles} />
    </div>
  );
}
