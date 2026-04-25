'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { createTimelineEntry, updateTimelineEntry, deleteTimelineEntry } from '@/lib/actions/timeline';
import { formatDate } from '@/lib/utils';
import type { TimelineEntry } from '@/types/database';

const schema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  date: z.string().min(1, 'Data é obrigatória'),
});
type FormData = z.infer<typeof schema>;

interface Props {
  petId: string;
  initialEntries: TimelineEntry[];
}

export default function TimelineManager({ petId, initialEntries }: Props) {
  const [entries, setEntries] = useState<TimelineEntry[]>(initialEntries);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  function openAdd() {
    reset({ title: '', description: '', date: '' });
    setEditingId(null);
    setShowForm(true);
    setFormError('');
  }

  function openEdit(entry: TimelineEntry) {
    reset({ title: entry.title, description: entry.description ?? '', date: entry.date });
    setEditingId(entry.id);
    setShowForm(true);
    setFormError('');
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setFormError('');
    reset();
  }

  async function onSubmit(data: FormData) {
    setFormError('');

    if (editingId) {
      const result = await updateTimelineEntry(editingId, data);
      if (result.error) { setFormError(result.error); return; }
      setEntries(prev => prev.map(e => e.id === editingId ? { ...e, ...data } : e));
    } else {
      const result = await createTimelineEntry({ pet_id: petId, ...data, photo_urls: [] });
      if (result.error) { setFormError(result.error); return; }
      const newEntry = result.data as TimelineEntry;
      setEntries(prev => [...prev, newEntry].sort((a, b) => a.date.localeCompare(b.date)));
    }

    closeForm();
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteTimelineEntry(id);
      if (!result.error) {
        setEntries(prev => prev.filter(e => e.id !== id));
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-on-surface">Linha do Tempo</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Registre os momentos marcantes da vida do seu pet.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#3d4d41] transition-all"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        )}
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 space-y-4">
          <h3 className="font-serif text-lg text-on-surface">
            {editingId ? 'Editar momento' : 'Novo momento'}
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-sm font-semibold text-on-surface" htmlFor="tl-title">
                  Título *
                </label>
                <input
                  id="tl-title"
                  placeholder="Primeiro dia em casa, Vacinação, Passeio na praia…"
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary/30 text-on-surface placeholder:text-outline text-sm"
                  {...register('title')}
                />
                {errors.title && <p className="text-xs text-error">{errors.title.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-on-surface" htmlFor="tl-date">
                  Data *
                </label>
                <input
                  id="tl-date"
                  type="date"
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary/30 text-on-surface text-sm"
                  {...register('date')}
                />
                {errors.date && <p className="text-xs text-error">{errors.date.message}</p>}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-sm font-semibold text-on-surface" htmlFor="tl-desc">
                  Descrição
                </label>
                <textarea
                  id="tl-desc"
                  rows={3}
                  placeholder="Conte o que aconteceu nesse dia especial…"
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary/30 text-on-surface placeholder:text-outline text-sm resize-none"
                  {...register('description')}
                />
              </div>
            </div>

            {formError && (
              <p className="rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container">
                {formError}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeForm}
                className="flex items-center gap-2 px-5 py-2.5 border border-outline-variant rounded-full text-sm text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <X className="h-4 w-4" /> Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#3d4d41] transition-all disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {editingId ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Entries list */}
      {entries.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-low py-16 text-center">
          <span className="material-symbols-outlined text-[48px] text-outline mb-3">timeline</span>
          <p className="font-serif text-lg text-on-surface-variant mb-1">Nenhum momento registrado</p>
          <p className="text-sm text-on-surface-variant">Adicione o primeiro momento da linha do tempo.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-4 bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-5 group"
            >
              <div className="w-10 h-10 rounded-full bg-primary-fixed/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-sm text-primary">event</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-base text-on-surface font-medium">{entry.title}</p>
                {entry.description && (
                  <p className="text-sm text-on-surface-variant mt-0.5 line-clamp-2">{entry.description}</p>
                )}
                <span className="text-[11px] font-bold tracking-widest text-primary uppercase mt-1 block">
                  {formatDate(entry.date)}
                </span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(entry)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  disabled={isPending}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-error-container hover:text-error transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
