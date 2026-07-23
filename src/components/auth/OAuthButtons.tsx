'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

// Espelha o gate do servidor em src/lib/auth.ts (google so e registrado com
// GOOGLE_CLIENT_ID/SECRET). Sem esta flag publica, o botao chamaria um provider
// inexistente e o Better Auth responderia 404 ("Provider not found").
const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true';

interface Props {
  dividerLabel?: string;
  // Quando true, bloqueia o login social ate o consentimento ser dado. Usado no
  // cadastro (aceite obrigatorio dos Termos); no login normal fica desligado.
  consentRequired?: boolean;
  consentGiven?: boolean;
  onConsentMissing?: () => void;
}

export default function OAuthButtons({
  dividerLabel = 'ou continue com',
  consentRequired = false,
  consentGiven = false,
  onConsentMissing,
}: Props) {
  const [loading, setLoading] = useState<'google' | null>(null);

  if (!googleEnabled) return null;

  async function signInWithGoogle() {
    if (consentRequired && !consentGiven) {
      onConsentMissing?.();
      return;
    }
    setLoading('google');
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/onboarding',
    });
    // browser navigates away — no cleanup needed
  }

  return (
    <>
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-outline-variant" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-surface px-4 text-on-surface-variant">{dividerLabel}</span>
        </div>
      </div>
      <div className="flex">
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={!!loading}
        className="flex w-full items-center justify-center gap-3 px-4 py-3 border border-outline-variant rounded-full text-sm text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
      >
        {loading === 'google' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        Continuar com Google
      </button>
      </div>
    </>
  );
}
