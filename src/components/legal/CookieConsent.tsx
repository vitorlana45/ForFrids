'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';
import { getCookieConsent, setCookieConsent, type ConsentChoice } from '@/lib/cookie-consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  // Renderiza so no client e apenas se ainda nao ha escolha registrada (evita
  // flash de SSR e nao reaparece depois de decidido).
  useEffect(() => {
    if (!getCookieConsent()) setVisible(true);
  }, []);

  if (!visible) return null;

  function choose(choice: ConsentChoice) {
    setCookieConsent(choice);
    setVisible(false);
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[250] border-t border-outline-variant/20 bg-surface/95 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.35)] backdrop-blur-md animate-slide-up"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
    >
      <div className="mx-auto flex max-w-[1100px] flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed/40 text-primary">
            <Cookie className="h-5 w-5" />
          </span>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            Usamos cookies essenciais para o site funcionar e, com a sua permissão,
            cookies de telemetria para entender falhas e melhorar o Eterno Pet. Você
            pode recusar os não essenciais.{' '}
            <Link href="/privacidade" className="font-semibold text-primary underline-offset-4 hover:underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 self-end md:self-auto">
          <button
            type="button"
            onClick={() => choose('rejected')}
            className="rounded-full border border-outline-variant/40 px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            Rejeitar
          </button>
          <button
            type="button"
            onClick={() => choose('accepted')}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
