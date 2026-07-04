'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImagePlus, Loader2, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { compress } from '@/lib/storage/compress';
import { deleteUploadedMedia } from '@/lib/storage/rollback';
import { createTimelineEntry, updateTimelineEntry, deleteTimelineEntry } from '@/lib/actions/timeline';
import OperationLoader from '@/components/ui/OperationLoader';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';
import type { TimelineEntry } from '@/types/database';

const schema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().max(500, 'Máximo de 500 caracteres').optional(),
  date: z.string().min(1, 'Data é obrigatória'),
});
type FormData = z.infer<typeof schema>;

interface Props {
  petId: string;
  initialEntries: TimelineEntry[];
  userId: string;
}

const MAX_PHOTOS = 4;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

// entry.date pode chegar como Date (Prisma) ou string (form) — new Date() cobre os dois
function byDate(a: TimelineEntry, b: TimelineEntry) {
  return new Date(a.date).getTime() - new Date(b.date).getTime();
}

export default function TimelineManager({ petId, initialEntries, userId }: Props) {
  const confirm = useConfirm();
  const toast = useToast();
  const [entries, setEntries] = useState<TimelineEntry[]>(initialEntries);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });
  const descriptionValue = watch('description') ?? '';

  function openAdd() {
    reset({ title: '', description: '', date: '' });
    setEditingId(null);
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setExistingPhotos([]);
    setShowForm(true);
    setFormError('');
  }

  function openEdit(entry: TimelineEntry) {
    reset({ title: entry.title, description: entry.description ?? '', date: entry.date });
    setEditingId(entry.id);
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setExistingPhotos(entry.photo_urls ?? []);
    setShowForm(true);
    setFormError('');
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setExistingPhotos([]);
    setFormError('');
    reset();
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (selected.length === 0) return;

    const availableSlots = MAX_PHOTOS - existingPhotos.length - photoFiles.length;
    if (availableSlots <= 0) {
      setFormError(`Cada momento pode ter ate ${MAX_PHOTOS} imagens.`);
      return;
    }

    const accepted: File[] = [];

    for (const file of selected.slice(0, availableSlots)) {
      if (!file.type.startsWith('image/')) {
        setFormError('Envie apenas arquivos de imagem.');
        continue;
      }
      if (file.size > MAX_PHOTO_SIZE) {
        setFormError('Cada imagem deve ter no maximo 5MB.');
        continue;
      }
      accepted.push(file);
    }

    if (accepted.length === 0) return;

    setPhotoFiles(prev => [...prev, ...accepted]);
    setPhotoPreviews(prev => [...prev, ...accepted.map(file => URL.createObjectURL(file))]);
  }

  async function removeExistingPhoto(url: string) {
    const confirmed = await confirm({
      title: 'Remover imagem',
      message: 'Esta imagem será removida do momento e do bucket quando você salvar.',
      confirmLabel: 'Remover',
      variant: 'danger',
    });
    if (!confirmed) return;

    setExistingPhotos(prev => prev.filter(photo => photo !== url));
  }

  function removeNewPhoto(index: number) {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function uploadPhotos(files: File[], entryId: string) {
    const urls: string[] = [];

    for (const [index, file] of files.entries()) {
      const compressed = await compress(file, 'timeline');
      const path = `pets/${userId}/${petId}/timeline/${entryId}/${Date.now()}-${index}.webp`;
      const form = new FormData();
      form.append('file', compressed);
      form.append('path', path);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Nao foi possivel enviar uma das imagens.');
      const { url } = await res.json();
      urls.push(url as string);
    }

    return urls;
  }

  async function onSubmit(data: FormData) {
    setFormError('');

    if (editingId) {
      let uploadedUrls: string[] = [];
      try {
        uploadedUrls = await uploadPhotos(photoFiles, editingId);
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'Erro ao enviar imagens.');
        return;
      }

      const photo_urls = [...existingPhotos, ...uploadedUrls].slice(0, MAX_PHOTOS);
      const result = await updateTimelineEntry(editingId, { ...data, photo_urls });
      if (result.error) {
        await deleteUploadedMedia(uploadedUrls);
        setFormError(result.error);
        return;
      }
      setEntries(prev =>
        prev
          .map(e => e.id === editingId ? { ...e, ...data, photo_urls } : e)
          .sort(byDate)
      );
    } else {
      const result = await createTimelineEntry({ pet_id: petId, ...data, photo_urls: [] });
      if (result.error === 'LIMIT_REACHED') { setFormError('Você atingiu o limite de momentos do seu plano. Faça upgrade para adicionar mais.'); return; }
      if (result.error) { setFormError(result.error); return; }
      let newEntry = result.data as TimelineEntry;

      if (photoFiles.length > 0) {
        try {
          const photo_urls = await uploadPhotos(photoFiles, newEntry.id);
          const updateResult = await updateTimelineEntry(newEntry.id, { photo_urls });
          if (updateResult.error) {
            await deleteUploadedMedia(photo_urls);
            setFormError(updateResult.error);
            return;
          }
          newEntry = { ...newEntry, photo_urls };
        } catch (error) {
          setFormError(error instanceof Error ? error.message : 'Momento criado, mas nao foi possivel enviar as imagens.');
          setEntries(prev => [...prev, newEntry].sort(byDate));
          return;
        }
      }

      setEntries(prev => [...prev, newEntry].sort(byDate));
    }

    closeForm();
  }

  async function handleDelete(id: string) {
    const confirmed = await confirm({
      title: 'Excluir momento',
      message: 'Esta ação não pode ser desfeita. O momento e suas fotos serão removidos permanentemente.',
      confirmLabel: 'Excluir',
      variant: 'danger',
    });
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteTimelineEntry(id);
      if (result.error) {
        toast.error('Erro ao excluir o momento. Tente novamente.');
      } else {
        toast.success('Momento excluído com sucesso.');
        setEntries(prev => prev.filter(e => e.id !== id));
      }
    });
  }

  return (
    <div className="space-y-6">
      <OperationLoader
        active={isSubmitting || isPending}
        label={isPending ? 'Atualizando linha do tempo' : 'Salvando momento'}
      />

      <div className="flex items-center justify-end">
        {!showForm && (
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim transition-all"
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
                  placeholder="Primeiro dia em casa, Vacinação, Passeio na praia."
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
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-on-surface" htmlFor="tl-desc">
                    Descrição
                  </label>
                  <span className={`text-xs tabular-nums ${descriptionValue.length > 480 ? 'text-error' : 'text-on-surface-variant'}`}>
                    {descriptionValue.length}/500
                  </span>
                </div>
                <textarea
                  id="tl-desc"
                  rows={3}
                  maxLength={500}
                  placeholder="Conte o que aconteceu nesse dia especial."
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary/30 text-on-surface placeholder:text-outline text-sm resize-none"
                  {...register('description')}
                />
              </div>

              <div className="space-y-3 sm:col-span-2">
                <div>
                  <label className="block text-sm font-semibold text-on-surface" htmlFor="tl-photos">
                    Imagens do momento
                  </label>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Adicione ate {MAX_PHOTOS} imagens para representar esse momento.
                  </p>
                </div>

                <label
                  htmlFor="tl-photos"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest px-4 py-8 text-center transition-colors hover:bg-surface-container"
                >
                  <ImagePlus className="mb-2 h-6 w-6 text-primary" />
                  <span className="text-sm font-semibold text-on-surface">Selecionar imagens</span>
                  <span className="mt-1 text-xs text-on-surface-variant">JPG, PNG ou WebP ate 5MB cada</span>
                </label>
                <input
                  id="tl-photos"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="sr-only"
                  onChange={handlePhotoChange}
                />

                {(existingPhotos.length > 0 || photoPreviews.length > 0) && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {existingPhotos.map(url => (
                      <div key={url} className="group/photo relative aspect-square overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container">
                        <Image src={url} alt="" fill unoptimized className="object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingPhoto(url)}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-inverse-surface/80 text-inverse-on-surface opacity-0 transition-opacity group-hover/photo:opacity-100"
                          aria-label="Remover imagem"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {photoPreviews.map((url, index) => (
                      <div key={url} className="group/photo relative aspect-square overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container">
                        <Image src={url} alt="" fill unoptimized className="object-cover" />
                        <button
                          type="button"
                          onClick={() => removeNewPhoto(index)}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-inverse-surface/80 text-inverse-on-surface opacity-0 transition-opacity group-hover/photo:opacity-100"
                          aria-label="Remover imagem"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim transition-all disabled:opacity-60"
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
        <div className="relative space-y-4">
          <div className="absolute bottom-6 left-5 top-6 hidden w-px bg-outline-variant/60 sm:block" />
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="group relative flex items-start gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm"
            >
              <div className="z-10 w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0 mt-0.5 text-on-primary-fixed">
                <span className="material-symbols-outlined text-sm text-primary">event</span>
              </div>
              <div className="flex-1 min-w-0">
                {entry.photo_urls.length > 0 ? (
                  <div className="flex gap-3 items-start">
                    <div className={`shrink-0 grid gap-1 ${entry.photo_urls.length === 1 ? 'w-20' : 'grid-cols-2 w-[106px]'}`}>
                      {entry.photo_urls.slice(0, MAX_PHOTOS).map((url, index) => (
                        <div key={`${url}-${index}`} className="relative aspect-square overflow-hidden rounded-lg bg-surface-container">
                          <Image src={url} alt="" fill unoptimized className="object-cover" />
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="mb-1 block text-[11px] font-bold tracking-widest text-secondary uppercase">
                        {formatDate(entry.date)}
                      </span>
                      <p className="break-words font-serif text-lg text-on-surface">{entry.title}</p>
                      {entry.description && (
                        <p className="mt-1 text-sm leading-5 text-on-surface-variant line-clamp-3">{entry.description}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="mb-2 block text-[11px] font-bold tracking-widest text-secondary uppercase">
                      {formatDate(entry.date)}
                    </span>
                    <p className="break-words font-serif text-xl text-on-surface">{entry.title}</p>
                    {entry.description && (
                      <p className="mt-2 text-sm leading-6 text-on-surface-variant line-clamp-4">{entry.description}</p>
                    )}
                  </>
                )}
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
