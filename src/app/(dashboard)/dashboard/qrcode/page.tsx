import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import QRGenerator from '@/components/qrcode/QRGenerator';
import type { Pet } from '@/types/database';

export default async function QRCodePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  const { data } = await supabase
    .from('pets')
    .select('id, name, species, memorial_slug')
    .eq('owner_id', user.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  const pets = (data as Pick<Pet, 'id' | 'name' | 'species' | 'memorial_slug'>[] | null) ?? [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eternopet.com.br';

  return (
    <div className="max-w-[1200px] mx-auto px-6 pt-32 pb-24 md:pb-12">
      <div className="mb-12">
        <span className="text-[11px] font-bold tracking-[0.3em] text-secondary uppercase block mb-2">
          QR CODE
        </span>
        <h1 className="font-serif text-5xl text-on-surface">QR do Memorial</h1>
        <p className="text-on-surface-variant mt-3 max-w-lg">
          Gere o QR Code do memorial do seu pet para compartilhar ou imprimir em objetos físicos.
        </p>
      </div>

      <QRGenerator pets={pets} siteUrl={siteUrl} />
    </div>
  );
}
