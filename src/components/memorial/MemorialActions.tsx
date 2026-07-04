'use client';

import { useEffect, useState, useTransition } from 'react';
import AuthRequiredPrompt from '@/components/auth/AuthRequiredPrompt';
import ReportDialog from '@/components/memorial/ReportDialog';
import { getMemorialReactionState, toggleMemorialReaction } from '@/lib/actions/reactions';
import { useSession } from '@/lib/auth-client';

interface Props {
  petId: string;
  petName: string;
  memorialSlug: string;
  memorialUrl: string;
  initialLikesCount: number;
}

export default function MemorialActions({
  petId,
  petName,
  memorialSlug,
  memorialUrl,
  initialLikesCount,
}: Props) {
  const { data: session, isPending: sessionPending } = useSession();
  const isAuthenticated = !!session;

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [copied, setCopied] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isPending, startTransition] = useTransition();

  // A página do memorial é estática (ISR); o estado "curtido" é por usuário e chega aqui
  useEffect(() => {
    if (!isAuthenticated) {
      setLiked(false);
      return;
    }
    let cancelled = false;
    getMemorialReactionState(petId).then(({ liked }) => {
      if (!cancelled) setLiked(liked);
    });
    return () => { cancelled = true; };
  }, [isAuthenticated, petId]);

  function toggleLike() {
    if (sessionPending) return;
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    const previousLiked = liked;
    const previousCount = likesCount;
    const nextLiked = !previousLiked;

    setLiked(nextLiked);
    setLikesCount(Math.max(0, previousCount + (nextLiked ? 1 : -1)));

    startTransition(async () => {
      const result = await toggleMemorialReaction(petId, memorialSlug);

      if (result.error) {
        setLiked(previousLiked);
        setLikesCount(previousCount);
        return;
      }

      if (typeof result.liked === 'boolean') setLiked(result.liked);
      if (typeof result.count === 'number') setLikesCount(result.count);
    });
  }

  async function share() {
    const data = { title: `Memorial de ${petName} — Eterno Pet`, url: memorialUrl };
    if (navigator.share) {
      try { await navigator.share(data); return; } catch {}
    }
    await navigator.clipboard.writeText(memorialUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(`✨ Conheça o memorial de ${petName} no Eterno Pet:\n${memorialUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  }

  function scrollToTributes() {
    document.getElementById('tributos')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={shareWhatsApp}
        title="Compartilhar no WhatsApp"
        className="p-2 rounded-lg text-on-surface-variant transition-all hover:bg-surface-container hover:text-[#25D366]"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
        </svg>
      </button>
      <button
        onClick={share}
        title={copied ? 'Link copiado!' : 'Compartilhar'}
        className={`p-2 rounded-lg transition-all ${copied ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:bg-surface-container'}`}
      >
        <span className="material-symbols-outlined">
          {copied ? 'check_circle' : 'share'}
        </span>
      </button>
      <button
        onClick={toggleLike}
        disabled={isPending}
        title={liked ? `${likesCount} curtidas - remover` : `${likesCount} curtidas - favoritar`}
        className={`flex items-center gap-1.5 rounded-lg p-2 transition-all disabled:opacity-60 ${liked ? 'text-red-400' : 'text-on-surface-variant hover:bg-surface-container'}`}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}>
          favorite
        </span>
        {likesCount > 0 && (
          <span className="text-xs font-bold tabular-nums">{likesCount}</span>
        )}
      </button>
      <button
        onClick={scrollToTributes}
        className="px-6 py-2 bg-primary text-on-primary rounded-full font-serif font-medium hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim transition-all"
      >
        Deixar Homenagem
      </button>
      <button
        onClick={() => setShowReport(true)}
        title="Denunciar este memorial"
        className="p-2 rounded-lg text-on-surface-variant transition-all hover:bg-surface-container hover:text-error"
      >
        <span className="material-symbols-outlined">flag</span>
      </button>

      {showAuthPrompt && (
        <AuthRequiredPrompt
          title="Entre para favoritar"
          description="Crie uma conta ou entre para salvar este memorial e registrar sua curtida."
          onClose={() => setShowAuthPrompt(false)}
        />
      )}

      {showReport && (
        <ReportDialog
          memorialSlug={memorialSlug}
          petName={petName}
          isAuthenticated={isAuthenticated}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
