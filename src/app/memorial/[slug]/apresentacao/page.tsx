import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { canUse, getEffectivePlanServer } from '@/lib/plans';
import type { Pet, TimelineEntry } from '@/types/database';
import {
  buildPresentationSlides,
  countPresentationPhotos,
  MIN_PRESENTATION_PHOTOS,
} from '@/lib/memorial/presentation';
import PresentationPlayer from '@/components/memorial/PresentationPlayer';

export const revalidate = 60;

interface Props { params: Promise<{ slug: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pet = await prisma.pet.findFirst({
    where: { memorial_slug: slug, is_public: true, moderation_status: { not: 'blocked' } },
    select: { name: true },
  });
  if (!pet) return { title: 'Apresentação não encontrada' };
  return { title: `Apresentação — ${pet.name} · Eterno Pet` };
}

export default async function PresentationPage({ params }: Props) {
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
  if (!canUse(ownerPlanId, 'presentation')) redirect(`/memorial/${slug}`);

  const entries = (await prisma.timelineEntry.findMany({
    where: { pet_id: pet.id },
    orderBy: { date: 'asc' },
  })) as unknown as TimelineEntry[];

  if (countPresentationPhotos(entries) < MIN_PRESENTATION_PHOTOS) {
    redirect(`/memorial/${slug}`);
  }

  const slides = buildPresentationSlides(pet, entries);
  const memorialUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eternopet.com.br'}/memorial/${slug}`;

  return (
    <PresentationPlayer
      slides={slides}
      memorialSlug={slug}
      petName={pet.name}
      memorialUrl={memorialUrl}
    />
  );
}
