import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { canUse, getEffectivePlanServer } from '@/lib/plans';
import { formatDate } from '@/lib/utils';
import type { Chronicle, Pet } from '@/types/database';

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string; chronicleId: string }>;
}

async function getPublishedChronicle(slug: string, chronicleId: string) {
  const supabase = await createClient();

  const { data: petData } = await supabase
    .from('pets')
    .select('*')
    .eq('memorial_slug', slug)
    .eq('is_public', true)
    .single();

  const pet = petData as Pet | null;
  if (!pet) return { pet: null, chronicle: null };
  const ownerPlanId = await getEffectivePlanServer(pet.owner_id);
  if (!canUse(ownerPlanId, 'chronicles')) return { pet: null, chronicle: null };

  const { data: chronicleData } = await supabase
    .from('chronicles')
    .select('*')
    .eq('id', chronicleId)
    .eq('pet_id', pet.id)
    .eq('is_published', true)
    .single();

  return {
    pet,
    chronicle: chronicleData as Chronicle | null,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, chronicleId } = await params;
  const { pet, chronicle } = await getPublishedChronicle(slug, chronicleId);

  if (!pet || !chronicle) {
    return { title: 'Cronica nao encontrada' };
  }

  return {
    title: `${chronicle.title} - ${pet.name} | Eterno Pet`,
    description: chronicle.excerpt ?? chronicle.content.slice(0, 160),
  };
}

export default async function ChronicleReadingPage({ params }: Props) {
  const { slug, chronicleId } = await params;
  const { pet, chronicle } = await getPublishedChronicle(slug, chronicleId);

  if (!pet || !chronicle) notFound();

  const paragraphs = chronicle.content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-surface text-on-surface botanical-bg">
      <header className="sticky top-0 z-50 border-b border-outline-variant/20 bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[960px] items-center justify-between px-6 py-4">
          <Link href={`/memorial/${slug}`} className="text-2xl font-serif italic text-primary-container">
            Eterno Pet
          </Link>
          <Link
            href={`/memorial/${slug}#cronicas`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[960px] px-6 pb-28 pt-16">
        <article>
          <header className="mx-auto max-w-3xl text-center">
            <div className="mb-4 flex flex-wrap items-center justify-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-secondary">
              <span>{formatDate(chronicle.event_date ?? chronicle.created_at)}</span>
              <span className="text-outline">/</span>
              <span>{chronicle.reading_minutes} min de leitura</span>
              {chronicle.mood && (
                <>
                  <span className="text-outline">/</span>
                  <span>{chronicle.mood}</span>
                </>
              )}
            </div>
            <h1 className="break-words font-serif text-5xl text-primary md:text-6xl">
              {chronicle.title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-on-surface-variant">
              Uma memoria de {pet.name}
            </p>
          </header>

          <div className="mx-auto mt-12 max-w-3xl">
            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-primary-container/10 bg-surface-container shadow-memorial">
              {chronicle.cover_url ? (
                <Image
                  src={chronicle.cover_url}
                  alt={chronicle.title}
                  fill
                  unoptimized
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <BookOpen className="h-16 w-16 text-outline" />
                </div>
              )}
            </div>
          </div>

          <div className="mx-auto mt-14 max-w-2xl">
            <div className="space-y-7">
              {paragraphs.length > 0 ? (
                paragraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className="break-words font-serif text-xl leading-9 text-on-surface-variant"
                    style={{ overflowWrap: 'anywhere' }}
                  >
                    {paragraph}
                  </p>
                ))
              ) : (
                <p
                  className="break-words font-serif text-xl leading-9 text-on-surface-variant"
                  style={{ overflowWrap: 'anywhere' }}
                >
                  {chronicle.content}
                </p>
              )}
            </div>

            <div className="mt-16 border-t border-primary/10 pt-8 text-center">
              <Link
                href={`/memorial/${slug}`}
                className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim"
              >
                Voltar ao memorial de {pet.name}
              </Link>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
