'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play, Share2, X } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import type { PresentationSlide } from '@/lib/memorial/presentation';

const SLIDE_MS = 5000;
const COVER_MS = 4000;
const CONTROLS_HIDE_MS = 3000;

interface Props {
  slides: PresentationSlide[];
  memorialSlug: string;
  petName: string;
  memorialUrl: string;
}

function formatMonthYear(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

function formatYears(birthYear: number | null, deathYear: number | null): string {
  if (birthYear && deathYear) return `${birthYear} – ${deathYear}`;
  if (birthYear) return `${birthYear}`;
  if (deathYear) return `${deathYear}`;
  return '';
}

export default function PresentationPlayer({ slides, memorialSlug, petName, memorialUrl }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swiped = useRef(false);
  const touchStartX = useRef<number | null>(null);

  const lastIndex = slides.length - 1;
  const current = slides[index];

  const close = useCallback(() => {
    router.push(`/memorial/${memorialSlug}`);
  }, [router, memorialSlug]);

  const goNext = useCallback(() => {
    setIndex((i) => {
      if (i >= lastIndex) {
        setPlaying(false);
        return i;
      }
      return i + 1;
    });
  }, [lastIndex]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  // Autoplay: para no encerramento (ultimo slide).
  useEffect(() => {
    if (!playing || index >= lastIndex) return;
    const duration = current.kind === 'cover' ? COVER_MS : SLIDE_MS;
    const t = setTimeout(goNext, duration);
    return () => clearTimeout(t);
  }, [playing, index, lastIndex, current, goNext]);

  // Teclado
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p); }
      else if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, close]);

  // Trava o scroll do body enquanto a apresentacao esta aberta
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Auto-hide dos controles apos inatividade
  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), CONTROLS_HIDE_MS);
  }, []);

  useEffect(() => {
    revealControls();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [revealControls]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      swiped.current = true;
      if (dx < 0) goNext(); else goPrev();
    }
    touchStartX.current = null;
  }

  // Clique no fundo: metade esquerda volta, direita avanca (ignora apos swipe).
  function onBackgroundClick(e: React.MouseEvent) {
    if (swiped.current) { swiped.current = false; return; }
    if (e.clientX < window.innerWidth / 2) goPrev(); else goNext();
  }

  async function share() {
    try {
      if (navigator.share) { await navigator.share({ title: petName, url: memorialUrl }); return; }
      await navigator.clipboard.writeText(memorialUrl);
      toast.success('Link copiado');
    } catch {
      /* usuario cancelou o compartilhamento */
    }
  }

  return (
    <div
      className="fixed inset-0 z-[260] select-none overflow-hidden bg-black text-white"
      onMouseMove={revealControls}
      onClick={onBackgroundClick}
      onTouchStart={(e) => { revealControls(); onTouchStart(e); }}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-roledescription="apresentação"
      aria-label={`Apresentação de ${petName}`}
    >
      {/* Camadas de slides (crossfade por opacidade) */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === index ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden={i === index ? undefined : true}
        >
          {slide.kind === 'photo' && (
            <>
              <div className="ep-kenburns absolute inset-0">
                <Image
                  src={slide.photoUrl}
                  alt={`${petName} — ${slide.momentTitle}`}
                  fill
                  unoptimized
                  priority={i === index}
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-8 pb-24 md:p-16 md:pb-28">
                <p className="font-serif text-3xl md:text-5xl">{slide.momentTitle}</p>
                {slide.momentDate && (
                  <p className="mt-1 text-sm uppercase tracking-[0.2em] text-white/70">{formatMonthYear(slide.momentDate)}</p>
                )}
                {slide.description && (
                  <p className="mt-3 max-w-2xl text-base text-white/80 md:text-lg">{slide.description}</p>
                )}
              </div>
            </>
          )}

          {slide.kind === 'cover' && (
            <div className="relative flex h-full flex-col items-center justify-center px-8 text-center">
              {slide.avatarUrl && (
                <>
                  <div className="ep-kenburns absolute inset-0 opacity-30 blur-2xl">
                    <Image src={slide.avatarUrl} alt="" fill unoptimized sizes="100vw" className="object-cover" />
                  </div>
                  <div className="relative mb-8 h-40 w-40 overflow-hidden rounded-full border-4 border-white/20 shadow-2xl md:h-56 md:w-56">
                    <Image src={slide.avatarUrl} alt={petName} fill unoptimized priority sizes="224px" className="object-cover" />
                  </div>
                </>
              )}
              <h1 className="relative font-serif text-5xl md:text-7xl">{slide.petName}</h1>
              {formatYears(slide.birthYear, slide.deathYear) && (
                <p className="relative mt-3 text-sm uppercase tracking-[0.3em] text-white/70">{formatYears(slide.birthYear, slide.deathYear)}</p>
              )}
              {slide.tribute && (
                <p className="relative mt-6 max-w-xl font-serif text-xl italic text-white/85 md:text-2xl">“{slide.tribute}”</p>
              )}
            </div>
          )}

          {slide.kind === 'closing' && (
            <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
              <p className="font-serif text-4xl md:text-6xl">
                {slide.isAlive ? `A história de ${slide.petName} continua` : `Para sempre, ${slide.petName}`}
              </p>
              {formatYears(slide.birthYear, slide.deathYear) && (
                <p className="text-sm uppercase tracking-[0.3em] text-white/60">{formatYears(slide.birthYear, slide.deathYear)}</p>
              )}
              <p className="mt-2 font-serif text-sm italic text-white/50">Eterno Pet</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
                <Link
                  href={`/memorial/${memorialSlug}`}
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
                >
                  Voltar ao memorial
                </Link>
                <button
                  type="button"
                  onClick={share}
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <Share2 className="h-4 w-4" /> Compartilhar
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Controles (nao capturam o clique de fundo, exceto os clusters) */}
      <div className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0'}`}>
        {/* Barra de progresso segmentada */}
        <div className="pointer-events-auto absolute inset-x-0 top-0 flex gap-1 p-3" onClick={(e) => e.stopPropagation()}>
          {slides.map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
              <div
                className={`h-full origin-left rounded-full bg-white ${i < index ? 'scale-x-100' : i === index ? 'ep-progress' : 'scale-x-0'}`}
                style={i === index ? { animationDuration: `${current.kind === 'cover' ? COVER_MS : SLIDE_MS}ms`, animationPlayState: playing ? 'running' : 'paused' } : undefined}
              />
            </div>
          ))}
        </div>

        {/* Topo direito: contador + fechar */}
        <div className="pointer-events-auto absolute right-3 top-8 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <span className="rounded-full bg-black/30 px-3 py-1 text-xs text-white/80">{index + 1} / {slides.length}</span>
          <button type="button" onClick={close} aria-label="Fechar apresentação" className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Base: navegacao + play/pause */}
        <div className="pointer-events-auto absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 p-5" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={goPrev} aria-label="Slide anterior" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pausar' : 'Reproduzir'} className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105">
            {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </button>
          <button type="button" onClick={goNext} aria-label="Próximo slide" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
