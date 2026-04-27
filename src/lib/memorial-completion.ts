import type { Pet } from '@/types/database';

export type MemorialCompletionItem = {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  complete: boolean;
};

export type MemorialCompletion = {
  percent: number;
  score: number;
  maxScore: number;
  items: MemorialCompletionItem[];
  nextAction: string | null;
};

type MemorialCompletionInput = {
  pet: Pick<Pet, 'name' | 'species' | 'breed' | 'birth_date' | 'death_date' | 'avatar_url' | 'tribute_text' | 'is_public'>;
  timelineEntryCount: number;
  timelinePhotoCount: number;
};

const MAX_SCORE = 100;

export function getMemorialCompletion({
  pet,
  timelineEntryCount,
  timelinePhotoCount,
}: MemorialCompletionInput): MemorialCompletion {
  const tributeLength = pet.tribute_text?.trim().length ?? 0;
  const hasLifeDate = Boolean(pet.birth_date || pet.death_date);

  const items: MemorialCompletionItem[] = [
    {
      id: 'basic',
      label: 'Dados basicos',
      score: basicInfoScore(pet),
      maxScore: 15,
      complete: Boolean(pet.name?.trim() && pet.species?.trim() && pet.breed?.trim()),
    },
    {
      id: 'avatar',
      label: 'Foto principal',
      score: pet.avatar_url ? 20 : 0,
      maxScore: 20,
      complete: Boolean(pet.avatar_url),
    },
    {
      id: 'tribute',
      label: 'Texto de homenagem',
      score: tributeScore(tributeLength),
      maxScore: 20,
      complete: tributeLength >= 80,
    },
    {
      id: 'dates',
      label: 'Datas importantes',
      score: hasLifeDate ? 10 : 0,
      maxScore: 10,
      complete: hasLifeDate,
    },
    {
      id: 'timeline',
      label: 'Momentos da linha do tempo',
      score: timelineScore(timelineEntryCount),
      maxScore: 20,
      complete: timelineEntryCount >= 5,
    },
    {
      id: 'photos',
      label: 'Fotos no album',
      score: timelinePhotoScore(timelinePhotoCount),
      maxScore: 10,
      complete: timelinePhotoCount >= 6,
    },
    {
      id: 'public',
      label: 'Memorial publico',
      score: pet.is_public ? 5 : 0,
      maxScore: 5,
      complete: pet.is_public,
    },
  ];

  const score = items.reduce((total, item) => total + item.score, 0);
  const percent = Math.min(MAX_SCORE, Math.round((score / MAX_SCORE) * 100));

  return {
    percent,
    score,
    maxScore: MAX_SCORE,
    items,
    nextAction: nextAction(items),
  };
}

function basicInfoScore(pet: Pick<Pet, 'name' | 'species' | 'breed'>) {
  let score = 0;
  if (pet.name?.trim()) score += 6;
  if (pet.species?.trim()) score += 6;
  if (pet.breed?.trim()) score += 3;
  return score;
}

function tributeScore(length: number) {
  if (length >= 80) return 20;
  if (length >= 30) return 15;
  if (length > 0) return 8;
  return 0;
}

function timelineScore(count: number) {
  if (count >= 5) return 20;
  if (count >= 3) return 17;
  if (count >= 1) return 12;
  return 0;
}

function timelinePhotoScore(count: number) {
  if (count >= 6) return 10;
  if (count >= 3) return 8;
  if (count >= 1) return 5;
  return 0;
}

function nextAction(items: MemorialCompletionItem[]) {
  const priority = ['avatar', 'tribute', 'dates', 'timeline', 'photos', 'public', 'basic'];
  const item = priority
    .map(id => items.find(candidate => candidate.id === id))
    .find(candidate => candidate && !candidate.complete);

  if (!item) return null;

  const actions: Record<string, string> = {
    avatar: 'Adicionar uma foto principal',
    tribute: 'Escrever uma homenagem mais completa',
    dates: 'Adicionar uma data importante',
    timeline: 'Registrar mais momentos na linha do tempo',
    photos: 'Adicionar fotos aos momentos',
    public: 'Publicar o memorial',
    basic: 'Completar os dados basicos',
  };

  return actions[item.id] ?? null;
}
