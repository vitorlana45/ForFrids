import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import ChronicleEditor from '@/components/chronicles/ChronicleEditor';
import LockedFeaturePreview from '@/components/ui/LockedFeaturePreview';
import { canUse, getEffectivePlanServer } from '@/lib/plans';
import { getServerSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import type { Chronicle, Pet } from '@/types/database';

interface Props {
  params: Promise<{ slug: string; chronicleId: string }>;
}

export default async function EditChroniclePage({ params }: Props) {
  const { slug, chronicleId } = await params;
  const session = await getServerSession();
  if (!session) redirect('/entrar');
  const userId = session.user.id;

  const petData = await prisma.pet.findFirst({
    where: { memorial_slug: slug, owner_id: userId },
  });

  const pet = petData as unknown as Pet | null;
  if (!pet) notFound();

  const chronicleData = await prisma.chronicle.findFirst({
    where: { id: chronicleId, pet_id: pet.id },
  });

  const chronicle = chronicleData as unknown as Chronicle | null;
  if (!chronicle) notFound();

  const planId = await getEffectivePlanServer(userId);
  const canUseChronicles = canUse(planId, 'chronicles');

  return (
    <div className="mx-auto min-h-screen max-w-[1200px] px-6 pb-28 pt-32 animate-fade-in">
      <header className="mb-10">
        <Link href={`/dashboard/pets/${pet.memorial_slug}/diario`} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Voltar ao diario
        </Link>
        <h1 className="font-serif text-5xl text-on-surface">Editar cronica</h1>
        <p className="mt-3 max-w-2xl text-lg text-on-surface-variant">
          Ajuste texto, capa, fase e status de publicacao.
        </p>
      </header>

      {canUseChronicles ? (
        <ChronicleEditor pet={pet} userId={userId} chronicle={chronicle} />
      ) : (
        <LockedFeaturePreview
          feature="Diario de Cronicas"
          description="A edicao de cronicas esta disponivel nos planos Premium e Eterno. Voce ainda pode remover cronicas antigas pelo diario."
          minHeight="min-h-[760px]"
        >
          <ChronicleEditor pet={pet} userId={userId} chronicle={chronicle} />
        </LockedFeaturePreview>
      )}
    </div>
  );
}
