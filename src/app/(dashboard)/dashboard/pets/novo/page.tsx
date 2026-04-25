import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PetForm from '@/components/pets/PetForm';

export default async function NovoPetPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-on-surface">Criar página do pet</h1>
        <p className="mt-1 text-muted-foreground">
          Preencha as informações do seu companheiro especial.
        </p>
      </div>
      <PetForm userId={user.id} />
    </div>
  );
}
