'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import OperationLoader from '@/components/ui/OperationLoader';
import OAuthButtons from '@/components/auth/OAuthButtons';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
});
type FormData = z.infer<typeof schema>;

export default function EntrarPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError('');
    const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
    if (error) { setServerError('E-mail ou senha incorretos. Tente novamente.'); return; }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
      <OperationLoader active={isSubmitting} label="Entrando" />

      {/* Left: image */}
      <section className="hidden md:flex md:w-2/5 relative overflow-hidden bg-surface-container-high">
        <Image src="/login.png" alt="" fill className="object-cover object-center grayscale-[15%] opacity-95" priority sizes="40vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />
        <div className="absolute bottom-12 left-12 right-12 text-white z-20">
          <h2 className="font-serif text-2xl text-white mb-3">
            Um santuário para suas memórias mais preciosas.
          </h2>
          <p className="text-white/80 max-w-md leading-relaxed text-sm">
            Cada memória é um fio no tapete de uma vida bem amada. Bem-vindo de volta ao lugar
            onde esses fios são preservados para sempre.
          </p>
        </div>
      </section>

      {/* Right: form */}
      <section className="flex-1 overflow-y-auto bg-surface">
        <div className="flex min-h-full items-center justify-center px-8 py-6 md:px-16 pt-24">
        <div className="w-full max-w-md flex flex-col space-y-6 animate-slide-up">
          <div className="space-y-3">
            <h1 className="font-serif text-3xl text-primary">
              Bem-vindo de volta ao seu santuário
            </h1>
            <p className="text-on-surface-variant">
              Entre para acessar seus memoriais e tributos.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary-fixed text-on-surface placeholder:text-outline font-sans"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-error">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-on-surface" htmlFor="password">
                  Senha
                </label>
                <Link href="/recuperar-senha" className="text-xs text-primary hover:underline underline-offset-4">
                  Esqueceu a senha?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                placeholder="Sua senha"
                className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary-fixed text-on-surface placeholder:text-outline font-sans"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-error">{errors.password.message}</p>}
            </div>

            {serverError && (
              <p className="rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-on-primary py-4 rounded-full font-sans font-semibold hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim transition-all shadow-sm active:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Entrar
            </button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-surface px-4 text-on-surface-variant">ou continue com</span>
            </div>
          </div>

          <OAuthButtons />

          <p className="text-center text-sm text-on-surface-variant pt-4">
            Ainda não tem santuário?{' '}
            <Link href="/cadastrar" className="text-primary font-semibold hover:underline underline-offset-4">
              Criar Memorial
            </Link>
          </p>
        </div>
        </div>
      </section>
    </div>
  );
}
