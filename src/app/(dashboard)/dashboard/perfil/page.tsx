import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { ArrowRight, BookOpen, Camera, Heart, Mail, Plus, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getEffectivePlan, planLabel } from '@/lib/plans';
import type { Chronicle, Pet, Profile, TimelineEntry } from '@/types/database';

function year(date?: string | null) {
  return date ? new Date(date).getFullYear() : null;
}

function petSubtitle(pet: Pet) {
  const birthYear = year(pet.birth_date);
  const deathYear = year(pet.death_date);

  if (deathYear) {
    return `${birthYear ?? '...'} - ${deathYear}`;
  }

  if (pet.birth_date) {
    const birth = new Date(pet.birth_date);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDelta = now.getMonth() - birth.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) age -= 1;
    return age <= 0 ? 'Menos de 1 ano' : `${age} ${age === 1 ? 'ano' : 'anos'}`;
  }

  return pet.species;
}

function daysSince(date: string) {
  const start = new Date(date).getTime();
  const now = Date.now();
  return Math.max(1, Math.ceil((now - start) / 86400000));
}

function initials(name?: string | null) {
  return (name ?? 'Tutor')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-outline-variant/20 bg-surface-container-low px-8 py-10 text-center transition-transform hover:-translate-y-1">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-secondary-fixed text-on-secondary-fixed-variant">
        {icon}
      </div>
      <p className="font-serif text-4xl text-on-surface">{value}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
    </article>
  );
}

