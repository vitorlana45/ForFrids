'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, X, CheckCircle } from 'lucide-react';
import { createCapsule } from '@/lib/actions/capsules';
import OperationLoader from '@/components/ui/OperationLoader';
import type { Pet } from '@/types/database';

const schema = z.object({
  pet_id: z.string().uuid('Selecione um pet'),
  title: z.string().min(1, 'Título é obrigatório'),
  message: z.string().min(10, 'Escreva pelo menos 10 caracteres'),
  open_at: z.string().min(1, 'Escolha a data de abertura'),
});
type FormData = z.infer<typeof schema>;

interface Props {
  pets: Pick<Pet, 'id' | 'name' | 'species'>[];
  onClose: () => void;
  onCreated: () => void;
}

export default function CapsuleForm({ pets, onClose, onCreated }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const today = new Date();
  today.setDate(today.getDate() + 1);
  const minDate = today.toISOString().split('T')[0];

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { pet_id: pets[0]?.id ?? '' },
    });

  async function onSubmit(data: FormData) {
    setServerError('');
    const result = await createCapsule(data);
    if (result.error) { setServerError(result.error); return; }
    setSubmitted(true);
    setTimeout(onCreated, 1200);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
        <CheckCircle className="w-12 h-12 text-primary" />
        <h3 className="font-serif text-2xl text-on-surface">Cápsula criada</h3>
        <p className="text-on-surface-variant text-sm">Sua mensagem está guardada com segurança.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OperationLoader active={isSubmitting} label="Selando cápsula" />

      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-serif text-2xl text-on-surface">Nova Cápsula do Tempo</h3>
          <p className="text-on-surface-variant mt-1 text-sm">
            Uma mensagem selada até a data escolhida.
          </p>
        </div>
        <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-on-surface transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-on-surface" htmlFor="cap-pet">
              Pet *
            </label>
            <select
              id="cap-pet"
              className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary/30 text-on-surface text-sm"
              {...register('pet_id')}
            >
              {pets.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.species})</option>
              ))}
            </select>
            {errors.pet_id && <p className="text-xs text-error">{errors.pet_id.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-on-surface" htmlFor="cap-open">
              Abrir em *
            </label>
            <input
              id="cap-open"
              type="date"
              min={minDate}
              className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary/30 text-on-surface text-sm"
              {...register('open_at')}
            />
            {errors.open_at && <p className="text-xs text-error">{errors.open_at.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-on-surface" htmlFor="cap-title">
            Título *
          </label>
          <input
            id="cap-title"
            placeholder="Primeira primavera sem você…"
            className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary/30 text-on-surface placeholder:text-outline text-sm"
            {...register('title')}
          />
          {errors.title && <p className="text-xs text-error">{errors.title.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-on-surface" htmlFor="cap-msg">
            Mensagem *
          </label>
          <textarea
            id="cap-msg"
            rows={7}
            placeholder="Escreva o que quiser guardar para este momento futuro. Uma lembrança, uma saudade, um desejo…"
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
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Selar Cápsula
        </button>
      </form>
    </div>
  );
}
