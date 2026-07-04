import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import PetForm from '@/components/pets/PetForm';
import LockedFeaturePreview from '@/components/ui/LockedFeaturePreview';
import { getEffectivePlanServer, maxPets } from '@/lib/plans';

export default async function NovoPetPage() {
  const session = await getServerSession();
  if (!session) redirect('/entrar');
  const userId = session.user.id;

  const planId = await getEffectivePlanServer(userId);
  const count = await prisma.pet.count({ where: { owner_id: userId } });
  const reachedPetLimit = count >= maxPets(planId);

  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-on-surface">Criar pagina do Pet</h1>
        <p className="mt-1 text-muted-foreground">
          Preencha as informacoes do seu companheiro especial.
        </p>
      </div>
      {reachedPetLimit ? (
        <LockedFeaturePreview
          feature="Mais memoriais ativos"
          description="Crie mais paginas de pets no plano Premium."
          minHeight="min-h-[760px]"
        >
          <PetForm userId={userId} />
        </LockedFeaturePreview>
      ) : (
        <PetForm userId={userId} />
      )}
    </div>
  );
}