function TutorPetCard({ pet }: { pet: Pet }) {
  const href = pet.is_public ? `/memorial/${pet.memorial_slug}` : `/dashboard/pets/${pet.memorial_slug}/editar`;
  const action = pet.is_public ? 'Visitar memorial' : 'Gerenciar perfil';

  return (
    <Link href={href} className="group block">
      <article className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-container-high text-white">
        {pet.avatar_url ? (
          <Image
            src={pet.avatar_url}
            alt={pet.name}
            fill
            unoptimized
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-inverse-surface">
            <span className="material-symbols-outlined text-[72px] text-inverse-on-surface/60">cruelty_free</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        {pet.death_date && (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-secondary/20 bg-surface/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-secondary shadow-sm backdrop-blur">
            <Sparkles className="h-3 w-3" />
            Em memoria
          </span>
        )}

        <div className="absolute bottom-0 left-0 w-full p-7">
          <h3 className="font-serif text-2xl">{pet.name}</h3>
          <p className="mt-1 text-sm opacity-90">{petSubtitle(pet)}</p>
          <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] transition-all group-hover:gap-3">
            {action}
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </article>
    </Link>
  );
}

export default async function TutorProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  const [{ data: profileData }, { data: petsData }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('pets').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
  ]);

  const profile = profileData as Profile | null;
  if (!profile) redirect('/entrar');

  const pets = (petsData as Pet[] | null) ?? [];
  const petIds = pets.map(pet => pet.id);
  const planId = await getEffectivePlan(supabase, user.id);

  let timelineEntries: TimelineEntry[] = [];
  let chronicles: Pick<Chronicle, 'id' | 'cover_url'>[] = [];
  let capsuleCount = 0;

  if (petIds.length > 0) {
    const [timelineResult, chroniclesResult, capsulesResult] = await Promise.all([
      supabase.from('timeline_entries').select('id, pet_id, title, description, date, photo_urls, created_at').in('pet_id', petIds),
      supabase.from('chronicles').select('id, cover_url').in('pet_id', petIds),
      supabase.from('time_capsules').select('id', { count: 'exact', head: true }).in('pet_id', petIds),
    ]);

    timelineEntries = (timelineResult.data as TimelineEntry[] | null) ?? [];
    chronicles = (chroniclesResult.data as Pick<Chronicle, 'id' | 'cover_url'>[] | null) ?? [];
    capsuleCount = capsulesResult.count ?? 0;
  }

  const memoryDates = [
    profile.created_at,
    ...pets.map(pet => pet.created_at),
    ...timelineEntries.map(entry => entry.date),
  ].filter(Boolean).sort();
  const legacyDays = daysSince(memoryDates[0] ?? profile.created_at);
  const totalStories = chronicles.length;
  const totalPhotos =
    pets.filter(pet => pet.avatar_url).length +
    timelineEntries.reduce((total, entry) => total + ((entry.photo_urls ?? []).length), 0) +
    chronicles.filter(chronicle => chronicle.cover_url).length;
  const displayName = profile.full_name ?? user.email?.split('@')[0] ?? 'Tutor';
  const guardianTitle = profile.guardian_title ?? 'Tutor e guardiao de memorias';
  const bio = profile.bio ??
    'Cada memoria guardada aqui celebra os encontros, os cuidados e o amor que continuam fazendo parte da minha historia.';

  return (
    <main className="mx-auto max-w-[1200px] px-6 pb-28 animate-fade-in">
      <section className="mb-24 flex flex-col items-center gap-10 md:flex-row md:items-start md:gap-12">
        <div className="relative shrink-0">
          <div className="relative h-44 w-44 overflow-hidden rounded-full border border-secondary/20 bg-surface-container p-1 md:h-48 md:w-48">
            <div className="relative h-full w-full overflow-hidden rounded-full bg-primary-fixed">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={displayName}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="font-serif text-5xl text-primary">{initials(displayName)}</span>
                </div>
              )}
            </div>
          </div>
          <Link
            href="/dashboard/configuracoes"
            className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-on-primary shadow-card transition-colors hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim"
            aria-label="Editar foto do tutor"
          >
            <Camera className="h-4 w-4" />
          </Link>
        </div>

        <div className="min-w-0 max-w-3xl text-center md:text-left">
          <div className="mb-5 min-w-0">
            <h1 className="break-words font-serif text-5xl text-on-surface md:text-6xl" style={{ overflowWrap: 'anywhere' }}>{displayName}</h1>
            <p className="mt-3 break-words text-xs font-bold uppercase tracking-[0.18em] text-secondary" style={{ overflowWrap: 'anywhere' }}>
              {guardianTitle}
            </p>
          </div>
          <p className="max-w-2xl break-words font-serif text-xl italic leading-relaxed text-on-surface-variant" style={{ overflowWrap: 'anywhere' }}>
            "{bio}"
          </p>
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row md:items-start">
            <Link
              href="/dashboard/configuracoes"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim"
            >
              <span className="material-symbols-outlined text-base">edit</span>
              Editar perfil
            </Link>
            <span className="inline-flex items-center justify-center rounded-xl border border-outline-variant/30 px-5 py-3 text-sm font-semibold text-on-surface-variant">
              Plano {planLabel(planId)}
            </span>
          </div>
        </div>
      </section>

      <section className="mb-24">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">A jornada de</p>
          <h2 className="mt-2 font-serif text-4xl text-on-surface">Legado de Amor</h2>
          <div className="mx-auto mt-4 h-px w-24 bg-secondary/30" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard icon={<Heart className="h-6 w-6 fill-current" />} value={legacyDays} label="Dias de memorias" />
          <StatCard icon={<Mail className="h-6 w-6" />} value={capsuleCount} label="Cartas escritas" />
          <StatCard icon={<BookOpen className="h-6 w-6" />} value={totalStories} label="Historias compartilhadas" />
        </div>
      </section>

      <section>
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-4xl text-on-surface">Meus Companheiros</h2>
            <p className="mt-2 font-serif italic text-on-surface-variant">
              Aqueles que caminham e caminharam ao meu lado
            </p>
          </div>
          <Link
            href="/dashboard"
            className="w-fit border-b border-secondary/30 pb-1 text-xs font-bold uppercase tracking-[0.14em] text-secondary transition-colors hover:border-secondary"
          >
            Ver todos
          </Link>
        </div>

        {pets.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {pets.slice(0, 3).map(pet => (
              <TutorPetCard key={pet.id} pet={pet} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low py-20 text-center">
            <p className="font-serif text-2xl text-on-surface">Nenhum companheiro cadastrado ainda</p>
            <p className="mt-2 text-on-surface-variant">Crie o primeiro memorial para iniciar seu legado.</p>
          </div>
        )}

        <div className="mt-12 flex flex-col items-center gap-3">
          <Link
            href="/dashboard/pets/novo"
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-secondary/40 text-secondary transition-colors hover:border-secondary hover:bg-secondary/5"
            aria-label="Adicionar pet"
          >
            <Plus className="h-7 w-7" />
          </Link>
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">Adicionar pet</span>
        </div>

        <p className="mt-8 text-center text-xs text-on-surface-variant">
          {pets.length} {pets.length === 1 ? 'pet registrado' : 'pets registrados'} · {totalPhotos} imagens guardadas
        </p>
      </section>
    </main>
  );
}
