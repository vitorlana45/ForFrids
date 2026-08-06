'use client';

import { useState, useTransition } from 'react';
import { Loader2, Lock, Mail, Pencil, Trash2, X } from 'lucide-react';
import { removeLetter, saveLetter } from '@/lib/actions/pet-letter';
import {
  getLetterHeading,
  LETTER_MAX_CHARS,
  LETTER_MIN_CHARS,
  SIGNATURE_TEXT_MAX,
} from '@/lib/memorial/letter';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/ConfirmModal';
import SignaturePad from './SignaturePad';
import type { Pet } from '@/types/database';

type SigMode = 'default' | 'type' | 'draw';

interface Props {
  pet: Pick<
    Pet,
    | 'id'
    | 'name'
    | 'death_date'
    | 'letter_content'
    | 'letter_is_public'
    | 'letter_signature_text'
    | 'letter_signature_drawing'
  >;
}

const SIG_TABS: { id: SigMode; label: string }[] = [
  { id: 'default', label: 'Nome do perfil' },
  { id: 'type', label: 'Digitar' },
  { id: 'draw', label: 'Desenhar' },
];

function initialSigMode(pet: Props['pet']): SigMode {
  if (pet.letter_signature_drawing) return 'draw';
  if (pet.letter_signature_text) return 'type';
  return 'default';
}

export default function LetterEditor({ pet }: Props) {
  const toast = useToast();
  const confirm = useConfirm();
  const [content, setContent] = useState(pet.letter_content ?? '');
  const [isPublic, setIsPublic] = useState(pet.letter_is_public);
  const [hasLetter, setHasLetter] = useState(Boolean(pet.letter_content));
  const [editing, setEditing] = useState(!pet.letter_content);
  const [sigMode, setSigMode] = useState<SigMode>(initialSigMode(pet));
  const [sigText, setSigText] = useState(pet.letter_signature_text ?? '');
  const [sigDrawing, setSigDrawing] = useState(pet.letter_signature_drawing ?? '');
  const [isSaving, startSaving] = useTransition();
  const [isRemoving, startRemoving] = useTransition();

  const isDeceased = Boolean(pet.death_date);
  const heading = getLetterHeading(pet.name, isDeceased);
  const trimmedLength = content.trim().length;
  const canSave = trimmedLength >= LETTER_MIN_CHARS && trimmedLength <= LETTER_MAX_CHARS;
  const locked = !editing;

  function save() {
    startSaving(async () => {
      const signatureText = sigMode === 'type' ? sigText.trim() || null : null;
      const signatureDrawing = sigMode === 'draw' ? sigDrawing || null : null;
      const result = await saveLetter(pet.id, {
        content: content.trim(),
        isPublic,
        signatureText,
        signatureDrawing,
      });
      if (result.error) {
        toast.error('Não foi possível salvar a carta. Tente novamente.');
        return;
      }
      setHasLetter(true);
      setEditing(false);
      toast.success('Carta salva.');
    });
  }

  function cancel() {
    setContent(pet.letter_content ?? '');
    setIsPublic(pet.letter_is_public);
    setSigMode(initialSigMode(pet));
    setSigText(pet.letter_signature_text ?? '');
    setSigDrawing(pet.letter_signature_drawing ?? '');
    setEditing(false);
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
      setSigMode('default');
      setSigText('');
      setSigDrawing('');
      setHasLetter(false);
      setEditing(true);
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

      {/* Barra de estado quando ja existe carta salva */}
      {hasLetter && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-on-surface-variant">
            {locked ? <Lock className="h-4 w-4 text-primary" /> : <Pencil className="h-4 w-4 text-primary" />}
            {locked
              ? `Carta salva · ${pet.letter_is_public ? 'pública no memorial' : 'privada'}`
              : 'Editando a carta'}
          </p>
          {locked ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
          ) : (
            <button
              type="button"
              onClick={cancel}
              className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/40 px-4 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container"
            >
              <X className="h-3.5 w-3.5" />
              Cancelar
            </button>
          )}
        </div>
      )}

      {/* Campos editaveis (bloqueados quando travado) */}
      <div className={locked ? 'pointer-events-none opacity-70' : ''}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          maxLength={LETTER_MAX_CHARS}
          disabled={locked}
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
            disabled={locked}
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

        {/* Assinatura */}
        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold text-on-surface">Assinatura</p>
          <div className="mb-3 inline-flex flex-wrap gap-1 rounded-full border border-outline-variant/30 p-1">
            {SIG_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                disabled={locked}
                onClick={() => setSigMode(tab.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  sigMode === tab.id
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {sigMode === 'default' && (
            <p className="text-sm text-on-surface-variant">
              A carta será assinada com o nome do seu perfil, em letra manuscrita.
            </p>
          )}

          {sigMode === 'type' && (
            <div>
              <input
                value={sigText}
                disabled={locked}
                onChange={(e) => setSigText(e.target.value)}
                maxLength={SIGNATURE_TEXT_MAX}
                placeholder="Como você quer assinar?"
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {sigText.trim() && (
                <p className="mt-2 text-4xl text-primary" style={{ fontFamily: '"Caveat", cursive' }}>
                  {sigText}
                </p>
              )}
            </div>
          )}

          {sigMode === 'draw' && <SignaturePad value={sigDrawing} onChange={setSigDrawing} />}
        </div>
      </div>

      {/* Acoes (so quando editando) */}
      {editing && (
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
      )}
    </div>
  );
}
