'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';

interface Props {
  photos: string[];
}

export default function GalleryLightbox({ photos }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(
    () => setOpenIndex(i => (i === null ? null : (i - 1 + photos.length) % photos.length)),
    [photos.length],
  );
  const next = useCallback(
    () => setOpenIndex(i => (i === null ? null : (i + 1) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [openIndex, close, prev, next]);

  // Masonry: 4 colunas com deslocamento alternado (mesmo layout anterior do server component)
  const columns: { url: string; index: number }[][] = [[], [], [], []];
  photos.forEach((url, i) => columns[i % 4].push({ url, index: i }));

  return (
    <>
      {photos.length < 4 ? (
        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          {photos.map((url, idx) => (
            <button
              key={url + idx}
              type="button"
              onClick={() => setOpenIndex(idx)}
              className="rounded-xl overflow-hidden relative aspect-[3/4] w-48 md:w-64 shrink-0 cursor-zoom-in focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Ampliar foto"
            >
              <Image src={url} alt="" fill unoptimized className="object-cover hover:scale-105 transition-transform duration-700" />
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 items-start">
          {columns.map((colPhotos, col) => (
            <div key={col} className={`grid gap-4 md:gap-6 ${col % 2 !== 0 ? 'pt-8 md:pt-12' : ''}`}>
              {colPhotos.map(({ url, index }, idx) => (
                <button
                  key={url + index}
                  type="button"
                  onClick={() => setOpenIndex(index)}
                  className={`rounded-xl overflow-hidden relative cursor-zoom-in focus-visible:ring-2 focus-visible:ring-primary ${
                    idx % 2 === 0 ? 'aspect-[3/4]' : 'aspect-square'
                  }`}
                  aria-label="Ampliar foto"
                >
                  <Image src={url} alt="" fill unoptimized className="object-cover hover:scale-105 transition-transform duration-700" />
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Overlay */}
      {openIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Foto ampliada"
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Fechar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); prev(); }}
                className="absolute left-2 md:left-6 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Foto anterior"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); next(); }}
                className="absolute right-2 md:right-6 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Próxima foto"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </>
          )}

          <div className="relative h-[85vh] w-[92vw] md:w-[85vw]" onClick={e => e.stopPropagation()}>
            <Image
              src={photos[openIndex]}
              alt=""
              fill
              unoptimized
              className="object-contain"
              priority
            />
          </div>

          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
            {openIndex + 1} / {photos.length}
          </span>
        </div>
      )}
    </>
  );
}
