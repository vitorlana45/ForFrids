import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Chronicle } from '@/types/database';

interface Props {
  petName: string;
  memorialSlug: string;
  chronicles: Chronicle[];
}

export default function ChroniclesSection({ petName, memorialSlug, chronicles }: Props) {
  if (chronicles.length === 0) return null;

  return (
    <section className="py-20 border-t border-primary/10" id="cronicas">
      <div className="mb-12 flex flex-col gap-3 text-center">
        <h2 className="font-serif text-4xl text-primary">Cronicas de {petName}</h2>
        <p className="mx-auto max-w-2xl text-on-surface-variant">
          Historias escritas para guardar o que o tempo nao deveria apagar.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {chronicles.slice(0, 4).map((chronicle) => (
          <article
            key={chronicle.id}
            className="group grid min-w-0 gap-5 rounded-3xl border border-primary-container/10 bg-surface-container-lowest p-4 shadow-sm transition-colors hover:border-primary/20 sm:grid-cols-[150px_minmax(0,1fr)]"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-container">
              {chronicle.cover_url ? (
                <Image
                  src={chronicle.cover_url}
                  alt={chronicle.title}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <BookOpen className="h-10 w-10 text-outline" />
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-col justify-center py-1">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-secondary">
                <span>{formatDate(chronicle.event_date ?? chronicle.created_at)}</span>
                <span className="text-outline">/</span>
                <span>{chronicle.reading_minutes} min</span>
              </div>
              <h3 className="break-words font-serif text-2xl text-primary transition-colors group-hover:text-secondary">
                {chronicle.title}
              </h3>
              <p
                className="mt-2 line-clamp-3 break-words text-sm leading-6 text-on-surface-variant"
                style={{ overflowWrap: 'anywhere' }}
              >
                {chronicle.excerpt ?? chronicle.content.slice(0, 180)}
              </p>
              <Link
                href={`/memorial/${memorialSlug}/cronicas/${chronicle.id}`}
                className="mt-4 inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Ler cronica
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
