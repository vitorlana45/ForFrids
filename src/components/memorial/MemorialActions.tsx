'use client';

import { useState, useTransition } from 'react';
import AuthRequiredPrompt from '@/components/auth/AuthRequiredPrompt';
import { toggleMemorialReaction } from '@/lib/actions/reactions';

interface Props {
  petId: string;
  petName: string;
  memorialSlug: string;
  memorialUrl: string;
  isAuthenticated: boolean;
  initialLiked: boolean;
  initialLikesCount: number;
}

export default function MemorialActions({
  petId,
  petName,
  memorialSlug,
  memorialUrl,
  isAuthenticated,
  initialLiked,
  initialLikesCount,
}: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [copied, setCopied] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleLike() {
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

  function scrollToTributes() {
    document.getElementById('tributos')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="flex items-center gap-3">
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

      {showAuthPrompt && (
        <AuthRequiredPrompt
          title="Entre para favoritar"
          description="Crie uma conta ou entre para salvar este memorial e registrar sua curtida."
          onClose={() => setShowAuthPrompt(false)}
        />
      )}
    </div>
  );
}
