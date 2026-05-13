'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { requestPasswordReset } from '@/lib/auth-client';
import { compress } from '@/lib/storage/compress';
import { deleteUploadedMedia } from '@/lib/storage/rollback';
import { Camera, CreditCard, Loader2, Mail, Pencil, Save, X } from 'lucide-react';
import { createPortalSession } from '@/lib/actions/stripe';
import { updateProfile } from '@/lib/actions/profile';
import { planLabel } from '@/lib/plans';
import type { PlanId, Profile } from '@/types/database';

interface Props {
  profile: Profile;
  effectivePlanId: PlanId;
}

function maskEmail(email: string) {
  const [localPart = '', domainPart = ''] = email.split('@');
  if (!localPart || !domainPart) return email;

  const safeLocal = (() => {
    if (localPart.length <= 2) return `${localPart[0] ?? ''}*`;
    if (localPart.length <= 4) return `${localPart.slice(0, 1)}${'*'.repeat(localPart.length - 2)}${localPart.slice(-1)}`;
    return `${localPart.slice(0, 2)}${'*'.repeat(Math.max(3, localPart.length - 4))}${localPart.slice(-2)}`;
  })();

  const domainSegments = domainPart.split('.').filter(Boolean);
  if (domainSegments.length < 2) {
    return `${safeLocal}@${domainPart.slice(0, 2)}***`;
  }

  const tld = domainSegments.pop() as string;
  const domainName = domainSegments.join('.');
  const safeDomain = `${domainName.slice(0, 2)}***`;

  return `${safeLocal}@${safeDomain}.${tld}`;
}

