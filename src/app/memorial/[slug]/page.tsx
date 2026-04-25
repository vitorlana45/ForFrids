import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import type { Pet, TimelineEntry } from '@/types/database';
import MemorialActions from '@/components/memorial/MemorialActions';
import TributesSection from '@/components/memorial/TributesSection';
import type { Tribute } from '@/types/database';

export const revalidate = 60;

interface Props { params: Promise<{ slug: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('pets').select('name,species,tribute_text').eq('memorial_slug', slug).eq('is_public', true).single();
  const pet = data as Pick<Pet, 'name' | 'species' | 'tribute_text'> | null;
  if (!pet) return { title: 'Memorial não encontrado' };
  return {
    title: `${pet.name} — Eterno Pet`,
    description: pet.tribute_text?.slice(0, 160) ?? `Memorial de ${pet.name}, ${pet.species}.`,
  };
}

export default async function MemorialPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: petData } = await supabase.from('pets').select('*').eq('memorial_slug', slug).eq('is_public', true).single();
  const pet = petData as Pet | null;
  if (!pet) notFound();

  const { data: timelineData } = await supabase.from('timeline_entries').select('*').eq('pet_id', pet.id).order('date', { ascending: true });
  const entries = (timelineData as TimelineEntry[] | null) ?? [];

  const { data: tributesData } = await supabase.from('tributes').select('*').eq('pet_id', pet.id).order('created_at', { ascending: false });
  const tributes = (tributesData as Tribute[] | null) ?? [];

  const isAlive = !pet.death_date;

  // Collect all photos from timeline for the gallery
  const allPhotos = entries.flatMap(e => e.photo_urls).filter(Boolean);

  // Distribute photos across 4 masonry columns
  const columns: string[][] = [[], [], [], []];
  allPhotos.forEach((url, i) => columns[i % 4].push(url));

  const memorialUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eternopet.com.br'}/memorial/${slug}`;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-on-surface botanical-bg">

      {/* ── Header ── */}
      <header className="bg-[#FDFCF8]/80 backdrop-blur-md border-b border-primary-container/10 sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-[1200px] mx-auto">
          <Link href="/" className="text-2xl font-serif italic text-primary-container">Eterno Pet</Link>
          <nav className="hidden md:flex gap-8 items-center">
            <a href="#memorial" className="text-primary-container border-b-2 border-primary-container pb-1 font-medium font-serif">Memorial</a>
            <a href="#timeline" className="text-stone-500 hover:text-primary-container transition-colors font-serif">História</a>
            <a href="#galeria" className="text-stone-500 hover:text-primary-container transition-colors font-serif">Galeria</a>
            <a href="#tributos" className="text-stone-500 hover:text-primary-container transition-colors font-serif">Tributos</a>
          </nav>
          <MemorialActions petName={pet.name} memorialUrl={memorialUrl} />
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6" id="memorial">

        {/* ── Hero ── */}
        <section className="py-32 flex flex-col items-center text-center relative overflow-hidden">
          <span className="material-symbols-outlined absolute -top-10 -left-10 text-[200px] text-primary/5 select-none">eco</span>
          <span className="material-symbols-outlined absolute -bottom-10 -right-10 text-[200px] text-primary/5 select-none">potted_plant</span>

          <div className="relative z-10">
            <div className="w-64 h-64 md:w-80 md:h-80 mx-auto rounded-full border-8 border-white shadow-xl overflow-hidden mb-8 bg-surface-container-high flex items-center justify-center relative">
              {pet.avatar_url ? (
                <Image src={pet.avatar_url} alt={pet.name} fill unoptimized className="object-cover" priority />
              ) : (
                <span className="material-symbols-outlined text-[100px] text-outline">cruelty_free</span>
              )}
            </div>

            <h1 className="font-serif text-6xl text-primary mb-4">{pet.name}</h1>

            <p className="font-serif text-xl italic text-tertiary mb-6">
              {pet.birth_date && new Date(pet.birth_date).getFullYear()}
              {pet.birth_date && pet.death_date && ' — '}
              {pet.death_date && new Date(pet.death_date).getFullYear()}
              {!pet.birth_date && !pet.death_date && <span className="capitalize">{pet.species}</span>}
            </p>

            {pet.tribute_text && (
              <p className="font-serif text-2xl text-on-surface-variant max-w-2xl mx-auto font-light italic">
                "{pet.tribute_text}"
              </p>
            )}
          </div>
        </section>

        {/* ── Timeline ── */}
        {entries.length > 0 && (
          <section className="py-16 border-t border-primary/10" id="timeline">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-serif text-4xl text-center text-primary mb-16">Nossa Caminhada</h2>
              <div className="relative pl-8 md:pl-0">
                <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-primary/20 -translate-x-1/2" />

                {entries.map((entry, i) => {
                  const isLeft = i % 2 === 0;
                  return (
                    <div key={entry.id} className="relative flex flex-col md:flex-row items-center mb-8">
                      <div className={`hidden md:flex flex-1 ${isLeft ? 'justify-end pr-12 text-right' : 'order-3 pl-12'}`}>
                        <span className="text-[11px] font-bold tracking-widest text-primary uppercase">{formatDate(entry.date)}</span>
                      </div>
                      <div className="absolute left-0 md:left-1/2 w-4 h-4 rounded-full bg-primary-container border-4 border-surface -translate-x-1/2 z-10" />
                      <div className={`flex-1 ${isLeft ? 'md:pl-12' : 'md:pr-12 md:text-right order-2 md:order-1'}`}>
                        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
                          <h3 className="font-serif text-xl text-on-surface mb-1">{entry.title}</h3>
                          {entry.description && <p className="text-sm text-on-surface-variant">{entry.description}</p>}
                          <span className="md:hidden text-[11px] font-bold tracking-widest text-primary uppercase mt-2 block">{formatDate(entry.date)}</span>
                          {entry.photo_urls.length > 0 && (
                            <div className="mt-4 grid grid-cols-3 gap-2">
                              {entry.photo_urls.slice(0, 3).map((url, j) => (
                                <div key={j} className="aspect-square rounded-lg overflow-hidden relative">
                                  <Image src={url} alt="" fill unoptimized className="object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── Gallery ── */}
        <section className="py-32" id="galeria">
          <h2 className="font-serif text-4xl text-center text-primary mb-16">Álbum Afetivo</h2>

          {allPhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 items-start">
              {columns.map((colPhotos, col) => (
                <div key={col} className={`grid gap-4 md:gap-6 ${col % 2 !== 0 ? 'pt-8 md:pt-12' : ''}`}>
                  {colPhotos.map((url, idx) => (
                    <div
                      key={url + idx}
                      className={`rounded-xl overflow-hidden relative ${idx % 2 === 0 ? 'aspect-[3/4]' : 'aspect-square'}`}
                    >
                      <Image src={url} alt="" fill unoptimized className="object-cover hover:scale-105 transition-transform duration-700" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="material-symbols-outlined text-[64px] text-outline mb-4">photo_library</span>
              <p className="font-serif text-lg text-on-surface-variant mb-1">Nenhuma foto ainda</p>
              <p className="text-sm text-on-surface-variant">As fotos adicionadas aos momentos da timeline aparecem aqui.</p>
            </div>
          )}
        </section>

        {/* ── Tributes ── */}
        <TributesSection
          petId={pet.id}
          petName={pet.name}
          memorialSlug={slug}
          initialTributes={tributes}
        />
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#FDFCF8] w-full mt-32 border-t border-primary-container/10">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-8 py-12 max-w-[1200px] mx-auto">
          <div className="mb-6 md:mb-0">
            <div className="text-lg font-serif text-primary-container mb-1">Eterno Pet</div>
            <p className="font-serif text-sm text-stone-500">
              {isAlive
                ? `${pet.name} vive cada dia com alegria e amor.`
                : `${pet.name} sempre viverá em nossas memórias.`}
            </p>
          </div>
          <nav className="flex gap-8">
            <Link href="/" className="text-stone-400 hover:text-primary-container font-serif text-sm transition-colors">Início</Link>
            <a href="#" className="text-stone-400 hover:text-primary-container font-serif text-sm transition-colors">Privacidade</a>
            <a href="#" className="text-stone-400 hover:text-primary-container font-serif text-sm transition-colors">Termos</a>
          </nav>
        </div>
      </footer>

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-2 h-16 bg-surface/80 backdrop-blur-md border-t border-stone-100">
        {[
          { icon: 'home', label: 'Memorial', href: '#memorial' },
          { icon: 'timeline', label: 'História', href: '#timeline' },
          { icon: 'photo_library', label: 'Galeria', href: '#galeria' },
          { icon: 'favorite', label: 'Tributos', href: '#tributos' },
        ].map(item => (
          <a key={item.label} href={item.href} className="flex flex-col items-center justify-center text-stone-400 hover:text-primary-container transition-colors">
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-serif text-[11px] tracking-wide">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
