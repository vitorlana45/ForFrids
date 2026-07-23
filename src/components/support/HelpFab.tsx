'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  Bug,
  HeartHandshake,
  LifeBuoy,
  Lightbulb,
  Loader2,
  MessageCircleMore,
  Paperclip,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { compress } from '@/lib/storage/compress';
import TurnstileWidget from '@/components/security/TurnstileWidget';
import { useToast } from '@/components/ui/toast';
import { createDonationCheckoutSession, createSupportTicket } from '@/lib/actions/support';
import { useSession } from '@/lib/auth-client';

type View = 'menu' | 'support' | 'suggestion' | 'bug' | 'donation';

const DONATION_OPTIONS = [10, 25, 50] as const;

const inputClass =
  'w-full rounded-2xl border border-outline-variant/25 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20';

const textareaClass = `${inputClass} resize-none leading-6`;

const viewMeta: Record<View, { title: string; eyebrow: string; description: string }> = {
  menu: {
    eyebrow: 'Estamos por perto',
    title: 'Como podemos ajudar?',
    description: 'Envie suporte, sugestões, bugs ou apoie o projeto com uma doação.',
  },
  support: {
    eyebrow: 'Suporte',
    title: 'Falar com suporte',
    description: 'Conte o que está acontecendo e responderemos pelo melhor canal disponível.',
  },
  suggestion: {
    eyebrow: 'Ideias',
    title: 'Sugerir melhoria',
    description: 'Sugira algo que deixaria o Eterno Pet mais acolhedor ou útil.',
  },
  bug: {
    eyebrow: 'Qualidade',
    title: 'Relatar bug',
    description: 'Inclua passos, resultado esperado e, se possível, uma imagem do problema.',
  },
  donation: {
    eyebrow: 'Apoio',
    title: 'Fazer doação',
    description: 'Ajude a manter o projeto ativo com uma contribuição voluntária.',
  },
};

function ActionCard({ icon, title, description, onClick }: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-start gap-4 rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface-container-low hover:shadow-card"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-fixed/25 text-primary transition-colors group-hover:bg-primary-fixed/40">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-on-surface">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-on-surface-variant">{description}</span>
      </span>
    </button>
  );
}

