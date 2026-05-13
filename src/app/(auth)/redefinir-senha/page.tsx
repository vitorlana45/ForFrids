'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Loader2 } from 'lucide-react';

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!token) {
      setError('Link inválido. Solicite um novo link de redefinição.');
      return;
    }

    setLoading(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    setLoading(false);

    if (error) {
      setError('Não foi possível redefinir a senha. O link pode ter expirado.');
      return;
    }

    router.push('/entrar');
  }

  return (
    <div className="flex-grow flex items-center justify-center p-8 bg-surface min-h-screen">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-8">
          <span className="material-symbols-outlined text-[48px] text-primary mb-4 block">lock_reset</span>
          <h1 className="font-serif text-3xl text-primary mb-2">Nova senha</h1>
          <p className="text-on-surface-variant">Escolha uma senha segura para sua conta.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface" htmlFor="password">
              Nova senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary-fixed text-on-surface placeholder:text-outline font-sans"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface" htmlFor="confirm">
              Confirmar nova senha
            </label>
            <input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repita a senha"
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
            Salvar nova senha
          </button>
        </form>
      </div>
    </div>
  );
}
