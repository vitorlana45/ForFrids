'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient } from '@/lib/auth-client';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import OperationLoader from '@/components/ui/OperationLoader';
import OAuthButtons from '@/components/auth/OAuthButtons';

const schema = z.object({
  full_name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, { message: 'As senhas não coincidem', path: ['confirm_password'] });

type FormData = z.infer<typeof schema>;

export default function CadastrarPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError('');
    const { error } = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: data.full_name,
      // @ts-expect-error — additional fields passed through to Better Auth
      full_name: data.full_name,
      callbackURL: '/onboarding',
    });
    if (error) { setServerError(error.message ?? 'Erro ao criar conta'); return; }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="flex-grow flex items-center justify-center p-8 bg-surface">
        <div className="w-full max-w-md text-center animate-fade-in mt-16">
          <span className="material-symbols-outlined text-[72px] text-primary mb-6 block">mark_email_read</span>
          <h1 className="font-serif text-3xl text-primary mb-3">Confirme seu e-mail</h1>
          <p className="text-on-surface-variant leading-relaxed mb-8">
            Enviamos um link de confirmação para o seu e-mail. Após confirmar, você já pode
            criar a primeira página do seu pet.
          </p>
          <Link href="/entrar" className="border border-primary text-primary px-8 py-3 rounded-full font-serif inline-block hover:bg-surface-container transition-all">
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
      <OperationLoader active={isSubmitting} label="Criando conta" />

      {/* Left: image */}
      <section className="hidden md:flex md:w-2/5 relative overflow-hidden bg-surface-container-high">
        <Image src="/login.png" alt="" fill className="object-cover object-center grayscale-[15%] opacity-95" priority sizes="40vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />
        <div className="absolute bottom-12 left-12 right-12 text-white z-20">
          <h2 className="font-serif text-2xl text-white mb-3">
            Preserve o amor. Para sempre.
          </h2>
          <p className="text-white/80 max-w-md leading-relaxed text-sm">
            Crie o memorial digital do seu companheiro. Um espaço de paz, beleza e memória eterna.
          </p>
        </div>
      </section>

      {/* Right: form */}
      <section className="flex-1 overflow-y-auto bg-surface">
        <div className="flex min-h-full items-center justify-center px-8 py-4 md:px-16 pt-24">
        <div className="w-full max-w-md flex flex-col space-y-5 animate-slide-up">
          <div className="space-y-3">
            <h1 className="font-serif text-3xl text-primary">Criar sua conta grátis</h1>
            <p className="text-on-surface-variant">Comece a guardar as memórias mais especiais da sua vida.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {[
              { id: 'full_name', label: 'Seu nome', type: 'text', placeholder: 'Maria Silva', key: 'full_name' as const },
              { id: 'email', label: 'E-mail', type: 'email', placeholder: 'seu@email.com', key: 'email' as const },
              { id: 'password', label: 'Senha', type: 'password', placeholder: 'Mínimo 6 caracteres', key: 'password' as const },
              { id: 'confirm_password', label: 'Confirmar senha', type: 'password', placeholder: 'Repita sua senha', key: 'confirm_password' as const },
            ].map(f => (
              <div key={f.id} className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface" htmlFor={f.id}>{f.label}</label>
                <input
                  id={f.id}
                  type={f.type}
                  placeholder={f.placeholder}
                  className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary-fixed text-on-surface placeholder:text-outline font-sans"
                  {...register(f.key)}
                />
                {errors[f.key] && <p className="text-xs text-error">{errors[f.key]?.message}</p>}
              </div>
            ))}

            {serverError && (
              <p className="rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container">{serverError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-on-primary py-4 rounded-full font-sans font-semibold hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar conta grátis
            </button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-surface px-4 text-on-surface-variant">ou cadastre com</span>
            </div>
          </div>

          <OAuthButtons />

          <p className="text-center text-sm text-on-surface-variant">
            Já tem uma conta?{' '}
            <Link href="/entrar" className="text-primary font-semibold hover:underline underline-offset-4">
              Entrar
            </Link>
          </p>
        </div>
        </div>
      </section>
    </div>
  );
}
