'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Camera, CreditCard, Loader2, Save } from 'lucide-react';
import { createPortalSession } from '@/lib/actions/stripe';
import { planLabel } from '@/lib/plans';
import type { PlanId, Profile } from '@/types/database';

interface Props {
  profile: Profile;
  effectivePlanId: PlanId;
}

export default function SettingsForm({ profile, effectivePlanId }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState(profile.full_name ?? '');
  const [guardianTitle, setGuardianTitle] = useState(profile.guardian_title ?? 'Tutor e guardiao de memorias');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url ?? null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [billingError, setBillingError] = useState('');

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function uploadAvatar(file: File) {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${profile.id}/avatar.${ext}`;
    const { error } = await supabase.storage
      .from('profile-photos')
      .upload(path, file, { upsert: true });
    if (error) throw error;

    const { data } = supabase.storage.from('profile-photos').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSavingName(true);
    setNameError('');
    setNameSuccess(false);

    let avatar_url = profile.avatar_url;
    try {
      if (avatarFile) {
        avatar_url = await uploadAvatar(avatarFile);
      }
    } catch (error) {
      setSavingName(false);
      setNameError(error instanceof Error ? error.message : 'Nao foi possivel enviar a foto.');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        guardian_title: guardianTitle.trim() || null,
        bio: bio.trim() || null,
        avatar_url,
      })
      .eq('id', profile.id);

    setSavingName(false);
    if (error) { setNameError(error.message); return; }
    setNameSuccess(true);
    setAvatarFile(null);
    router.refresh();
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.');
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) { setPasswordError(error.message); return; }
    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
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

        <form onSubmit={handleSaveName} className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <label className="group relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-outline-variant/30 bg-surface-container">
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-serif text-3xl text-primary">
                  {fullName.trim()[0]?.toUpperCase() ?? 'U'}
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-5 w-5" />
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
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
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
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
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
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
              className="w-full resize-none rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-on-surface-variant">{bio.length}/420</p>
          </div>

          {nameError && <p className="text-sm text-error">{nameError}</p>}
          {nameSuccess && <p className="text-sm text-primary">Perfil atualizado com sucesso.</p>}

          <button
            type="submit"
            disabled={savingName || !fullName.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim disabled:opacity-50"
          >
            {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar perfil
          </button>
        </form>
      </section>

      {/* Password */}
      <section className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-6 md:p-8">
        <h2 className="mb-1 font-serif text-2xl text-on-surface">Segurança</h2>
        <p className="mb-6 text-sm text-on-surface-variant">Altere sua senha de acesso.</p>

        <form onSubmit={handleSavePassword} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface" htmlFor="newPassword">
              Nova senha
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface" htmlFor="confirmPassword">
              Confirmar nova senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {passwordError && <p className="text-sm text-error">{passwordError}</p>}
          {passwordSuccess && <p className="text-sm text-primary">Senha alterada com sucesso.</p>}

          <button
            type="submit"
            disabled={savingPassword || !newPassword || !confirmPassword}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim disabled:opacity-50"
          >
            {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Alterar senha
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
