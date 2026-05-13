import { redirect } from 'next/navigation';
import ApprovalsBoard, {
  type PendingTribute,
  type ReviewedTribute,
} from '@/components/tributes/ApprovalsBoard';
import { getServerSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export default async function ApprovalsPage() {
  const session = await getServerSession();
  if (!session) redirect('/entrar');
  const userId = session.user.id;

  const pets = await prisma.pet.findMany({
    where: { owner_id: userId },
    select: { id: true, name: true, memorial_slug: true },
    orderBy: { created_at: 'desc' },
  });

  const petIds = pets.map(pet => pet.id);
  let pendingTributes: PendingTribute[] = [];
  let approvedHistory: ReviewedTribute[] = [];

  if (petIds.length > 0) {
    const tributesData = await prisma.tribute.findMany({
      where: { pet_id: { in: petIds }, status: 'pending' },
      orderBy: { created_at: 'desc' },
    });

    const petMap = new Map(pets.map(pet => [pet.id, pet]));

    pendingTributes = tributesData
      .map((tribute) => {
        const pet = petMap.get(tribute.pet_id);
        if (!pet) return null;
        return { ...tribute, pet } as unknown as PendingTribute;
      })
      .filter(Boolean) as PendingTribute[];

    const approvedData = await prisma.tribute.findMany({
      where: { pet_id: { in: petIds }, status: 'approved' },
      orderBy: { reviewed_at: 'desc' },
      take: 40,
    });

    approvedHistory = approvedData
      .map((tribute) => {
        const pet = petMap.get(tribute.pet_id);
        if (!pet) return null;
        return { ...tribute, pet } as unknown as ReviewedTribute;
      })
      .filter(Boolean) as ReviewedTribute[];
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

      <ApprovalsBoard initialTributes={pendingTributes} initialApprovedHistory={approvedHistory} />
    </div>
  );
}
