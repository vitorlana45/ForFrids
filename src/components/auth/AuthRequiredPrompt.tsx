'use client';

import Link from 'next/link';
import { X } from 'lucide-react';

interface Props {
  title?: string;
  description?: string;
  contextLabel?: string;
  onClose?: () => void;
}

export default function AuthRequiredPrompt({
  title = 'Entre para continuar',
  description = 'Crie uma conta ou entre para realizar esta ação com segurança.',
  contextLabel,
  onClose,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-inverse-surface/45 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-required-title"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-8 shadow-premium animate-slide-up">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <span className="material-symbols-outlined absolute -right-8 -top-8 text-[120px] text-primary/5 select-none">
          lock
        </span>

        <div className="relative z-10">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
            <span className="material-symbols-outlined">person_check</span>
          </div>

          {contextLabel && (
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-secondary">
              {contextLabel}
            </p>
          )}

          <h3 id="auth-required-title" className="font-serif text-2xl text-on-surface">{title}</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
            {description}
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link
              href="/entrar"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim"
            >
              Entrar
            </Link>
            <Link
              href="/cadastrar"
              className="inline-flex items-center justify-center rounded-full border border-outline-variant/50 px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-surface-container"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
