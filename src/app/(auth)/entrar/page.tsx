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
    <div className="flex-grow flex flex-col md:flex-row min-h-screen">

      {/* Left: image */}
      <section className="hidden md:flex md:w-1/2 lg:w-3/5 relative overflow-hidden bg-surface-container-high">
        <Image src="/login.png" alt="" fill className="object-cover grayscale-[20%] opacity-90" priority sizes="50vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent z-10" />
        <div className="absolute bottom-16 left-16 right-16 text-white z-20">
          <h2 className="font-serif text-3xl text-white mb-4">
            Um santuário para suas memórias mais preciosas.
          </h2>
          <p className="text-white/80 max-w-md leading-relaxed">
            Cada memória é um fio no tapete de uma vida bem amada. Bem-vindo de volta ao lugar
            onde esses fios são preservados para sempre.
          </p>
        </div>
      </section>

      {/* Right: form */}
      <section className="flex-grow flex items-center justify-center p-8 md:p-16 lg:p-24 bg-surface">
        <div className="w-full max-w-md flex flex-col space-y-8 mt-16 md:mt-0 animate-slide-up">
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
                <a href="#" className="text-xs text-primary hover:underline underline-offset-4">
                  Esqueceu a senha?
                </a>
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
              className="w-full bg-primary text-on-primary py-4 rounded-full font-sans font-semibold hover:bg-[#3d4d41] transition-all shadow-sm active:opacity-70 flex items-center justify-center gap-2"
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

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-3 px-4 py-3 border border-outline-variant rounded-full text-sm text-on-surface-variant hover:bg-surface-container transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-3 px-4 py-3 border border-outline-variant rounded-full text-sm text-on-surface-variant hover:bg-surface-container transition-colors">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05 1.61-3.23 1.61-1.11 0-1.63-.68-2.91-.68-1.3 0-1.89.65-2.91.68-1.18 0-2.29-.71-3.32-1.72C2.63 18.15 1 14.88 1 11.83c0-2.83 1.48-4.54 3.16-4.54 1.16 0 1.95.69 2.87.69.87 0 1.83-.71 3.16-.71 1.34 0 2.29.62 3.15 1.76-2.58 1.48-2.14 5.17.45 6.43-.69 1.88-1.55 3.66-2.74 4.82zM12.03 7.25c-.09-2.03 1.63-3.84 3.42-4.08.28 2.33-2.16 4.19-3.42 4.08z"/>
              </svg>
              Apple
            </button>
          </div>

          <p className="text-center text-sm text-on-surface-variant pt-4">
            Ainda não tem santuário?{' '}
            <Link href="/cadastrar" className="text-primary font-semibold hover:underline underline-offset-4">
              Criar Memorial
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
