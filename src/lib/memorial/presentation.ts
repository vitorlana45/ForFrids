import type { Pet, TimelineEntry } from '@/types/database';

export const MIN_PRESENTATION_PHOTOS = 3;

export interface CoverSlide {
  kind: 'cover';
  petName: string;
  avatarUrl: string | null;
  birthYear: number | null;
  deathYear: number | null;
  tribute: string | null;
}
export interface PhotoSlide {
  kind: 'photo';
  photoUrl: string;
  momentTitle: string;
  momentDate: string | null; // ISO cru; o client formata para exibir
  description: string | null; // so no 1o slide do momento
}
export interface ClosingSlide {
  kind: 'closing';
  petName: string;
  birthYear: number | null;
  deathYear: number | null;
  isAlive: boolean;
}
export type PresentationSlide = CoverSlide | PhotoSlide | ClosingSlide;

function yearOf(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.getFullYear();
}

/** Conta as fotos elegiveis (todos os photo_urls nao vazios dos momentos). */
export function countPresentationPhotos(entries: Pick<TimelineEntry, 'photo_urls'>[]): number {
  return entries.reduce((total, e) => total + (e.photo_urls ?? []).filter(Boolean).length, 0);
}

/**
 * Monta [capa, ...fotos, encerramento]. Assume `entries` ja ordenados (a rota
 * usa orderBy date asc). Dentro do momento, segue a ordem de photo_urls; a
 * descricao aparece so no primeiro slide de cada momento.
 */
export function buildPresentationSlides(pet: Pet, entries: TimelineEntry[]): PresentationSlide[] {
  const birthYear = yearOf(pet.birth_date);
  const deathYear = yearOf(pet.death_date);

  const cover: CoverSlide = {
    kind: 'cover',
    petName: pet.name,
    avatarUrl: pet.avatar_url,
    birthYear,
    deathYear,
    tribute: pet.tribute_text,
  };

  const photos: PhotoSlide[] = [];
  for (const entry of entries) {
    const urls = (entry.photo_urls ?? []).filter(Boolean);
    urls.forEach((photoUrl, i) => {
      photos.push({
        kind: 'photo',
        photoUrl,
        momentTitle: entry.title,
        momentDate: entry.date,
        description: i === 0 ? entry.description : null,
      });
    });
  }

  const closing: ClosingSlide = {
    kind: 'closing',
    petName: pet.name,
    birthYear,
    deathYear,
    isAlive: !pet.death_date,
  };

  return [cover, ...photos, closing];
}
