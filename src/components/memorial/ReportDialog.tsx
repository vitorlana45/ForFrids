'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Send, X } from 'lucide-react';
import { reportMemorial } from '@/lib/actions/reports';
import TurnstileWidget from '@/components/security/TurnstileWidget';

const CATEGORIES = [
  { id: 'sexual_content', label: 'Conteúdo sexual ou nudez' },
  { id: 'child_safety', label: 'Risco a menores de idade' },
  { id: 'animal_cruelty', label: 'Maus-tratos a animais' },
  { id: 'hate_speech', label: 'Discurso de ódio / discriminação' },
  { id: 'harassment', label: 'Assédio ou bullying' },
  { id: 'personal_info', label: 'Dados pessoais de terceiros' },
  { id: 'fake_memorial', label: 'Memorial falso (pet vivo, pessoa, marca)' },
  { id: 'copyright', label: 'Conteúdo plagiado / direitos autorais' },
  { id: 'spam', label: 'Spam ou propaganda' },
  { id: 'other', label: 'Outro motivo' },
] as const;

type Category = (typeof CATEGORIES)[number]['id'];

interface Props {
  memorialSlug: string;
  petName: string;
  isAuthenticated: boolean;
  onClose: () => void;
}

export default function ReportDialog({ memorialSlug, petName, isAuthenticated, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [category, setCategory] = useState<Category | ''>('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setMounted(true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const turnstileRequired = !isAuthenticated && Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!category) {
      setError('Selecione o motivo da denúncia.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Conte um pouco mais sobre o problema (mín. 10 caracteres).');
      return;
    }
    if (!isAuthenticated && !email.trim()) {
      setError('Informe seu e-mail para que possamos confirmar a denúncia.');
      return;
    }
    if (turnstileRequired && !turnstileToken) {
      setError('Confirme o desafio anti-spam antes de enviar.');
      return;
    }

    setSubmitting(true);
    const result = await reportMemorial({
      memorial_slug: memorialSlug,
      category,
      description: description.trim(),
      reporter_email: isAuthenticated ? undefined : email.trim(),
      turnstile_token: turnstileToken ?? undefined,
    });
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setSent(true);
    window.setTimeout(onClose, 1800);
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8 backdrop-blur-sm md:items-center md:pt-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Denunciar memorial"
    >
      <div
        className="relative my-auto w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl md:p-8 max-h-[calc(100dvh-2rem)] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {sent ? (
          <div className="py-8 text-center">
            <span className="material-symbols-outlined mb-3 block text-5xl text-primary">verified</span>
            <h2 className="mb-2 font-serif text-2xl text-on-surface">Denúncia recebida</h2>
            <p className="text-sm text-on-surface-variant">
              Nossa equipe vai analisar o conteúdo de {petName} em breve. Obrigado por ajudar a manter o Eterno Pet seguro.
            </p>
          </div>
        ) : (
          <>
            <h2 className="mb-1 font-serif text-2xl text-on-surface">Denunciar memorial</h2>
            <p className="mb-6 text-sm text-on-surface-variant">
              Use este formulário se o memorial de {petName} contém conteúdo que viola nossas diretrizes.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-on-surface" htmlFor="report-category">
                  Motivo
                </label>
                <select
                  id="report-category"
                  value={category}
                  onChange={e => setCategory(e.target.value as Category)}
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="">Selecione...</option>
                  {CATEGORIES.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-on-surface" htmlFor="report-description">
                  O que aconteceu?
                </label>
                <textarea
                  id="report-description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  maxLength={2000}
                  rows={5}
                  placeholder="Descreva o que você viu e por que considera inadequado."
                  className="w-full resize-none rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <p className="mt-1 text-right text-xs text-on-surface-variant">{description.length}/2000</p>
              </div>

              {!isAuthenticated && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-on-surface" htmlFor="report-email">
                    Seu e-mail
                  </label>
                  <input
                    id="report-email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Usado apenas se precisarmos de mais detalhes sobre a denúncia.
                  </p>
                </div>
              )}

              {turnstileRequired && (
                <TurnstileWidget
                  onVerify={setTurnstileToken}
                  onExpire={() => setTurnstileToken(null)}
                />
              )}

              {error && (
                <p className="rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || (turnstileRequired && !turnstileToken)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-on-primary transition-colors hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar denúncia
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
