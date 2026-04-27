import { redirect } from 'next/navigation';
import ApprovalsBoard, { type PendingTribute } from '@/components/tributes/ApprovalsBoard';
import { createClient } from '@/lib/supabase/server';
import type { Pet, Tribute } from '@/types/database';

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  const { data: petsData } = await supabase
    .from('pets')
    .select('id, name, memorial_slug')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  const pets = (petsData as Pick<Pet, 'id' | 'name' | 'memorial_slug'>[] | null) ?? [];
  const petIds = pets.map(pet => pet.id);

  let pendingTributes: PendingTribute[] = [];

  if (petIds.length > 0) {
    const { data: tributesData } = await supabase
      .from('tributes')
      .select('*')
      .in('pet_id', petIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    const petMap = new Map(pets.map(pet => [pet.id, pet]));
    pendingTributes = ((tributesData as Tribute[] | null) ?? [])
      .map((tribute) => {
        const pet = petMap.get(tribute.pet_id);
        if (!pet) return null;
        return { ...tribute, pet };
      })
      .filter(Boolean) as PendingTribute[];
  }

  return (
    <div className="mx-auto max-w-[1000px] px-6 pb-24 animate-fade-in">
      <header className="mb-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary">
          Central de revisão
        </p>
        <h1 className="font-serif text-5xl text-on-surface">Aprovações</h1>
        <p className="mt-3 max-w-2xl text-on-surface-variant">
          Revise homenagens antes que elas apareçam nos memoriais públicos dos seus pets.
        </p>
      </header>

      <ApprovalsBoard initialTributes={pendingTributes} />
    </div>
  );
}