export default function HelpFab() {
  const pathname = usePathname();
  const { data } = useSession();
  const toast = useToast();
  const isAuthenticated = Boolean(data?.user?.id);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('menu');
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const [email, setEmail] = useState(data?.user?.email ?? '');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('');
  const [impact, setImpact] = useState('');

  const [bugSteps, setBugSteps] = useState('');
  const [bugExpected, setBugExpected] = useState('');
  const [bugActual, setBugActual] = useState('');
  const [bugImage, setBugImage] = useState<File | null>(null);

  const [donationAmount, setDonationAmount] = useState<number>(25);
  const [customDonation, setCustomDonation] = useState('');

  const turnstileRequired = !isAuthenticated && Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const hasMobileBottomNav = pathname === '/' || pathname.startsWith('/dashboard');
  const meta = viewMeta[view];

  const supportType = useMemo(() => {
    if (view === 'bug') return 'bug' as const;
    if (view === 'suggestion') return 'suggestion' as const;
    return 'support' as const;
  }, [view]);

  function closePanel() {
    setOpen(false);
    setView('menu');
  }

  function resetForm() {
    setTitle('');
    setMessage('');
    setCategory('');
    setImpact('');
    setBugSteps('');
    setBugExpected('');
    setBugActual('');
    setBugImage(null);
    setTurnstileToken(null);
  }

  async function uploadBugImage(file: File) {
    const compressed = await compress(file, 'timeline');
    const form = new FormData();
    form.append('file', compressed);
    const res = await fetch('/api/support/upload', { method: 'POST', body: form });
    if (!res.ok) throw new Error('Não foi possível enviar a imagem.');
    const data = await res.json();
    return data.url as string;
  }

  async function submitTicket() {
    if (turnstileRequired && !turnstileToken) {
      toast.error('Confirme o desafio anti-spam antes de enviar.');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (view === 'bug' && bugImage && isAuthenticated) {
        imageUrl = await uploadBugImage(bugImage);
      }

      const result = await createSupportTicket({
        type: supportType,
        title,
        message,
        category: category || undefined,
        impact: impact || undefined,
        steps: view === 'bug' ? bugSteps : undefined,
        expected_result: view === 'bug' ? bugExpected : undefined,
        actual_result: view === 'bug' ? bugActual : undefined,
        contact_email: isAuthenticated ? undefined : email,
        page_url: typeof window !== 'undefined' ? window.location.href : undefined,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        image_url: imageUrl,
        turnstile_token: turnstileToken ?? undefined,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Recebido! Protocolo: ${result.id?.slice(0, 8)}`);
      resetForm();
      closePanel();
    } finally {
      setSubmitting(false);
    }
  }

  async function startDonation() {
    const parsedCustom = Number(customDonation.replace(',', '.'));
    const amount = Number.isFinite(parsedCustom) && parsedCustom > 0 ? parsedCustom : donationAmount;
    setSubmitting(true);
    try {
      const result = await createDonationCheckoutSession({
        amount_brl: Math.round(amount),
        email: isAuthenticated ? undefined : email,
      });
      if (result.error || !result.url) {
        toast.error(result.error ?? 'Não foi possível iniciar a doação.');
        return;
      }
      window.location.assign(result.url);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed right-6 z-[240] inline-flex items-center gap-3 rounded-full bg-primary px-4 py-3 text-on-primary shadow-premium transition-all hover:-translate-y-0.5 hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim ${
          hasMobileBottomNav ? 'bottom-24 md:bottom-6' : 'bottom-6'
        }`}
        aria-label="Abrir central de ajuda"
      >
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
          <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
          <MessageCircleMore className="relative h-5 w-5" />
        </span>
        <span className="hidden text-sm font-semibold sm:inline">Ajuda</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[250] bg-black/35 p-4 backdrop-blur-sm" onClick={closePanel}>
          <div
            className="absolute bottom-24 right-4 flex max-h-[calc(100dvh-7rem)] w-[min(460px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[2rem] border border-outline-variant/20 bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="relative overflow-hidden border-b border-outline-variant/15 bg-gradient-to-br from-primary-fixed/30 via-surface-container-low to-surface px-6 py-5">
              <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-secondary/15 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-secondary">{meta.eyebrow}</p>
                  <h3 className="font-serif text-2xl text-on-surface">{meta.title}</h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-on-surface-variant">{meta.description}</p>
                </div>
                <button type="button" onClick={closePanel} className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container" aria-label="Fechar">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-5">
              {view === 'menu' && (
                <div className="grid gap-3">
                  <ActionCard icon={<LifeBuoy className="h-5 w-5" />} title="Falar com suporte" description="Dúvidas sobre conta, pagamentos, memorial ou configuração." onClick={() => setView('support')} />
                  <ActionCard icon={<Lightbulb className="h-5 w-5" />} title="Sugerir melhoria" description="Conte uma ideia que tornaria a plataforma melhor." onClick={() => setView('suggestion')} />
                  <ActionCard icon={<Bug className="h-5 w-5" />} title="Relatar bug" description="Envie contexto técnico e uma imagem opcional." onClick={() => setView('bug')} />
                  <ActionCard icon={<HeartHandshake className="h-5 w-5" />} title="Fazer doação" description="Apoie a manutenção do Eterno Pet com qualquer valor." onClick={() => setView('donation')} />
                  <a href="mailto:contato@eternopet.com" className="mt-1 inline-flex items-center justify-center rounded-full border border-outline-variant/30 px-4 py-2.5 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-container">
                    Preferir e-mail tradicional
                  </a>
                </div>
              )}

              {(view === 'support' || view === 'suggestion' || view === 'bug') && (
                <div className="space-y-3">
                  <button type="button" onClick={() => setView('menu')} className="mb-1 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline">
                    <ArrowLeft className="h-3.5 w-3.5" /> Voltar
                  </button>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className={inputClass} />
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Conte pra gente o contexto" className={textareaClass} />

                  {view === 'suggestion' && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Categoria" className={inputClass} />
                      <input value={impact} onChange={(e) => setImpact(e.target.value)} placeholder="Impacto esperado" className={inputClass} />
                    </div>
                  )}

                  {view === 'bug' && (
                    <>
                      <textarea value={bugSteps} onChange={(e) => setBugSteps(e.target.value)} rows={3} placeholder="Passos para reproduzir" className={textareaClass} />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <textarea value={bugExpected} onChange={(e) => setBugExpected(e.target.value)} rows={3} placeholder="Resultado esperado" className={textareaClass} />
                        <textarea value={bugActual} onChange={(e) => setBugActual(e.target.value)} rows={3} placeholder="Resultado obtido" className={textareaClass} />
                      </div>
                      <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-lowest px-4 py-4 text-sm transition-colors ${isAuthenticated ? 'hover:bg-surface-container-low' : 'cursor-not-allowed opacity-60'}`}>
                        <Paperclip className="h-5 w-5 text-primary" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-on-surface">{bugImage ? bugImage.name : 'Anexar uma imagem'}</span>
                          <span className="block text-xs text-on-surface-variant">PNG, JPG ou WEBP até 2MB. Apenas usuários logados.</span>
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          disabled={!isAuthenticated}
                          onChange={(e) => setBugImage(e.target.files?.[0] ?? null)}
                          className="sr-only"
                        />
                      </label>
                    </>
                  )}

                  {!isAuthenticated && (
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Seu e-mail para retorno" className={inputClass} />
                  )}
                  {turnstileRequired && <TurnstileWidget onVerify={setTurnstileToken} onExpire={() => setTurnstileToken(null)} />}
                  <button type="button" disabled={submitting} onClick={submitTicket} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-on-primary transition-colors hover:bg-[#3d4d41] disabled:opacity-60 dark:hover:bg-primary-fixed-dim">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Enviar solicitação
                  </button>
                </div>
              )}

              {view === 'donation' && (
                <div className="space-y-4">
                  <button type="button" onClick={() => setView('menu')} className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline">
                    <ArrowLeft className="h-3.5 w-3.5" /> Voltar
                  </button>
                  <div className="rounded-3xl bg-surface-container-low px-5 py-5">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-fixed/30 text-primary">
                        <Sparkles className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-serif text-xl text-on-surface">Seu apoio faz diferença</p>
                        <p className="text-xs text-on-surface-variant">Doação única via Stripe Checkout.</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {DONATION_OPTIONS.map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => {
                            setDonationAmount(amount);
                            setCustomDonation('');
                          }}
                          className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${donationAmount === amount && !customDonation ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'}`}
                        >
                          R$ {amount}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input value={customDonation} onChange={(e) => setCustomDonation(e.target.value)} placeholder="Outro valor (mín. R$ 1)" className={inputClass} />
                  {!isAuthenticated && (
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Seu e-mail" className={inputClass} />
                  )}
                  <button type="button" disabled={submitting} onClick={startDonation} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-on-primary transition-colors hover:bg-[#3d4d41] disabled:opacity-60 dark:hover:bg-primary-fixed-dim">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <HeartHandshake className="h-4 w-4" />} Continuar para doação
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
