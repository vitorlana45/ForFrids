import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import PetForm from '@/components/pets/PetForm';
import TimelineManager from '@/components/timeline/TimelineManager';
import type { Pet, TimelineEntry } from '@/types/database';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditarPetPage({ params }: Props) {
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

  const { data: timelineData } = await supabase
    .from('timeline_entries')
    .select('*')
    .eq('pet_id', pet.id)
    .order('date', { ascending: true });

  const entries = (timelineData as TimelineEntry[] | null) ?? [];

  return (
    <div className="max-w-2xl mx-auto pb-24 animate-fade-in">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-on-surface">Editar — {pet.name}</h1>
          <p className="mt-1 text-on-surface-variant">
            Atualize as informações da página do seu pet.
          </p>
        </div>
        {pet.is_public && (
          <Link
            href={`/memorial/${pet.memorial_slug}`}
            target="_blank"
            className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline underline-offset-4 mt-2 shrink-0"
          >
            <span className="material-symbols-outlined text-base">open_in_new</span>
            Ver memorial
          </Link>
        )}
      </div>

      <PetForm userId={user.id} pet={pet} />

      <div className="mt-16 pt-12 border-t border-outline-variant/20">
        <TimelineManager petId={pet.id} initialEntries={entries} />
      </div>
    </div>
  );
}
