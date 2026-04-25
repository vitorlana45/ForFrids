'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, ExternalLink, Settings2 } from 'lucide-react';
import type { Pet } from '@/types/database';

interface Props {
  pet: Pet;
}

export default function PetDashboardCard({ pet }: Props) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-card transition-all hover:border-primary/20 hover:shadow-md">
      {/* Cover image */}
      <div className="relative aspect-video w-full overflow-hidden bg-surface-container-high">
        {pet.avatar_url ? (
          <Image
            src={pet.avatar_url}
            alt={pet.name}
            fill
            unoptimized
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="material-symbols-outlined text-[64px] text-outline">cruelty_free</span>
          </div>
        )}

        {/* Status badge over image */}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm ${
            pet.death_date
              ? 'bg-surface/80 text-on-surface-variant'
              : 'bg-primary-fixed/90 text-on-primary-fixed-variant'
          }`}
        >
          {pet.death_date ? 'Memorial' : 'Em Vida'}
        </span>
      </div>

      {/* Info */}
      <div className="px-5 pb-4 pt-4">
        <h3 className="font-serif text-xl text-on-surface">{pet.name}</h3>
        <p className="mt-0.5 text-xs capitalize text-on-surface-variant">{pet.species}</p>
      </div>

      {/* Action buttons */}
      <div className="flex border-t border-outline-variant/10">
        <Link
          href={`/dashboard/pets/${pet.memorial_slug}/editar`}
          className="flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
        >
          <Settings2 className="h-3.5 w-3.5 shrink-0" />
          Gerenciar memorial
        </Link>

        {pet.is_public && (
          <>
            <span className="w-px bg-outline-variant/10" />
            <Link
              href={`/memorial/${pet.memorial_slug}`}
              target="_blank"
              className="flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              Ver memorial público
            </Link>
          </>
        )}

        <span className="w-px bg-outline-variant/10" />
        <Link
          href={`/dashboard/pets/${pet.memorial_slug}/diario/novo`}
          className="flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
        >
          <BookOpen className="h-3.5 w-3.5 shrink-0" />
          Escrever crônica
        </Link>
      </div>
    </div>
  );
}
