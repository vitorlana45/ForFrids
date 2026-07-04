'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { compress } from '@/lib/storage/compress';
import { deleteUploadedMedia } from '@/lib/storage/rollback';
import { createPet, updatePet } from '@/lib/actions/pets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import OperationLoader from '@/components/ui/OperationLoader';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/toast';
import { Loader2, Pencil, Upload, X } from 'lucide-react';
import type { Pet } from '@/types/database';

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  species: z.string().min(1, 'Espécie é obrigatória'),
  breed: z.string().max(80, 'Raca muito longa').optional(),
  birth_date: z.string().optional(),
  death_date: z.string().optional(),
  tribute_text: z.string().max(400, 'Máximo de 400 caracteres').optional(),
  is_public: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  userId: string;
  pet?: Pet;
  onAvatarChange?: (url: string | null) => void;
}

export default function PetForm({ userId, pet, onAvatarChange }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const isEdit = !!pet;
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // In edit mode fields start locked; in create mode they're always editable
  const [editing, setEditing] = useState(!isEdit);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(pet?.avatar_url ?? null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [serverError, setServerError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: pet?.name ?? '',
      species: pet?.species ?? '',
      breed: pet?.breed ?? '',
      birth_date: pet?.birth_date ?? '',
      death_date: pet?.death_date ?? '',
      tribute_text: pet?.tribute_text ?? '',
      is_public: pet?.is_public ?? true,
    },
  });

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAvatarFile(file);
    setAvatarRemoved(false);
    setAvatarPreview(preview);
    onAvatarChange?.(preview);
    e.currentTarget.value = '';
  }

  async function handleRemoveAvatar() {
    const confirmed = await confirm({
      title: 'Remover foto',
      message: 'A foto atual do pet será removida do memorial e do bucket quando você salvar as alterações.',
      confirmLabel: 'Remover',
      variant: 'danger',
    });
    if (!confirmed) return;

    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarRemoved(isEdit && Boolean(pet?.avatar_url));
    onAvatarChange?.(null);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  }

  function handleCancel() {
    reset();
    setAvatarFile(null);
    setAvatarPreview(pet?.avatar_url ?? null);
    setAvatarRemoved(false);
    setServerError('');
    setEditing(false);
  }

  async function uploadAvatar(file: File, petId: string): Promise<string | null> {
    const compressed = await compress(file, 'avatar');
    const path = `pets/${userId}/${petId}/avatar-${Date.now()}.webp`;
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
    setSaveSuccess(false);

    if (isEdit) {
      let avatar_url: string | null = avatarRemoved ? null : (pet.avatar_url ?? null);
      if (avatarFile) {
        const uploaded = await uploadAvatar(avatarFile, pet.id);
        if (!uploaded) {
          toast.error('Não foi possível enviar a foto. Verifique o tamanho e tente novamente.');
          return;
        }
        avatar_url = uploaded;
      }
      const result = await updatePet(pet.id, { ...data, avatar_url });
      if (result.error) {
        if (avatarFile && avatar_url) await deleteUploadedMedia(avatar_url);
        setServerError(result.error);
        return;
      }
      toast.success('Dados do pet salvos com sucesso.');
      setSaveSuccess(true);
      setAvatarFile(null);
      setAvatarRemoved(false);
      setAvatarPreview(avatar_url);
      onAvatarChange?.(avatar_url);
      setEditing(false);
      router.refresh();
    } else {
      const result = await createPet({ ...data });
      if (result.error === 'UPGRADE_REQUIRED') { router.push('/dashboard/planos'); return; }
      if (result.error || !result.petId) { setServerError(result.error ?? 'Erro ao criar'); return; }
      if (avatarFile) {
        const avatar_url = await uploadAvatar(avatarFile, result.petId);
        if (!avatar_url) {
          toast.error('Pet criado, mas não foi possível enviar a foto. Edite o pet para tentar novamente.');
        }
        if (avatar_url) {
          const updateResult = await updatePet(result.petId, { ...data, avatar_url });
          if (updateResult.error) {
            await deleteUploadedMedia(avatar_url);
            toast.error('Pet criado, mas nao foi possivel salvar a foto. Edite o pet para tentar novamente.');
          }
        }
      }
      router.push('/dashboard');
      router.refresh();
    }
  }

  const locked = isEdit && !editing;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <OperationLoader active={isSubmitting} label={isEdit ? 'Salvando página' : 'Criando página'} />

      {/* Edit mode header */}
      {isEdit && (
        <div className="flex items-center justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-low px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-on-surface">
              {editing ? 'Editando dados' : 'Dados do pet'}
            </p>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              {editing
                ? 'Faça as alterações e salve quando terminar.'
                : 'Clique em "Editar" para alterar as informações.'}
            </p>
          </div>
          {!editing ? (
            <button
              type="button"
              onClick={() => { setSaveSuccess(false); setEditing(true); }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/40 px-4 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container"
            >
              <X className="h-3.5 w-3.5" />
              Cancelar
            </button>
          )}
        </div>
      )}

      {saveSuccess && (
        <p className="rounded-xl bg-primary-fixed/40 px-4 py-3 text-sm font-semibold text-primary">
          Dados salvos com sucesso.
        </p>
      )}

      {/* Avatar */}
      <Card className={locked ? 'pointer-events-none opacity-60' : ''}>
        <CardContent className="pt-6">
          <Label>Foto do pet</Label>
          <div className="mt-3 flex items-center gap-4">
            <div className="h-24 w-24 overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container flex items-center justify-center shrink-0">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <Upload className="h-8 w-8 text-secondary/60" />
              )}
            </div>
            <div>
              <input
                ref={avatarInputRef}
                type="file"
                id="avatar"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={locked}
              />
              <Button type="button" variant="outline" size="sm" asChild>
                <label htmlFor="avatar" className={locked ? 'cursor-default' : 'cursor-pointer'}>
                  Escolher foto
                </label>
              </Button>
              {avatarPreview && !locked && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="ml-3 text-xs text-muted-foreground hover:text-destructive"
                >
                  Remover
                </button>
              )}
              <p className="mt-1 text-xs text-muted-foreground">JPG, PNG ou WEBP. Máx 5MB.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic info */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          <h2 className="font-serif text-lg text-on-surface">Informações básicas</h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome do pet *</Label>
              <Input id="name" placeholder="Frids" disabled={locked} {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="species">Espécie *</Label>
              <Input id="species" placeholder="Cachorro, Gato, Pássaro…" disabled={locked} {...register('species')} />
              {errors.species && <p className="text-xs text-destructive">{errors.species.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="breed">Raça</Label>
              <Input id="breed" placeholder="Border Collie" disabled={locked} {...register('breed')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="birth_date">Data de nascimento</Label>
              <Input id="birth_date" type="date" disabled={locked} {...register('birth_date')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="death_date">Data de falecimento</Label>
              <Input id="death_date" type="date" disabled={locked} {...register('death_date')} />
              <p className="text-xs text-muted-foreground">Deixe em branco se o pet ainda está com você.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tribute */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <h2 className="font-serif text-lg text-on-surface">Homenagem</h2>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="tribute_text">Escreva sobre o seu pet</Label>
              <span className={`text-xs tabular-nums ${(watch('tribute_text') ?? '').length > 370 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {(watch('tribute_text') ?? '').length}/400
              </span>
            </div>
            <Textarea
              id="tribute_text"
              placeholder="Conte a história do seu companheiro, o que ele significou para você, os momentos inesquecíveis…"
              rows={6}
              maxLength={400}
              disabled={locked}
              {...register('tribute_text')}
            />
            {errors.tribute_text && <p className="text-xs text-destructive">{errors.tribute_text.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Visibility */}
      <Card className={locked ? 'pointer-events-none opacity-60' : ''}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg text-on-surface">Página pública</h2>
              <p className="text-sm text-muted-foreground">
                Permitir que qualquer pessoa acesse a página com o link.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="sr-only peer" disabled={locked} {...register('is_public')} />
              <div className="peer h-6 w-11 rounded-full bg-surface-container-high peer-checked:bg-primary transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white dark:after:bg-surface-container-lowest after:transition-all peer-checked:after:translate-x-5" />
            </label>
          </div>
        </CardContent>
      </Card>

      {serverError && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </p>
      )}

      {/* Submit — only shown when actively editing or creating */}
      {editing && (
        <div className="flex gap-3">
          {!isEdit && (
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
              Cancelar
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Salvar alterações' : 'Criar página'}
          </Button>
        </div>
      )}
    </form>
  );
}
