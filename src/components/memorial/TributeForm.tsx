'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, X, Send, CheckCircle } from 'lucide-react';
import { createTribute } from '@/lib/actions/tributes';
import OperationLoader from '@/components/ui/OperationLoader';
import AuthRequiredPrompt from '@/components/auth/AuthRequiredPrompt';
import type { Tribute } from '@/types/database';

const schema = z.object({
  author_name: z.string().min(1, 'Seu nome é obrigatório'),
  author_relation: z.string().optional(),
  message: z.string().min(3, 'Mensagem muito curta').max(600, 'Máximo 600 caracteres'),
});
type FormData = z.infer<typeof schema>;

const RELATIONS = ['Familiar', 'Amigo', 'Vizinho', 'Tutor', 'Outro'];

interface Props {
  petId: string;
  petName: string;
  memorialSlug: string;
  isAuthenticated: boolean;
  onClose: () => void;
  onCreated: (tribute: Tribute) => void;
}

export default function TributeForm({ petId, petName, memorialSlug, isAuthenticated, onClose, onCreated }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const message = watch('message', '');

  async function onSubmit(data: FormData) {
    setServerError('');
    const result = await createTribute(
      { pet_id: petId, ...data },
      memorialSlug,
    );
    if (result.error) { setServerError(result.error); return; }
    if (result.data) onCreated(result.data);
    setSubmitted(true);
    window.setTimeout(onClose, 900);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <CheckCircle className="w-12 h-12 text-primary" />
        <h3 className="font-serif text-2xl text-on-surface">Mensagem enviada para aprovação</h3>
        <p className="text-on-surface-variant max-w-xs">
          O tutor de {petName} vai revisar sua homenagem antes dela aparecer no memorial.
        </p>
        <button
          onClick={onClose}
          className="mt-4 px-8 py-3 bg-primary text-on-primary rounded-full font-serif font-medium hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim transition-all"
        >
          Fechar
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthRequiredPrompt
        contextLabel="Homenagem protegida"
        title="Entre para deixar uma homenagem"
        description={`Para proteger o memorial de ${petName}, mensagens precisam vir de uma conta e passam pela aprovação do tutor antes de aparecer.`}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="space-y-6">
      <OperationLoader active={isSubmitting} label="Enviando homenagem" />

      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-serif text-2xl text-on-surface">Deixar Homenagem</h3>
          <p className="text-on-surface-variant mt-1 text-sm">
            Escreva uma mensagem de carinho para {petName}.
          </p>
        </div>
        <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-on-surface transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-on-surface" htmlFor="tr-name">
              Seu nome *
            </label>
            <input
              id="tr-name"
              placeholder="Maria Silva"
              className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary/30 text-on-surface placeholder:text-outline text-sm"
              {...register('author_name')}
            />
            {errors.author_name && <p className="text-xs text-error">{errors.author_name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-on-surface" htmlFor="tr-relation">
              Sua relação
            </label>
            <select
              id="tr-relation"
              className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary/30 text-on-surface text-sm"
              {...register('author_relation')}
            >
              <option value="">Selecione.</option>
              {RELATIONS.map(r => <option key={r} value={r.toLowerCase()}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-semibold text-on-surface" htmlFor="tr-message">
              Mensagem *
            </label>
            <span className={`text-xs ${message.length > 550 ? 'text-error' : 'text-on-surface-variant'}`}>
              {message.length}/600
            </span>
          </div>
          <textarea
            id="tr-message"
            rows={5}
            placeholder={`Conte o que ${petName} significou para você.`}
            className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary/30 text-on-surface placeholder:text-outline text-sm resize-none"
            {...register('message')}
          />
          {errors.message && <p className="text-xs text-error">{errors.message.message}</p>}
        </div>

        {serverError && (
          <p className="rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-4 rounded-full font-serif font-semibold hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim transition-all disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Enviar Homenagem
        </button>
      </form>
    </div>
  );
}
