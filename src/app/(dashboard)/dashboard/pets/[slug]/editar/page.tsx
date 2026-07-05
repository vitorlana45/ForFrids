import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { isPetEditable } from '@/lib/security/access';
import PetEditTabs from '@/components/pets/PetEditTabs';
import ModerationBanner from '@/components/pets/ModerationBanner';
import type { Pet, TimelineEntry, Tribute } from '@/types/database';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditarPetPage({ params }: Props) {
  const { slug } = await params;
  const session = await getServerSession();
  if (!session) redirect('/entrar');
  const userId = session.user.id;

  const petData = await prisma.pet.findFirst({
    where: { memorial_slug: slug, owner_id: userId },
  });

  const pet = petData as unknown as Pet | null;
  if (!pet) notFound();

  const editable = await isPetEditable(pet.id);

  const moderation = petData as unknown as {
    moderation_status?: 'active' | 'flagged' | 'hidden' | 'blocked';
    blocked_reason?: string | null;
    blocked_at?: Date | null;
  };
  const moderationStatus = moderation.moderation_status ?? 'active';

  const [
    entries,
    pendingTributes,
    approvedTributesCount,
    likesCount,
    chroniclesCount,
  ] = editable
    ? await Promise.all([
        prisma.timelineEntry.findMany({
          where: { pet_id: pet.id },
          orderBy: { date: 'asc' },
        }),
        prisma.tribute.findMany({
          where: { pet_id: pet.id, status: 'pending' },
          orderBy: { created_at: 'desc' },
        }),
        prisma.tribute.count({ where: { pet_id: pet.id, status: 'approved' } }),
        prisma.memorialReaction.count({ where: { pet_id: pet.id, reaction_type: 'heart' } }),
        prisma.chronicle.count({ where: { pet_id: pet.id } }),
      ])
    : [[], [], 0, 0, 0];

  return (
    <div className="mx-auto max-w-[1100px] px-6 pb-24 animate-fade-in">
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

      {moderationStatus !== 'active' && (
        <ModerationBanner
          status={moderationStatus}
          reason={moderation.blocked_reason}
          blockedAt={moderation.blocked_at}
        />
      )}

      {editable ? (
        <PetEditTabs
          userId={userId}
          pet={pet}
          entries={entries as unknown as TimelineEntry[]}
          pendingTributes={pendingTributes as unknown as Tribute[]}
          approvedTributesCount={approvedTributesCount}
          likesCount={likesCount}
          chroniclesCount={chroniclesCount}
        />
      ) : (
        <div className="bg-surface-container rounded-3xl p-10 text-center space-y-4">
          <h2 className="font-serif text-2xl text-on-surface italic">Em modo lembrança</h2>
          <p className="text-on-surface-variant">
            O memorial de {pet.name} continua no ar para todos que o amam,
            mas a edição está pausada no plano gratuito.
          </p>
          <Link href="/dashboard/planos" className="inline-block bg-primary text-on-primary px-8 py-3 rounded-full font-serif">
            Reativar o Premium
          </Link>
        </div>
      )}
    </div>
  );
}
