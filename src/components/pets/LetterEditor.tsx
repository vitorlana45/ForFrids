'use client';

import { useState, useTransition } from 'react';
import { Loader2, Mail, Trash2 } from 'lucide-react';
import { removeLetter, saveLetter } from '@/lib/actions/pet-letter';
import { getLetterHeading, LETTER_MAX_CHARS, LETTER_MIN_CHARS } from '@/lib/memorial/letter';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/ConfirmModal';
import type { Pet } from '@/types/database';

interface Props {
  pet: Pick<Pet, 'id' | 'name' | 'death_date' | 'letter_content' | 'letter_is_public'>;
}

export default function LetterEditor({ pet }: Props) {
  const toast = useToast();
  const confirm = useConfirm();
  const [content, setContent] = useState(pet.letter_content ?? '');
  const [isPublic, setIsPublic] = useState(pet.letter_is_public);
  const [hasLetter, setHasLetter] = useState(Boolean(pet.letter_content));
  const [isSaving, startSaving] = useTransition();
  const [isRemoving, startRemoving] = useTransition();

  const isDeceased = Boolean(pet.death_date);
  const heading = getLetterHeading(pet.name, isDeceased);
  const trimmedLength = content.trim().length;
  const canSave = trimmedLength >= LETTER_MIN_CHARS && trimmedLength <= LETTER_MAX_CHARS;

  function save() {
    startSaving(async () => {
      const result = await saveLetter(pet.id, { content: content.trim(), isPublic });
      if (result.error) {
        toast.error('Não foi possível salvar a carta. Tente novamente.');
        return;
      }
      setHasLetter(true);
      toast.success('Carta salva.');
    });
  }

  async function remove() {
    const confirmed = await confirm({
      title: 'Remover carta',
      message: 'A carta será apagada. Você pode escrever outra depois.',
      confirmLabel: 'Remover',
      variant: 'danger',
    });
    if (!confirmed) return;
    startRemoving(async () => {
      const result = await removeLetter(pet.id);
      if (result.error) {
        toast.error('Não foi possível remover a carta. Tente novamente.');
        return;
      }
      setContent('');
      setIsPublic(false);
      setHasLetter(false);
      toast.success('Carta removida.');
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed/40 text-primary">
          <Mail className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-serif text-2xl text-on-surface">{heading}</h2>
          <p className="text-sm text-on-surface-variant">
            {isDeceased
              ? 'Escreva o que sente — uma última carta para o seu companheiro.'
              : 'Escreva o que sente pelo seu companheiro.'}
          </p>
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={12}
        maxLength={LETTER_MAX_CHARS}
        placeholder="Querido(a)..."
        className="w-full resize-y rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 font-serif text-base leading-7 text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <div className="mt-1 flex justify-between text-xs text-on-surface-variant">
        <span>{trimmedLength < LETTER_MIN_CHARS ? `Mínimo de ${LETTER_MIN_CHARS} caracteres` : ''}</span>
        <span>{content.length}/{LETTER_MAX_CHARS}</span>
      </div>

      <label className="mt-4 flex items-start gap-3 text-sm text-on-surface">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-outline-variant text-primary focus:ring-2 focus:ring-primary-fixed"
        />
        <span>
          Tornar pública no memorial
          <span className="block text-xs text-on-surface-variant">
            Se desmarcada, a carta fica só para você, aqui no painel.
          </span>
        </span>
      </label>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!canSave || isSaving}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim disabled:opacity-50"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSaving ? 'Salvando...' : 'Salvar carta'}
        </button>
        {hasLetter && (
          <button
            type="button"
            onClick={remove}
            disabled={isRemoving}
            className="inline-flex items-center gap-2 rounded-full border border-error/30 px-6 py-3 text-sm font-semibold text-error transition-colors hover:bg-error/10 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Remover
          </button>
        )}
      </div>
    </div>
  );
}
