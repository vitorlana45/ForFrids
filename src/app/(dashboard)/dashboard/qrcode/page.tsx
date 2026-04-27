import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { canUse, getEffectivePlanServer } from '@/lib/plans';
import QRGenerator from '@/components/qrcode/QRGenerator';
import LockedFeaturePreview from '@/components/ui/LockedFeaturePreview';
import type { Pet } from '@/types/database';

export default async function QRCodePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  const planId = await getEffectivePlanServer(user.id);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eternopet.com.br';

  if (!canUse(planId, 'qrcode')) {
    const previewPets: Pick<Pet, 'id' | 'name' | 'species' | 'memorial_slug'>[] = [
      {
        id: 'preview-pet',
        name: 'Fridis',
        species: 'Cachorro',
        memorial_slug: 'fridis-memorial',
      },
    ];

    return (
      <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-32 md:pb-12">
        <div className="mb-12">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.3em] text-secondary">
            QR CODE
          </span>
          <h1 className="font-serif text-5xl text-on-surface">QR do Memorial</h1>
          <p className="mt-3 max-w-lg text-on-surface-variant">
            Gere o QR Code do memorial do seu pet para compartilhar ou imprimir em objetos fisicos.
          </p>
        </div>
        <LockedFeaturePreview
          feature="QR Code do Memorial"
          description="Gere QR codes para imprimir em objetos fisicos com os planos Premium e Eterno."
          minHeight="min-h-[680px]"
        >
          <QRGenerator pets={previewPets} siteUrl={siteUrl} />
        </LockedFeaturePreview>
      </div>
    );
  }

  const { data } = await supabase
    .from('pets')
    .select('id, name, species, memorial_slug')
    .eq('owner_id', user.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  const pets = (data as Pick<Pet, 'id' | 'name' | 'species' | 'memorial_slug'>[] | null) ?? [];

  return (
    <div className="max-w-[1200px] mx-auto px-6 pt-32 pb-24 md:pb-12">
      <div className="mb-12">
        <span className="text-[11px] font-bold tracking-[0.3em] text-secondary uppercase block mb-2">
          QR CODE
        </span>
        <h1 className="font-serif text-5xl text-on-surface">QR do Memorial</h1>
        <p className="text-on-surface-variant mt-3 max-w-lg">
          Gere o QR Code do memorial do seu pet para compartilhar ou imprimir em objetos fisicos.
        </p>
      </div>

      <QRGenerator pets={pets} siteUrl={siteUrl} />
    </div>
  );
}
