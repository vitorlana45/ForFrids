'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Calendar, ImagePlus, Loader2, Save } from 'lucide-react';
import { compress } from '@/lib/storage/compress';
import { deleteUploadedMedia } from '@/lib/storage/rollback';
import { createChronicle, updateChronicle } from '@/lib/actions/chronicles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import OperationLoader from '@/components/ui/OperationLoader';
import type { Chronicle, Pet } from '@/types/database';

const schema = z.object({
  title: z.string().min(3, 'Titulo muito curto').max(120, 'Titulo muito longo'),
  content: z.string().min(20, 'Conte um pouco mais sobre essa memoria'),
  excerpt: z.string().optional(),
  event_date: z.string().optional(),
  life_phase: z.string().optional(),
  mood: z.string().optional(),
  is_published: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  pet: Pet;
  userId: string;
  chronicle?: Chronicle;
}

const lifePhases = [
  'Infancia',
  'Maturidade',
  'Velhice',
  'Despedida',
  'Depois da saudade',
];

const moods = ['Alegre', 'Nostalgico', 'Reflexivo', 'Grato', 'Saudade'];

export default function ChronicleEditor({ pet, userId, chronicle }: Props) {
  const router = useRouter();
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(chronicle?.cover_url ?? null);
  const [serverError, setServerError] = useState('');
  const isEdit = !!chronicle;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: chronicle?.title ?? '',
      content: chronicle?.content ?? '',
      excerpt: chronicle?.excerpt ?? '',
      event_date: chronicle?.event_date ?? '',
      life_phase: chronicle?.life_phase ?? '',
      mood: chronicle?.mood ?? '',
      is_published: chronicle?.is_published ?? true,
    },
  });

  const content = watch('content') ?? '';
  const readingMinutes = Math.max(1, Math.ceil(content.trim().split(/\s+/).filter(Boolean).length / 180));

  function handleCoverChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function uploadCover(file: File) {
    const compressed = await compress(file, 'cover');
    const path = `chronicles/${userId}/${pet.id}/${chronicle?.id ?? crypto.randomUUID()}.webp`;
    const form = new FormData();
    form.append('file', compressed);
    form.append('path', path);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    if (!res.ok) return null;
    const { url } = await res.json();
    return url as string;
  }

  async function onSubmit(data: FormData) {
    setServerError('');

    let cover_url = chronicle?.cover_url ?? '';
    let uploadedCoverUrl: string | null = null;
    if (coverFile) {
      cover_url = (await uploadCover(coverFile)) ?? '';
      if (!cover_url) {
        setServerError('Nao foi possivel enviar a imagem de capa.');
        return;
      }
      uploadedCoverUrl = cover_url;
    }

    const payload = {
      ...data,
      cover_url,
      excerpt: data.excerpt || content.slice(0, 180),
    };

    const result = isEdit
      ? await updateChronicle(chronicle.id, payload)
      : await createChronicle({ ...payload, pet_id: pet.id });

    if (result.error === 'UPGRADE_REQUIRED' || result.error === 'LIMIT_REACHED') {
      if (uploadedCoverUrl) await deleteUploadedMedia(uploadedCoverUrl);
      router.push('/dashboard/planos');
      return;
    }
    if (result.error) {
      if (uploadedCoverUrl) await deleteUploadedMedia(uploadedCoverUrl);
      setServerError(result.error);
      return;
    }

    router.push(`/dashboard/pets/${pet.memorial_slug}/diario`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-12">
      <OperationLoader active={isSubmitting} label={isEdit ? 'Salvando cronica' : 'Criando cronica'} />

      <section className="space-y-8 lg:col-span-8">
        <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-card">
          <div className="flex flex-col gap-6 md:flex-row">
            <label className="group relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container md:w-56">
              {coverPreview ? (
                <img src={coverPreview} alt="" className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-on-surface-variant">
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-sm">Adicionar capa</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            </label>

            <div className="flex-1 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Titulo da cronica</Label>
                <Input id="title" placeholder={`Uma memoria com ${pet.name}`} {...register('title')} />
                {errors.title && <p className="text-xs text-error">{errors.title.message}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="event_date">Data da memoria</Label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-on-surface-variant" />
                    <Input id="event_date" type="date" className="pl-9" {...register('event_date')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="life_phase">Fase da vida</Label>
                  <select
                    id="life_phase"
                    className="h-11 w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                    {...register('life_phase')}
                  >
                    <option value="">Sem fase</option>
                    {lifePhases.map((phase) => (
                      <option key={phase} value={phase}>{phase}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="content">Texto</Label>
          <Textarea
            id="content"
            rows={18}
            placeholder="Comece a contar essa historia..."
            className="min-h-[520px] resize-y text-base leading-7"
            {...register('content')}
          />
          {errors.content && <p className="text-xs text-error">{errors.content.message}</p>}
        </div>
      </section>

      <aside className="space-y-5 lg:col-span-4">
        <div className="sticky top-28 space-y-5">
          <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-6">
            <div className="mb-5 flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-xl text-on-surface">Publicacao</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mood">Tom</Label>
                <select
                  id="mood"
                  className="h-11 w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  {...register('mood')}
                >
                  <option value="">Sem tom</option>
                  {moods.map((mood) => (
                    <option key={mood} value={mood}>{mood}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Resumo</Label>
                <Textarea
                  id="excerpt"
                  rows={4}
                  placeholder="Resumo curto para a lista do diario"
                  {...register('excerpt')}
                />
              </div>

              <label className="flex items-center justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                <span>
                  <span className="block text-sm font-semibold text-on-surface">Publicado</span>
                  <span className="block text-xs text-on-surface-variant">Visivel no diario do pet</span>
                </span>
                <input type="checkbox" className="h-5 w-5 accent-primary" {...register('is_published')} />
              </label>

              <p className="rounded-2xl bg-primary-fixed/40 px-4 py-3 text-sm text-on-primary-fixed-variant">
                Aproximadamente {readingMinutes} min de leitura.
              </p>
            </div>
          </div>

          {serverError && (
            <p className="rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container">
              {serverError}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.push(`/dashboard/pets/${pet.memorial_slug}/diario`)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
            </Button>
          </div>
        </div>
      </aside>
    </form>
  );
}
