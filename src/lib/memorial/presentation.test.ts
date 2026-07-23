import { describe, it, expect } from 'vitest';
import {
  buildPresentationSlides,
  countPresentationPhotos,
  MIN_PRESENTATION_PHOTOS,
} from './presentation';
import type { Pet, TimelineEntry } from '@/types/database';

function makePet(over: Partial<Pet> = {}): Pet {
  return {
    id: 'p1',
    owner_id: 'o1',
    name: 'Max',
    species: 'cachorro',
    breed: null,
    birth_date: '2012-03-01',
    death_date: '2024-06-01',
    avatar_url: 'https://cdn/avatar.jpg',
    memorial_slug: 'max',
    is_public: true,
    tribute_text: 'Amado para sempre',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...over,
  };
}

function makeEntry(over: Partial<TimelineEntry> = {}): TimelineEntry {
  return {
    id: 'e1',
    pet_id: 'p1',
    title: 'Primeiro dia',
    description: 'A chegada em casa',
    date: '2012-04-01',
    photo_urls: ['https://cdn/1.jpg'],
    created_at: '2024-01-01',
    ...over,
  };
}

describe('countPresentationPhotos', () => {
  it('soma as fotos nao vazias de todos os momentos', () => {
    const entries = [
      makeEntry({ photo_urls: ['a', 'b'] }),
      makeEntry({ id: 'e2', photo_urls: ['c'] }),
    ];
    expect(countPresentationPhotos(entries)).toBe(3);
  });

  it('ignora strings vazias em photo_urls', () => {
    const entries = [makeEntry({ photo_urls: ['a', '', 'b'] })];
    expect(countPresentationPhotos(entries)).toBe(2);
  });

  it('MIN_PRESENTATION_PHOTOS e 3', () => {
    expect(MIN_PRESENTATION_PHOTOS).toBe(3);
  });
});

describe('buildPresentationSlides', () => {
  it('comeca com a capa e termina com o encerramento', () => {
    const slides = buildPresentationSlides(makePet(), [makeEntry()]);
    expect(slides[0].kind).toBe('cover');
    expect(slides[slides.length - 1].kind).toBe('closing');
  });

  it('gera um slide por foto, na ordem dos momentos', () => {
    const entries = [
      makeEntry({ id: 'e1', title: 'A', date: '2012-04-01', photo_urls: ['a1', 'a2'] }),
      makeEntry({ id: 'e2', title: 'B', date: '2013-04-01', photo_urls: ['b1'] }),
    ];
    const photos = buildPresentationSlides(makePet(), entries).filter(s => s.kind === 'photo');
    expect(photos.map(s => (s as { photoUrl: string }).photoUrl)).toEqual(['a1', 'a2', 'b1']);
  });

  it('descricao aparece so no primeiro slide de cada momento', () => {
    const entries = [makeEntry({ description: 'oi', photo_urls: ['a1', 'a2', 'a3'] })];
    const photos = buildPresentationSlides(makePet(), entries)
      .filter(s => s.kind === 'photo') as Array<{ description: string | null }>;
    expect(photos[0].description).toBe('oi');
    expect(photos[1].description).toBeNull();
    expect(photos[2].description).toBeNull();
  });

  it('capa carrega nome, anos, avatar e tributo', () => {
    const [cover] = buildPresentationSlides(makePet(), [makeEntry()]);
    expect(cover).toMatchObject({
      kind: 'cover',
      petName: 'Max',
      avatarUrl: 'https://cdn/avatar.jpg',
      birthYear: 2012,
      deathYear: 2024,
      tribute: 'Amado para sempre',
    });
  });

  it('pet vivo: isAlive true e deathYear null no encerramento', () => {
    const slides = buildPresentationSlides(makePet({ death_date: null }), [makeEntry()]);
    const closing = slides[slides.length - 1];
    expect(closing).toMatchObject({ kind: 'closing', isAlive: true, deathYear: null });
  });

  it('lida com campos ausentes (sem tributo, sem datas, sem avatar)', () => {
    const [cover] = buildPresentationSlides(
      makePet({ tribute_text: null, birth_date: null, death_date: null, avatar_url: null }),
      [makeEntry()],
    );
    expect(cover).toMatchObject({ birthYear: null, deathYear: null, tribute: null, avatarUrl: null });
  });

  it('timeline sem fotos retorna apenas capa e encerramento', () => {
    const slides = buildPresentationSlides(makePet(), []);
    expect(slides.map(s => s.kind)).toEqual(['cover', 'closing']);
  });
});