export default function SettingsForm({ profile, effectivePlanId }: Props) {
  const router = useRouter();
  const maskedEmail = maskEmail(profile.email);

  const [fullName, setFullName] = useState(profile.full_name ?? '');
  const [guardianTitle, setGuardianTitle] = useState(profile.guardian_title ?? 'Tutor e guardiao de memorias');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url ?? null);

  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [billingError, setBillingError] = useState('');

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!editingProfile) return;
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleCancelProfileEdit() {
    setFullName(profile.full_name ?? '');
    setGuardianTitle(profile.guardian_title ?? 'Tutor e guardiao de memorias');
    setBio(profile.bio ?? '');
    setAvatarFile(null);
    setAvatarPreview(profile.avatar_url ?? null);
    setNameError('');
    setNameSuccess(false);
    setEditingProfile(false);
  }

  async function uploadAvatar(file: File) {
    const compressed = await compress(file, 'avatar');
    const path = `profiles/${profile.id}/avatar-${Date.now()}.webp`;
    const form = new FormData();
    form.append('file', compressed);
    form.append('path', path);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    if (!res.ok) throw new Error('Falha no upload da foto.');
    const { url } = await res.json();
    return url as string;
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSavingName(true);
    setNameError('');
    setNameSuccess(false);

    let avatar_url = profile.avatar_url;
    let uploadedAvatarUrl: string | null = null;
    try {
      if (avatarFile) {
        avatar_url = await uploadAvatar(avatarFile);
        uploadedAvatarUrl = avatar_url;
      }
    } catch (error) {
      setSavingName(false);
      setNameError(error instanceof Error ? error.message : 'Nao foi possivel enviar a foto.');
      return;
    }

    const result = await updateProfile({
      full_name: fullName.trim(),
      guardian_title: guardianTitle.trim() || null,
      bio: bio.trim() || null,
      avatar_url,
    });

    setSavingName(false);
    if (result.error) {
      if (uploadedAvatarUrl) await deleteUploadedMedia(uploadedAvatarUrl);
      setNameError(result.error);
      return;
    }
    setNameSuccess(true);
    setAvatarFile(null);
    setEditingProfile(false);
    router.refresh();
  }

  async function handleSendPasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (false) {
      setPasswordError('As senhas não coincidem.');
      return;
    }

    if (false) {
      setPasswordError('A nova senha deve ser diferente da senha atual.');
      return;
    }

    setSavingPassword(true);
    const { error } = await requestPasswordReset({
      email: profile.email,
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    setSavingPassword(false);

    if (error) { setPasswordError(error.message ?? 'Erro ao enviar link.'); return; }
    setPasswordSuccess(true);
  }

  async function handleBillingPortal() {
    setOpeningPortal(true);
    setBillingError('');

    const result = await createPortalSession();
    setOpeningPortal(false);

    if (result.error) {
      setBillingError(result.error);
      return;
    }

    if (result.url) {
      window.location.href = result.url;
    }
  }

  return (
    <div className="space-y-8">
      {/* Profile */}
      <section className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-6 md:p-8">
        <h2 className="mb-1 font-serif text-2xl text-on-surface">Perfil</h2>
        <p className="mb-6 text-sm text-on-surface-variant">Seu nome visível no dashboard.</p>

        <div className="mb-6 flex justify-end">
          {!editingProfile ? (
            <button
              type="button"
              onClick={() => { setNameSuccess(false); setEditingProfile(true); }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar perfil
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancelProfileEdit}
              disabled={savingName}
              className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/40 px-4 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Cancelar
            </button>
          )}
        </div>

        <form onSubmit={handleSaveName} className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <label className={`group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-outline-variant/30 bg-surface-container ${editingProfile ? 'cursor-pointer' : 'cursor-default opacity-80'}`}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-serif text-3xl text-primary">
                  {fullName.trim()[0]?.toUpperCase() ?? 'U'}
                </span>
              )}
              <span className={`absolute inset-0 flex items-center justify-center bg-black/35 text-white opacity-0 transition-opacity ${editingProfile ? 'group-hover:opacity-100' : ''}`}>
                <Camera className="h-5 w-5" />
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={!editingProfile} />
            </label>
            <div>
              <p className="text-sm font-semibold text-on-surface">Foto do tutor</p>
              <p className="mt-1 max-w-sm text-xs text-on-surface-variant">
                Use uma imagem quadrada em JPG, PNG ou WebP. O bucket limita cada arquivo a 2MB.
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-3 text-sm text-on-surface-variant opacity-60"
            />
            <p className="mt-1 text-xs text-on-surface-variant">O e-mail não pode ser alterado.</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface" htmlFor="fullName">
              Nome completo
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Seu nome"
              disabled={!editingProfile}
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-surface-container disabled:text-on-surface-variant disabled:opacity-70"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface" htmlFor="guardianTitle">
              Titulo do perfil
            </label>
            <input
              id="guardianTitle"
              type="text"
              value={guardianTitle}
              onChange={e => setGuardianTitle(e.target.value)}
              placeholder="Tutor e guardiao de memorias"
              disabled={!editingProfile}
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-surface-container disabled:text-on-surface-variant disabled:opacity-70"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface" htmlFor="bio">
              Mensagem do tutor
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={420}
              rows={4}
              placeholder="Uma breve mensagem sobre sua jornada com seus pets."
              disabled={!editingProfile}
              className="w-full resize-none rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-surface-container disabled:text-on-surface-variant disabled:opacity-70"
            />
            <p className="mt-1 text-xs text-on-surface-variant">{bio.length}/420</p>
          </div>

          {nameError && <p className="text-sm text-error">{nameError}</p>}
          {nameSuccess && <p className="text-sm text-primary">Perfil atualizado com sucesso.</p>}

          {editingProfile && (
            <button
              type="submit"
              disabled={savingName || !fullName.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim disabled:opacity-50"
            >
              {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar perfil
            </button>
          )}
        </form>
      </section>

      {/* Password */}
      <section className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-6 md:p-8">
        <h2 className="mb-1 font-serif text-2xl text-on-surface">Segurança</h2>
        <p className="mb-6 text-sm text-on-surface-variant">Altere sua senha de acesso.</p>

        <form onSubmit={handleSendPasswordReset} className="space-y-4">
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-5 py-4">
            <p className="text-sm font-semibold text-on-surface">Redefinicao por e-mail</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Enviaremos um link seguro para <span className="font-semibold text-on-surface">{maskedEmail}</span>.
              A senha so sera alterada depois que voce acessar o link recebido.
            </p>
          </div>

          <div className="hidden">
            <label className="mb-1.5 block text-sm font-semibold text-on-surface" htmlFor="newPassword">
              Nova senha
            </label>
            <input
              id="newPassword"
              type="password"
              value=""
              readOnly
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="hidden">
            <label className="mb-1.5 block text-sm font-semibold text-on-surface" htmlFor="confirmPassword">
              Confirmar nova senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              value=""
              readOnly
              placeholder="Repita a senha"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {passwordError && <p className="text-sm text-error">{passwordError}</p>}
          {passwordSuccess && <p className="text-sm text-primary">Link de redefinicao enviado para seu e-mail.</p>}

          <button
            type="submit"
            disabled={savingPassword}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim disabled:opacity-50"
          >
            {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Enviar link de redefinicao
          </button>
        </form>
      </section>

      {/* Plan info */}
      <section className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-6 md:p-8">
        <h2 className="mb-1 font-serif text-2xl text-on-surface">Plano atual</h2>
        <p className="mb-4 text-sm text-on-surface-variant">
          Você está no plano <span className="font-semibold text-on-surface">{planLabel(effectivePlanId)}</span>.
        </p>
        <div className="flex flex-wrap gap-3">
        <a
          href="/dashboard/planos"
          className="inline-flex items-center gap-2 rounded-full border border-outline-variant/50 px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container"
        >
          Ver planos disponíveis
        </a>
          {effectivePlanId !== 'free' && (
            <button
              type="button"
              onClick={handleBillingPortal}
              disabled={openingPortal}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim disabled:opacity-50"
            >
              {openingPortal ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Gerenciar assinatura
            </button>
          )}
        </div>
        {billingError && <p className="mt-3 text-sm text-error">{billingError}</p>}
      </section>
    </div>
  );
}
