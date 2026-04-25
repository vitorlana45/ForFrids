'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { createPet, updatePet } from '@/lib/actions/pets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Upload } from 'lucide-react';
import type { Pet } from '@/types/database';

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  species: z.string().min(1, 'Espécie é obrigatória'),
  breed: z.string().optional(),
  birth_date: z.string().optional(),
  death_date: z.string().optional(),
  tribute_text: z.string().optional(),
  is_public: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  userId: string;
  pet?: Pet;
}

export default function PetForm({ userId, pet }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!pet;

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(pet?.avatar_url ?? null);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
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
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function uploadAvatar(file: File, petId: string): Promise<string | null> {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${petId}/avatar.${ext}`;
    const { error } = await supabase.storage
      .from('pet-photos')
      .upload(path, file, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('pet-photos').getPublicUrl(path);
    return data.publicUrl;
  }

  async function onSubmit(data: FormData) {
    setServerError('');

    if (isEdit) {
      let avatar_url = pet.avatar_url ?? undefined;
      if (avatarFile) {
        avatar_url = (await uploadAvatar(avatarFile, pet.id)) ?? undefined;
      }
      const result = await updatePet(pet.id, { ...data, avatar_url });
      if (result.error) { setServerError(result.error); return; }
    } else {
      const result = await createPet({ ...data });
      if (result.error || !result.petId) { setServerError(result.error ?? 'Erro ao criar'); return; }
      if (avatarFile) {
        const avatar_url = await uploadAvatar(avatarFile, result.petId);
        if (avatar_url) {
          await updatePet(result.petId, { ...data, avatar_url });
        }
      }
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar */}
      <Card>
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
                type="file"
                id="avatar"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button type="button" variant="outline" size="sm" asChild>
                <label htmlFor="avatar" className="cursor-pointer">
                  Escolher foto
                </label>
              </Button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
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
              <Input id="name" placeholder="Fridis" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="species">Espécie *</Label>
              <Input id="species" placeholder="Cachorro, Gato, Pássaro…" {...register('species')} />
              {errors.species && <p className="text-xs text-destructive">{errors.species.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="breed">Raça</Label>
              <Input id="breed" placeholder="Border Collie" {...register('breed')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="birth_date">Data de nascimento</Label>
              <Input id="birth_date" type="date" {...register('birth_date')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="death_date">Data de falecimento</Label>
              <Input id="death_date" type="date" {...register('death_date')} />
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
            <Label htmlFor="tribute_text">Escreva sobre o seu pet</Label>
            <Textarea
              id="tribute_text"
              placeholder="Conte a história do seu companheiro, o que ele significou para você, os momentos inesquecíveis…"
              rows={6}
              {...register('tribute_text')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Visibility */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg text-on-surface">Página pública</h2>
              <p className="text-sm text-muted-foreground">
                Permitir que qualquer pessoa acesse a página com o link.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="sr-only peer" {...register('is_public')} />
              <div className="peer h-6 w-11 rounded-full bg-surface-container-high peer-checked:bg-primary transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5" />
            </label>
          </div>
        </CardContent>
      </Card>

      {serverError && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Salvar alterações' : 'Criar página'}
        </Button>
      </div>
    </form>
  );
}
