'use client';

import { useState, useEffect } from 'react';

interface Props {
  petName: string;
  memorialUrl: string;
}

export default function MemorialActions({ petName, memorialUrl }: Props) {
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLiked(localStorage.getItem(`liked:${memorialUrl}`) === '1');
  }, [memorialUrl]);

  function toggleLike() {
    const next = !liked;
    setLiked(next);
    localStorage.setItem(`liked:${memorialUrl}`, next ? '1' : '0');
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
        className={`p-2 rounded-lg transition-all ${copied ? 'text-primary bg-primary/10' : 'text-stone-500 hover:bg-primary-container/5'}`}
      >
        <span className="material-symbols-outlined">
          {copied ? 'check_circle' : 'share'}
        </span>
      </button>
      <button
        onClick={toggleLike}
        title={liked ? 'Remover dos favoritos' : 'Favoritar memorial'}
        className={`p-2 rounded-lg transition-all ${liked ? 'text-red-400' : 'text-stone-500 hover:bg-primary-container/5'}`}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}>
          favorite
        </span>
      </button>
      <button
        onClick={scrollToTributes}
        className="px-6 py-2 bg-primary text-on-primary rounded-full font-serif font-medium hover:bg-[#3d4d41] transition-all"
      >
        Deixar Homenagem
      </button>
    </div>
  );
}
