import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PetForm from '@/components/pets/PetForm';
import LockedFeaturePreview from '@/components/ui/LockedFeaturePreview';
import { getEffectivePlanServer, maxPets } from '@/lib/plans';

export default async function NovoPetPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  const planId = await getEffectivePlanServer(user.id);
  const { count } = await supabase
    .from('pets')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', user.id);
  const reachedPetLimit = (count ?? 0) >= maxPets(planId);

  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-on-surface">Criar pagina do pet</h1>
        <p className="mt-1 text-muted-foreground">
          Preencha as informacoes do seu companheiro especial.
        </p>
      </div>
      {reachedPetLimit ? (
        <LockedFeaturePreview
          feature="Mais memoriais ativos"
          description="Crie mais paginas de pets nos planos Premium e Eterno."
          minHeight="min-h-[760px]"
        >
          <PetForm userId={user.id} />
        </LockedFeaturePreview>
      ) : (
        <PetForm userId={user.id} />
      )}
    </div>
  );
}
