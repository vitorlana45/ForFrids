'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { compress } from '@/lib/storage/compress';
import { createPet, updatePet } from '@/lib/actions/pets';
import { Loader2, Upload } from 'lucide-react';

interface Props {
  firstName: string;
  userId: string;
}

const SPECIES = ['Cachorro', 'Gato', 'Coelho', 'Pássaro', 'Peixe', 'Outro'];

type Step = 'welcome' | 'create' | 'done';

export default function OnboardingWizard({ firstName, userId }: Props) {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [customSpecies, setCustomSpecies] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdSlug, setCreatedSlug] = useState('');
  const [createdName, setCreatedName] = useState('');

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.currentTarget.value = '';
  }

  async function handleCreate() {
    const petSpecies = species === 'Outro' ? customSpecies.trim() : species;
    if (!name.trim() || !petSpecies) return;

    setSubmitting(true);
    setError('');

    const result = await createPet({ name: name.trim(), species: petSpecies, is_public: true });

    if (result.error === 'UPGRADE_REQUIRED') {
      router.push('/dashboard/planos');
      return;
    }
    if (result.error || !result.petId || !result.slug) {
      setError(result.error ?? 'Erro ao criar memorial.');
      setSubmitting(false);
      return;
    }

    if (avatarFile) {
      try {
        const compressed = await compress(avatarFile, 'avatar');
        const path = `pets/${userId}/${result.petId}/avatar-${Date.now()}.webp`;
        const form = new FormData();
        form.append('file', compressed);
        form.append('path', path);
        const res = await fetch('/api/upload', { method: 'POST', body: form });
        if (res.ok) {
          const { url } = await res.json();
          const petSpeciesForUpdate = species === 'Outro' ? customSpecies.trim() : species;
          await updatePet(result.petId, { name: name.trim(), species: petSpeciesForUpdate, is_public: true, avatar_url: url as string });
        }
      } catch {
        // photo failure doesn't block onboarding
      }
    }

    setCreatedSlug(result.slug);
    setCreatedName(name.trim());
    setSubmitting(false);
    setStep('done');
  }

  const selectedSpecies = species === 'Outro' ? customSpecies : species;
  const canSubmit = name.trim().length > 0 && selectedSpecies.trim().length > 0 && !submitting;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eternopet.com.br';

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 py-16 text-center botanical-bg">
        <div className="max-w-lg w-full space-y-8">
          <div className="space-y-2">
            <p className="font-serif text-xl text-primary">Eterno Pet</p>
            <h1 className="font-serif text-4xl md:text-5xl text-on-surface leading-tight">
              Olá, {firstName}!<br />
              <span className="italic text-primary">Bem-vindo.</span>
            </h1>
          </div>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            Em menos de 2 minutos você terá o primeiro memorial criado —
            pronto para compartilhar com quem você ama.
          </p>

          <div className="grid grid-cols-3 gap-4 text-left">
            {[
              { n: '1', label: 'Crie o pet', desc: 'Nome, espécie e foto' },
              { n: '2', label: 'Personalize', desc: 'Timeline e crônicas' },
              { n: '3', label: 'Compartilhe', desc: 'Link único do memorial' },
            ].map(s => (
              <div key={s.n} className="rounded-2xl bg-surface-container-low border border-outline-variant/20 p-4 space-y-1">
                <span className="font-serif text-3xl text-primary/30">{s.n}</span>
                <p className="font-semibold text-sm text-on-surface">{s.label}</p>
                <p className="text-xs text-on-surface-variant">{s.desc}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep('create')}
            className="w-full bg-primary text-on-primary py-4 rounded-full font-serif text-lg font-medium hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim transition-all"
          >
            Vamos começar
          </button>
        </div>
      </div>
    );
  }

  if (step === 'create') {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 py-16 botanical-bg">
        <div className="max-w-md w-full space-y-8">

          {/* Progress */}
          <div className="flex items-center gap-2 justify-center">
            <div className="h-2 w-16 rounded-full bg-primary" />
            <div className="h-2 w-16 rounded-full bg-primary" />
            <div className="h-2 w-16 rounded-full bg-surface-container-high" />
          </div>

          <div className="text-center">
            <h2 className="font-serif text-3xl text-on-surface">Quem é seu pet?</h2>
            <p className="mt-2 text-on-surface-variant">Você pode adicionar mais detalhes depois.</p>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="group relative w-28 h-28 rounded-full border-2 border-dashed border-outline-variant/50 bg-surface-container flex items-center justify-center overflow-hidden hover:border-primary transition-colors"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-on-surface-variant group-hover:text-primary transition-colors">
                  <Upload className="h-6 w-6" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Foto</span>
                </div>
              )}
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <p className="text-xs text-on-surface-variant">Opcional — pode adicionar depois</p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface">
              Nome do pet <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Frids, Max, Luna…"
              autoFocus
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Species pills */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-on-surface">
              Espécie <span className="text-primary">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SPECIES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpecies(s)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all border ${
                    species === s
                      ? 'bg-primary text-on-primary border-primary'
                      : 'border-outline-variant/40 text-on-surface-variant hover:border-primary hover:text-primary'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {species === 'Outro' && (
              <input
                type="text"
                value={customSpecies}
                onChange={e => setCustomSpecies(e.target.value)}
                placeholder="Qual espécie?"
                autoFocus
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('welcome')}
              className="px-6 py-3 rounded-full border border-outline-variant/40 text-on-surface-variant text-sm hover:bg-surface-container transition-colors"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!canSubmit}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-on-primary py-3 rounded-full font-semibold text-sm hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim disabled:opacity-50 transition-all"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar memorial
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Done
  const memorialUrl = `${siteUrl}/memorial/${createdSlug}`;
  const whatsappText = encodeURIComponent(`✨ Criei o memorial de ${createdName} no Eterno Pet:\n${memorialUrl}`);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 py-16 text-center botanical-bg">
      <div className="max-w-md w-full space-y-8">

        {/* Progress */}
        <div className="flex items-center gap-2 justify-center">
          <div className="h-2 w-16 rounded-full bg-primary" />
          <div className="h-2 w-16 rounded-full bg-primary" />
          <div className="h-2 w-16 rounded-full bg-primary" />
        </div>

        <div className="space-y-3">
          <span className="material-symbols-outlined text-[72px] text-primary">eco</span>
          <h2 className="font-serif text-4xl text-on-surface">
            Memorial de {createdName} criado!
          </h2>
          <p className="text-on-surface-variant">
            Agora você pode adicionar fotos, momentos da timeline e crônicas.
          </p>
        </div>

        <div className="rounded-2xl bg-surface-container-low border border-outline-variant/20 p-4">
          <p className="text-xs text-on-surface-variant mb-2">Link do memorial</p>
          <p className="font-mono text-sm text-primary break-all">{memorialUrl}</p>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-3 rounded-full bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1DA851] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
            Compartilhar no WhatsApp
          </a>

          <a
            href={`/memorial/${createdSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-full border border-outline-variant/40 text-on-surface-variant text-sm font-semibold hover:bg-surface-container transition-colors"
          >
            Ver memorial público
          </a>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 rounded-full bg-surface-container text-on-surface text-sm font-semibold hover:bg-surface-container-high transition-colors"
          >
            Ir ao dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
