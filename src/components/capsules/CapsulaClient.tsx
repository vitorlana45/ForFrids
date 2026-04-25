'use client';

import { useEffect, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import CapsuleCountdown from '@/components/capsules/CapsuleCountdown';
import CapsuleForm from '@/components/capsules/CapsuleForm';
import OperationLoader from '@/components/ui/OperationLoader';
import { openCapsule, deleteCapsule } from '@/lib/actions/capsules';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import type { TimeCapsule, Pet } from '@/types/database';
import { formatDate } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

export default function CapsulaClient() {
  const supabase = createClient();
  const confirm = useConfirm();
  const toast = useToast();
  const [capsules, setCapsules] = useState<(TimeCapsule & { pet: Pick<Pet, 'name' | 'species' | 'avatar_url'> })[]>([]);
  const [pets, setPets] = useState<Pick<Pet, 'id' | 'name' | 'species'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: petsData } = await supabase
        .from('pets').select('id, name, species, avatar_url').eq('owner_id', user.id);
      const petsList = (petsData ?? []) as Pick<Pet, 'id' | 'name' | 'species' | 'avatar_url'>[];
      setPets(petsList);

      if (petsList.length === 0) { setCapsules([]); return; }

      const petIds = petsList.map(p => p.id);
      const { data: capData } = await supabase
        .from('time_capsules').select('*').in('pet_id', petIds).order('open_at', { ascending: true });

      const raw = (capData ?? []) as TimeCapsule[];
      const petMap = Object.fromEntries(petsList.map(p => [p.id, p]));
      setCapsules(raw.map(c => ({ ...c, pet: petMap[c.pet_id] })));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleCreated() { setShowForm(false); load(); }

  function handleOpen(id: string) {
    startTransition(async () => {
      await openCapsule(id);
      setOpenedId(id);
      load();
    });
  }

  async function handleDelete(id: string) {
    const confirmed = await confirm({
      title: 'Excluir cápsula',
      message: 'Esta ação não pode ser desfeita. A cápsula e sua mensagem serão removidas permanentemente.',
      confirmLabel: 'Excluir',
      variant: 'danger',
    });
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteCapsule(id);
      if (result?.error) {
        toast.error('Erro ao excluir a cápsula. Tente novamente.');
      } else {
        toast.success('Cápsula excluída com sucesso.');
        load();
      }
    });
  }

  const ready = capsules.filter(c => !c.opened && new Date(c.open_at) <= new Date());
  const sealed = capsules.filter(c => !c.opened && new Date(c.open_at) > new Date());
  const opened = capsules.filter(c => c.opened);
  const featured = ready[0] ?? sealed[0];

  return (
    <div className="relative max-w-[1200px] mx-auto px-6 pt-32 pb-24 md:pb-12">
      <OperationLoader active={isPending} label="Atualizando capsulas" />

      <div className="flex items-end justify-between mb-12">
        <div>
          <span className="text-[11px] font-bold tracking-[0.3em] text-secondary uppercase block mb-2">
            CÁPSULA DO TEMPO
          </span>
          <h1 className="font-serif text-5xl text-on-surface">Mensagens para o Futuro</h1>
          <p className="text-on-surface-variant mt-3 max-w-lg">
            Escreva cartas seladas que só poderão ser lidas na data que você escolher.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            disabled={pets.length === 0}
            className="flex items-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-full font-serif font-medium hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim transition-all disabled:opacity-40 shrink-0"
          >
            <span className="material-symbols-outlined">add</span>
            Criar Cápsula
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-8 mb-12">
          <CapsuleForm pets={pets} onClose={() => setShowForm(false)} onCreated={handleCreated} />
        </div>
      )}

      {loading ? (
        <div className="relative min-h-[420px] rounded-3xl border border-outline-variant/10 bg-surface-container-low">
          <OperationLoader active={loading} label="Carregando capsulas" fullscreen={false} />
        </div>
      ) : capsules.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-low py-32 text-center">
          <span className="material-symbols-outlined text-[72px] text-outline mb-6">lock_clock</span>
          <h2 className="font-serif text-3xl text-on-surface mb-3">Nenhuma cápsula ainda</h2>
          <p className="text-on-surface-variant max-w-sm mb-8">
            Crie sua primeira cápsula do tempo — uma mensagem para você mesmo ou para quem você ama.
          </p>
          {pets.length > 0 ? (
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary text-on-primary px-8 py-4 rounded-full font-serif font-medium hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim transition-all"
            >
              Criar primeira cápsula
            </button>
          ) : (
            <p className="text-sm text-on-surface-variant">Crie um pet primeiro para adicionar cápsulas.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {featured && (
            <div className="lg:col-span-8 bg-surface-container-low rounded-3xl p-10 border border-outline-variant/10 relative overflow-hidden">
              <span className="material-symbols-outlined absolute -top-8 -right-8 text-[200px] text-primary/5 select-none pointer-events-none">lock_clock</span>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-secondary font-bold font-serif">
                    {featured.pet?.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-on-surface">{featured.pet?.name}</p>
                    <p className="text-xs text-on-surface-variant capitalize">{featured.pet?.species}</p>
                  </div>
                </div>
                <p className="text-[11px] font-bold tracking-[0.25em] text-secondary uppercase mb-3">
                  {new Date(featured.open_at) <= new Date() ? 'PRONTA PARA ABRIR' : 'CÁPSULA SELADA'}
                </p>
                <h2 className="font-serif text-3xl text-on-surface mb-8">{featured.title}</h2>
                <CapsuleCountdown openAt={featured.open_at} />
                <p className="text-sm text-on-surface-variant mt-4">
                  Agendada para {formatDate(featured.open_at)}
                </p>
                {new Date(featured.open_at) <= new Date() && (
                  <button
                    onClick={() => handleOpen(featured.id)}
                    disabled={isPending}
                    className="mt-8 flex items-center gap-2 bg-primary text-on-primary px-8 py-3 rounded-full font-serif font-medium hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim transition-all"
                  >
                    <span className="material-symbols-outlined">lock_open</span>
                    Abrir Cápsula
                  </button>
                )}
              </div>
            </div>
          )}

          <div className={`${featured ? 'lg:col-span-4' : 'lg:col-span-12'} flex flex-col gap-4`}>
            {[...sealed.slice(featured ? 1 : 0), ...ready.slice(featured ? 1 : 0), ...opened].map(cap => (
              <div
                key={cap.id}
                className={`bg-surface-container-lowest rounded-2xl p-6 border flex items-start gap-4 group relative ${
                  cap.opened ? 'border-outline-variant/10 opacity-60' : 'border-outline-variant/10'
                }`}
              >
                <span className={`material-symbols-outlined text-2xl flex-shrink-0 mt-0.5 ${
                  cap.opened ? 'text-outline' : new Date(cap.open_at) <= new Date() ? 'text-primary' : 'text-secondary'
                }`}>
                  {cap.opened ? 'lock_open' : 'lock'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-base text-on-surface truncate">{cap.title}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {cap.opened ? 'Aberta' : formatDate(cap.open_at)}
                  </p>
                  <p className="text-[10px] font-bold tracking-wider text-on-surface-variant/60 uppercase mt-1">
                    {cap.pet?.name}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {!cap.opened && new Date(cap.open_at) <= new Date() && (
                    <button
                      onClick={() => handleOpen(cap.id)}
                      disabled={isPending}
                      className="text-xs text-primary font-semibold hover:underline px-2"
                    >
                      Abrir
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(cap.id)}
                    disabled={isPending}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-error-container hover:text-error transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {cap.opened && cap.id === openedId && (
                  <div className="absolute inset-0 bg-surface-container-lowest/95 rounded-2xl p-6 flex flex-col">
                    <p className="font-serif italic text-on-surface text-sm leading-relaxed line-clamp-4">
                      "{cap.message}"
                    </p>
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={() => setShowForm(true)}
              disabled={pets.length === 0}
              className="w-full py-4 rounded-2xl border border-dashed border-outline-variant text-on-surface-variant text-sm hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Nova cápsula
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
