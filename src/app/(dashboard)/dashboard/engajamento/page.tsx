import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, ExternalLink, Heart, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { MemorialReaction, Pet } from '@/types/database';

type PetSummary = Pick<Pet, 'id' | 'name' | 'memorial_slug' | 'avatar_url'>;

export default async function EngagementPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/entrar');

  const { data: petsData } = await supabase
    .from('pets')
    .select('id, name, memorial_slug, avatar_url')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  const pets = (petsData as PetSummary[] | null) ?? [];
  const petIds = pets.map((pet) => pet.id);

  let reactions: Pick<MemorialReaction, 'pet_id'>[] = [];
  let tributeCounts = new Map<string, number>();
  let chronicleCounts = new Map<string, number>();

  if (petIds.length > 0) {
    const [reactionsRes, tributesRes, chroniclesRes] = await Promise.all([
      supabase
        .from('memorial_reactions')
        .select('pet_id')
        .in('pet_id', petIds)
        .eq('reaction_type', 'heart'),
      supabase
        .from('tributes')
        .select('pet_id')
        .in('pet_id', petIds)
        .eq('status', 'approved'),
      supabase
        .from('chronicles')
        .select('pet_id')
        .in('pet_id', petIds)
        .eq('is_published', true),
    ]);

    reactions = (reactionsRes.data as Pick<MemorialReaction, 'pet_id'>[] | null) ?? [];

    const tributes = (tributesRes.data as { pet_id: string }[] | null) ?? [];
    tributeCounts = tributes.reduce((acc, t) => {
      acc.set(t.pet_id, (acc.get(t.pet_id) ?? 0) + 1);
      return acc;
    }, new Map<string, number>());

    const chronicles = (chroniclesRes.data as { pet_id: string }[] | null) ?? [];
    chronicleCounts = chronicles.reduce((acc, c) => {
      acc.set(c.pet_id, (acc.get(c.pet_id) ?? 0) + 1);
      return acc;
    }, new Map<string, number>());
  }

  const likesByPet = reactions.reduce((acc, reaction) => {
    acc.set(reaction.pet_id, (acc.get(reaction.pet_id) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());

  const totalLikes = reactions.length;
  const totalTributes = Array.from(tributeCounts.values()).reduce((a, b) => a + b, 0);
  const totalChronicles = Array.from(chronicleCounts.values()).reduce((a, b) => a + b, 0);

  const rankedPets = [...pets].sort(
    (a, b) =>
      (likesByPet.get(b.id) ?? 0) +
      (tributeCounts.get(b.id) ?? 0) -
      ((likesByPet.get(a.id) ?? 0) + (tributeCounts.get(a.id) ?? 0)),
  );

  return (
    <div className="mx-auto min-h-screen max-w-[1000px] px-6 pb-24 pt-32 animate-fade-in">
      <header className="mb-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary">
          Engajamento
        </p>
        <h1 className="font-serif text-5xl text-on-surface">Memórias com mais carinho</h1>
        <p className="mt-3 max-w-2xl text-on-surface-variant">
          Curtidas, homenagens e crônicas publicadas — tudo em um só lugar.
        </p>
      </header>

      {/* Totals */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-6">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-400 dark:bg-red-900/20 dark:text-red-300">
            <Heart className="h-5 w-5" />
          </div>
          <p className="font-serif text-4xl text-on-surface">{totalLikes}</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            {totalLikes === 1 ? 'curtida' : 'curtidas'}
          </p>
        </div>

        <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-6">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <p className="font-serif text-4xl text-on-surface">{totalTributes}</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            {totalTributes === 1 ? 'homenagem' : 'homenagens'}
          </p>
        </div>

        <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-6">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
            <BookOpen className="h-5 w-5" />
          </div>
          <p className="font-serif text-4xl text-on-surface">{totalChronicles}</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            {totalChronicles === 1 ? 'crônica' : 'crônicas'}
          </p>
        </div>
      </div>

      {/* Per-pet list */}
      {rankedPets.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-outline-variant bg-surface-container-low px-6 text-center">
          <span className="material-symbols-outlined mb-4 text-[56px] text-outline">pets</span>
          <h2 className="font-serif text-3xl text-on-surface">Nenhum pet cadastrado</h2>
          <p className="mt-2 max-w-md text-on-surface-variant">
            Quando seus memoriais estiverem publicados, as métricas aparecem aqui.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {rankedPets.map((pet) => {
            const likes = likesByPet.get(pet.id) ?? 0;
            const tributes = tributeCounts.get(pet.id) ?? 0;
            const chronicles = chronicleCounts.get(pet.id) ?? 0;

            return (
              <article
                key={pet.id}
                className="flex flex-col gap-4 rounded-3xl border border-outline-variant/20 bg-surface-container-low p-5 sm:flex-row sm:items-center"
              >
                {/* Avatar */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary-fixed">
                  {pet.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pet.avatar_url} alt={pet.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-primary">cruelty_free</span>
                  )}
                </div>

                {/* Name */}
                <div className="min-w-0 flex-1">
                  <h2 className="font-serif text-2xl text-on-surface">{pet.name}</h2>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                    <Heart className="h-4 w-4 text-red-400" />
                    <span className="font-semibold tabular-nums text-on-surface">{likes}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                    <MessageSquare className="h-4 w-4 text-secondary" />
                    <span className="font-semibold tabular-nums text-on-surface">{tributes}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="font-semibold tabular-nums text-on-surface">{chronicles}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 flex-wrap gap-3">
                  <Link
                    href={`/memorial/${pet.memorial_slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-full border border-outline-variant/50 px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container"
                  >
                    Ver memorial
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/dashboard/pets/${pet.memorial_slug}/editar`}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim"
                  >
                    Gerenciar
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
