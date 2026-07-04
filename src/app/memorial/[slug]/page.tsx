import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { canUse, getEffectivePlanServer } from '@/lib/plans';
import { formatDate } from '@/lib/utils';
import type { Chronicle, Pet, TimelineEntry } from '@/types/database';
import MemorialActions from '@/components/memorial/MemorialActions';
import MemorialNav, { type MemorialNavItem } from '@/components/memorial/MemorialNav';
import ThemeToggle from '@/components/ui/ThemeToggle';
import TributesSection from '@/components/memorial/TributesSection';
import GalleryLightbox from '@/components/memorial/GalleryLightbox';
import MemorialLogoLink from '@/components/memorial/MemorialLogoLink';
import ChroniclesSection from '@/components/memorial/ChroniclesSection';
import TutorSection from '@/components/memorial/TutorSection';
import type { Tribute } from '@/types/database';

export const revalidate = 60;

interface Props { params: Promise<{ slug: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pet = await prisma.pet.findFirst({
    where: { memorial_slug: slug, is_public: true, moderation_status: { not: 'blocked' } },
    select: { name: true, species: true, tribute_text: true },
  });
  if (!pet) return { title: 'Memorial não encontrado' };
  return {
    title: `${pet.name} - Eterno Pet`,
    description: (pet.tribute_text as string | null)?.slice(0, 160) ?? `Memorial de ${pet.name}, ${pet.species}.`,
  };
}

export default async function MemorialPage({ params }: Props) {
  const { slug } = await params;

  const petData = await prisma.pet.findFirst({
    where: { memorial_slug: slug, is_public: true },
  });
  const pet = petData as unknown as Pet | null;
  if (!pet) notFound();

  if ((petData as unknown as { moderation_status?: string })?.moderation_status === 'blocked') {
    notFound();
  }

  const ownerPlanId = await getEffectivePlanServer(pet.owner_id);
  const canShowChronicles = canUse(ownerPlanId, 'chronicles');

  const [timelineData, tributesData, ownerProfileData, reactionsCount] = await Promise.all([
    prisma.timelineEntry.findMany({
      where: { pet_id: pet.id },
      orderBy: { date: 'asc' },
    }),
    prisma.tribute.findMany({
      where: { pet_id: pet.id, status: 'approved' },
      orderBy: { created_at: 'desc' },
    }),
    prisma.profile.findUnique({
      where: { id: pet.owner_id },
      select: { full_name: true, avatar_url: true, guardian_title: true, bio: true },
    }),
    prisma.memorialReaction.count({
      where: { pet_id: pet.id, reaction_type: 'heart' },
    }),
  ]);

  const entries = timelineData as unknown as TimelineEntry[];
  const tributes = tributesData as unknown as Tribute[];
  const ownerProfile = ownerProfileData as { full_name: string | null; avatar_url: string | null; guardian_title: string | null; bio: string | null } | null;

  const chronicles: Chronicle[] = canShowChronicles
    ? (await prisma.chronicle.findMany({
        where: { pet_id: pet.id, is_published: true },
        orderBy: [{ event_date: 'desc' }, { created_at: 'desc' }],
      })) as unknown as Chronicle[]
    : [];

  const isAlive = !pet.death_date;
  const allPhotos = entries.flatMap(e => e.photo_urls).filter(Boolean);

  const memorialUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eternopet.com.br'}/memorial/${slug}`;

  const navItems: MemorialNavItem[] = [
    { id: 'memorial', label: 'Memorial', icon: 'home' },
    ...(entries.length > 0 ? [{ id: 'timeline', label: 'História', icon: 'timeline' }] : []),
    ...(chronicles.length > 0 ? [{ id: 'cronicas', label: 'Crônicas', icon: 'menu_book' }] : []),
    { id: 'galeria', label: 'Galeria', icon: 'photo_library' },
    ...(ownerProfile?.full_name ? [{ id: 'tutor', label: 'Tutor', icon: 'person' }] : []),
    { id: 'tributos', label: 'Tributos', icon: 'favorite' },
  ];

  return (
    <div className="min-h-screen bg-surface text-on-surface botanical-bg">

      {/* Header */}
      <header className="bg-surface/85 backdrop-blur-md border-b border-outline-variant/20 sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-[1200px] mx-auto">
          <MemorialLogoLink />
          <MemorialNav items={navItems} variant="desktop" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <MemorialActions
              petId={pet.id}
              petName={pet.name}
              memorialSlug={slug}
              memorialUrl={memorialUrl}
              initialLikesCount={reactionsCount}
            />
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6" id="memorial">

        {/* Hero */}
        <section className="py-32 flex flex-col items-center text-center relative overflow-hidden">
          <span className="material-symbols-outlined absolute -top-10 -left-10 text-[200px] text-primary/5 select-none">eco</span>
          <span className="material-symbols-outlined absolute -bottom-10 -right-10 text-[200px] text-primary/5 select-none">potted_plant</span>

          <div className="relative z-10">
            <div className="w-64 h-64 md:w-80 md:h-80 mx-auto rounded-full border-8 border-surface-container-lowest shadow-xl overflow-hidden mb-8 bg-surface-container-high flex items-center justify-center relative">
              {pet.avatar_url ? (
                <Image src={pet.avatar_url} alt={pet.name} fill unoptimized className="object-cover" priority />
              ) : (
                <span className="material-symbols-outlined text-[100px] text-outline">cruelty_free</span>
              )}
            </div>

            <h1 className="font-serif text-6xl text-primary mb-4 break-words" style={{ overflowWrap: 'anywhere' }}>{pet.name}</h1>

            <p className="font-serif text-xl italic text-tertiary mb-6">
              {pet.birth_date && new Date(pet.birth_date).getFullYear()}
              {pet.birth_date && pet.death_date && ' - '}
              {pet.death_date && new Date(pet.death_date).getFullYear()}
              {!pet.birth_date && !pet.death_date && <span className="capitalize">{pet.species}</span>}
            </p>

            {pet.tribute_text && (
              <p className="font-serif text-2xl text-on-surface-variant max-w-2xl mx-auto font-light italic break-words" style={{ overflowWrap: 'anywhere' }}>
                “{pet.tribute_text}”
              </p>
            )}
          </div>
        </section>

        {/* Timeline */}
        {entries.length > 0 && (
          <section className="py-16 border-t border-primary/10" id="timeline">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-serif text-4xl text-center text-primary mb-16">Nossa Caminhada</h2>
              <div className="relative pl-8 md:pl-0">
                <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-primary/20 -translate-x-1/2" />

                {entries.map((entry, i) => {
                  const isLeft = i % 2 === 0;
                  return (
                    <div key={entry.id} className="relative mb-8 flex w-full flex-col items-start md:flex-row md:items-center">
                      <div className={`hidden min-w-0 md:flex md:w-1/2 ${isLeft ? 'justify-end pr-12 text-right' : 'order-3 pl-12'}`}>
                        <span className="text-[11px] font-bold tracking-widest text-primary uppercase">{formatDate(entry.date)}</span>
                      </div>
                      <div className="absolute left-0 md:left-1/2 w-4 h-4 rounded-full bg-primary-container border-4 border-surface -translate-x-1/2 z-10" />
                      <div className={`w-full min-w-0 pl-8 md:w-1/2 md:pl-0 ${isLeft ? 'md:pl-12' : 'md:pr-12 md:text-right order-2 md:order-1'}`}>
                        <div className="w-full min-w-0 overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
                          <h3 className="break-words font-serif text-xl text-on-surface mb-1">{entry.title}</h3>
                          {entry.description && (
                            <p className="break-words text-sm text-on-surface-variant line-clamp-4" style={{ overflowWrap: 'anywhere' }}>
                              {entry.description}
                            </p>
                          )}
                          <span className="md:hidden text-[11px] font-bold tracking-widest text-primary uppercase mt-2 block">{formatDate(entry.date)}</span>
                          {entry.photo_urls.length > 0 && (
                            <div className="mt-4 grid max-w-full grid-cols-2 gap-2 sm:grid-cols-3">
                              {entry.photo_urls.slice(0, 3).map((url, j) => (
                                <div key={`${entry.id}-photo-${j}`} className="relative h-24 min-h-0 w-full overflow-hidden rounded-lg bg-surface-container sm:h-28">
                                  <Image src={url} alt="" fill sizes="(max-width: 768px) 40vw, 120px" unoptimized className="object-cover" />
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

        {/* Chronicles */}
        <ChroniclesSection
          petName={pet.name}
          memorialSlug={slug}
          chronicles={chronicles}
        />

        {/* Gallery */}
        <section className="py-32" id="galeria">
          <h2 className="font-serif text-4xl text-center text-primary mb-16">Álbum Afetivo</h2>

          {allPhotos.length > 0 ? (
            <GalleryLightbox photos={allPhotos} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="material-symbols-outlined text-[64px] text-outline mb-4">photo_library</span>
              <p className="font-serif text-lg text-on-surface-variant mb-1">Nenhuma foto ainda</p>
              <p className="text-sm text-on-surface-variant">As fotos adicionadas aos momentos da timeline aparecem aqui.</p>
            </div>
          )}
        </section>

        {/* Tutor Profile */}
        {ownerProfile?.full_name && (
          <TutorSection
            fullName={ownerProfile.full_name}
            avatarUrl={ownerProfile.avatar_url}
            guardianTitle={ownerProfile.guardian_title}
            bio={ownerProfile.bio}
          />
        )}

        {/* Tributes */}
        <TributesSection
          petId={pet.id}
          petName={pet.name}
          memorialSlug={slug}
          initialTributes={tributes}
        />
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest w-full mt-32 border-t border-primary-container/10">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-8 py-12 max-w-[1200px] mx-auto">
          <div className="mb-6 md:mb-0">
            <div className="text-lg font-serif text-primary-container mb-1">Eterno Pet</div>
            <p className="font-serif text-sm text-on-surface-variant">
              {isAlive
                ? `${pet.name} vive cada dia com alegria e amor.`
                : `${pet.name} sempre viverá em nossas memórias.`}
            </p>
          </div>
          <nav className="flex gap-8">
            <Link href="/" className="text-on-surface-variant hover:text-primary font-serif text-sm transition-colors">Início</Link>
            <Link href="/privacidade" className="text-on-surface-variant hover:text-primary font-serif text-sm transition-colors">Privacidade</Link>
            <Link href="/termos" className="text-on-surface-variant hover:text-primary font-serif text-sm transition-colors">Termos</Link>
          </nav>
        </div>
      </footer>

      <MemorialNav items={navItems} variant="mobile" />
    </div>
  );
}
