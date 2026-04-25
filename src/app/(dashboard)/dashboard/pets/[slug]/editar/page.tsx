import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import PetEditTabs from '@/components/pets/PetEditTabs';
import type { Pet, TimelineEntry, Tribute } from '@/types/database';

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

  const [
    timelineResult,
    pendingResult,
    approvedResult,
    reactionsResult,
    chroniclesResult,
  ] = await Promise.all([
    supabase
      .from('timeline_entries')
      .select('*')
      .eq('pet_id', pet.id)
      .order('date', { ascending: true }),
    supabase
      .from('tributes')
      .select('*')
      .eq('pet_id', pet.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('tributes')
      .select('*', { count: 'exact', head: true })
      .eq('pet_id', pet.id)
      .eq('status', 'approved'),
    supabase
      .from('memorial_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('pet_id', pet.id)
      .eq('reaction_type', 'heart'),
    supabase
      .from('chronicles')
      .select('*', { count: 'exact', head: true })
      .eq('pet_id', pet.id),
  ]);

  const entries = (timelineResult.data as TimelineEntry[] | null) ?? [];
  const pendingTributes = (pendingResult.data as Tribute[] | null) ?? [];
  const approvedTributesCount = approvedResult.count ?? 0;
  const likesCount = reactionsResult.count ?? 0;
  const chroniclesCount = chroniclesResult.count ?? 0;

  return (
    <div className="mx-auto max-w-[1100px] px-6 pb-24 pt-32 animate-fade-in">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline underline-offset-4"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Dashboard
          </Link>
          <h1 className="font-serif text-4xl text-on-surface">{pet.name}</h1>
          <p className="mt-1 text-on-surface-variant">Gerencie o memorial do seu pet.</p>
        </div>
        {pet.is_public && (
          <Link
            href={`/memorial/${pet.memorial_slug}`}
            target="_blank"
            className="mt-2 flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary hover:underline underline-offset-4"
          >
            <span className="material-symbols-outlined text-base">open_in_new</span>
            Ver memorial
          </Link>
        )}
      </div>

      <PetEditTabs
        userId={user.id}
        pet={pet}
        entries={entries}
        pendingTributes={pendingTributes}
        approvedTributesCount={approvedTributesCount}
        likesCount={likesCount}
        chroniclesCount={chroniclesCount}
      />
    </div>
  );
}
