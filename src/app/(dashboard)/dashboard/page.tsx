import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PetDashboardCard from '@/components/dashboard/PetDashboardCard';
import { getMemorialCompletion } from '@/lib/memorial-completion';
import type { Pet, Profile } from '@/types/database';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  const { data: petsData } = await supabase
    .from('pets').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
  const pets = (petsData as Pet[] | null) ?? [];

  const { data: profileData } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  const profile = profileData as Profile | null;

  const firstPet = pets[0] ?? null;
  const { data: firstPetTimelineData } = firstPet
    ? await supabase
        .from('timeline_entries')
        .select('photo_urls')
        .eq('pet_id', firstPet.id)
    : { data: [] };
  const firstPetTimeline = (firstPetTimelineData as { photo_urls: string[] | null }[] | null) ?? [];
  const firstPetCompletion = firstPet
    ? getMemorialCompletion({
        pet: firstPet,
        timelineEntryCount: firstPetTimeline.length,
        timelinePhotoCount: firstPetTimeline.reduce(
          (total, entry) => total + ((entry.photo_urls ?? []).filter(Boolean).length),
          0,
        ),
      })
    : null;

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Tutor';

  return (
    <div className="max-w-[1200px] mx-auto px-6 pb-24 md:pb-12 botanical-bg">

      {/* Welcome */}
      <header className="mb-16">
        <h1 className="font-serif text-5xl text-on-surface mb-2">Olá, {firstName}</h1>
        <p className="text-lg text-on-surface-variant max-w-2xl">
          Bem-vindo de volta ao seu santuário de memórias. Um espaço para honrar e celebrar cada momento vivido.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ?? Left column ?? */}
        <div className="lg:col-span-8 space-y-16">

          {/* Quick Actions */}
          <section>
            <h2 className="font-serif text-3xl mb-6">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/dashboard/pets/novo" className="flex flex-col items-start p-6 bg-primary text-on-primary rounded-xl shadow-sm hover:opacity-90 transition-all text-left">
                <span className="material-symbols-outlined text-3xl mb-4 text-on-primary">add_a_photo</span>
                <span className="font-semibold text-on-primary">Novo Momento</span>
              </Link>
              <Link
                href={pets[0] ? `/dashboard/pets/${pets[0].memorial_slug}/diario/novo` : '/dashboard/pets/novo'}
                className="flex flex-col items-start p-6 bg-surface-container-high border border-outline-variant/30 rounded-xl hover:bg-surface-container-highest transition-all text-left"
              >
                <span className="material-symbols-outlined text-3xl mb-4 text-primary">edit_note</span>
                <span className="font-semibold text-on-surface">Escrever Crônica</span>
              </Link>
              <Link href="/dashboard/qrcode" className="flex flex-col items-start p-6 bg-surface-container-high border border-outline-variant/30 rounded-xl hover:bg-surface-container-highest transition-all text-left">
                <span className="material-symbols-outlined text-3xl mb-4 text-primary">qr_code_2</span>
                <span className="font-semibold text-on-surface">Gerar QR Code</span>
              </Link>
            </div>
          </section>

          {/* My Pets */}
          <section>
            <div className="flex justify-between items-end mb-6">
              <h2 className="font-serif text-3xl">Meus Pets</h2>
              <Link href="/dashboard/pets/novo" className="text-primary text-sm font-semibold hover:underline">
                + Adicionar
              </Link>
            </div>

            {pets.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-low py-24 text-center">
                <span className="material-symbols-outlined text-[64px] text-outline mb-4">cruelty_free</span>
                <h3 className="font-serif text-2xl text-on-surface mb-2">Nenhum pet ainda</h3>
                <p className="text-on-surface-variant max-w-xs mb-6">Crie a primeira página em honra ao seu companheiro especial.</p>
                <Link href="/dashboard/pets/novo" className="bg-primary text-on-primary px-8 py-3 rounded-full font-serif text-sm hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim transition-all">
                  Criar primeira página
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {pets.map(pet => (
                  <PetDashboardCard key={pet.id} pet={pet} />
                ))}
              </div>
            )}
          </section>

          {/* Recent Memories */}
          {pets.length > 0 && (
            <section>
              <h2 className="font-serif text-3xl mb-6">Memórias Recentes</h2>
              <div className="space-y-6">
                <div className="flex gap-6 items-start relative pb-8">
                  <div className="absolute left-4 top-8 bottom-0 w-px bg-outline-variant" />
                  <div className="w-8 h-8 rounded-full bg-primary-fixed flex-shrink-0 flex items-center justify-center z-10 border-4 border-surface">
                    <span className="material-symbols-outlined text-sm text-primary">auto_stories</span>
                  </div>
                  <div className="flex-1 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold tracking-widest text-on-surface-variant uppercase">Adicione sua primeira memória</span>
                    </div>
                    <h4 className="font-serif text-xl mb-2">Registre um momento especial</h4>
                    <p className="text-on-surface-variant mb-4">Use o botão "Novo Momento" para registrar fotos e histórias.</p>
                    <Link href="/dashboard/pets/novo" className="text-primary font-semibold text-sm flex items-center gap-1">
                      Começar agora <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* ?? Right sidebar ?? */}
        <aside className="lg:col-span-4 space-y-8">

          {/* Upcoming Dates */}
          <section className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/20">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">event</span>
              <h3 className="font-serif text-xl">Próximas Datas</h3>
            </div>
            {pets.filter(p => p.birth_date).slice(0, 2).length === 0 ? (
              <p className="text-sm text-on-surface-variant">Adicione datas de nascimento aos seus pets para ver lembretes aqui.</p>
            ) : (
              <div className="space-y-6">
                {pets.filter(p => p.birth_date).slice(0, 2).map(pet => (
                  <div key={pet.id} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-surface-container-lowest rounded-xl flex flex-col items-center justify-center shadow-sm">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase">
                        {new Date(pet.birth_date!).toLocaleString('pt-BR', { month: 'short' }).toUpperCase()}
                      </span>
                      <span className="text-lg font-serif leading-none text-primary">
                        {new Date(pet.birth_date!).getDate()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-on-surface">Aniversário de {pet.name}</h4>
                      <p className="text-sm text-on-surface-variant capitalize">{pet.species}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/dashboard/capsulas" className="w-full mt-8 py-3 px-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors block text-center">
              Ver Cápsulas do Tempo
            </Link>
          </section>

          {/* Progress */}
          {firstPet && firstPetCompletion && (
            <section className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/20">
              <h3 className="font-serif text-xl mb-4 text-on-surface">Memorial de {firstPet.name}</h3>
              <p className="text-sm text-on-surface-variant mb-6">Complete o perfil para criar uma página memorável.</p>
              <div className="w-full bg-surface-container-high rounded-full h-2 mb-6 overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${firstPetCompletion.percent}%` }} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-on-surface-variant">
                  {firstPetCompletion.percent}% completo
                </p>
                {firstPetCompletion.nextAction && (
                  <p className="text-right text-xs font-semibold text-primary">
                    {firstPetCompletion.nextAction}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Support */}
          <section className="p-4">
            <div className="rounded-2xl border border-dashed border-outline-variant p-6 flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-outline text-4xl mb-3">psychology_alt</span>
              <h4 className="font-serif text-lg text-on-surface mb-2">Espaço de Apoio</h4>
              <p className="text-sm text-on-surface-variant mb-4">Leia artigos sobre como lidar com o luto e encontrar paz.</p>
              <button className="text-secondary font-semibold text-sm hover:underline">Acessar conteúdo</button>
            </div>
          </section>
        </aside>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-2 h-16 bg-surface/80 backdrop-blur-md border-t border-outline-variant/20">
        {[
          { icon: 'home', label: 'Início', active: true, href: '/dashboard' },
          { icon: 'auto_stories', label: 'Memórias', active: false, href: '#' },
          { icon: 'event', label: 'Lembretes', active: false, href: '#' },
          { icon: 'person', label: 'Perfil', active: false, href: '#' },
        ].map(item => (
          <Link key={item.label} href={item.href} className={`flex flex-col items-center justify-center scale-95 active:scale-90 transition-transform duration-200 ${item.active ? 'text-primary' : 'text-on-surface-variant'}`}>
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-serif text-[11px] tracking-wide">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
