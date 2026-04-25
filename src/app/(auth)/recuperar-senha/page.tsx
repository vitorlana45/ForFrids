'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
    });

    setLoading(false);

    if (error) {
      setError('Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.');
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex-grow flex items-center justify-center p-8 bg-surface min-h-screen">
        <div className="w-full max-w-md text-center animate-fade-in">
          <span className="material-symbols-outlined text-[72px] text-primary mb-6 block">mark_email_read</span>
          <h1 className="font-serif text-3xl text-primary mb-3">Verifique seu e-mail</h1>
          <p className="text-on-surface-variant leading-relaxed mb-8">
            Enviamos um link de redefinição para <strong>{email}</strong>. Clique no link para criar uma nova senha.
          </p>
          <Link
            href="/entrar"
            className="border border-primary text-primary px-8 py-3 rounded-full font-serif inline-block hover:bg-surface-container transition-all"
          >
            Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex items-center justify-center p-8 bg-surface min-h-screen">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-8">
          <Link href="/entrar" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-6 block">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Voltar para o login
          </Link>
          <h1 className="font-serif text-3xl text-primary mb-2">Recuperar senha</h1>
          <p className="text-on-surface-variant">
            Digite seu e-mail e enviaremos um link para criar uma nova senha.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary-fixed text-on-surface placeholder:text-outline font-sans"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-4 rounded-full font-sans font-semibold hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Enviar link de recuperação
          </button>
        </form>
      </div>
    </div>
  );
}
