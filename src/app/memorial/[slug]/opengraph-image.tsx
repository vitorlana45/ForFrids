import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const alt = 'Memorial Eterno Pet';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Props {
  params: Promise<{ slug: string }>;
}

function yearOf(date: Date | null) {
  return date ? new Date(date).getFullYear() : null;
}

// Satori (next/og) não suporta webp — busca o avatar e converte para PNG.
// Qualquer falha (storage fora, timeout, formato) cai no fallback sem quebrar a imagem.
async function loadAvatarAsPng(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const input = Buffer.from(await res.arrayBuffer());
    const sharp = (await import('sharp')).default;
    const png = await sharp(input).resize(420, 420, { fit: 'cover' }).png().toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    return null;
  }
}

export default async function OpenGraphImage({ params }: Props) {
  const { slug } = await params;
  const pet = await prisma.pet.findFirst({
    where: { memorial_slug: slug, is_public: true, moderation_status: { not: 'blocked' } },
    select: {
      name: true,
      species: true,
      birth_date: true,
      death_date: true,
      avatar_url: true,
      tribute_text: true,
    },
  });

  if (!pet) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FAF7F2',
            fontSize: 72,
            color: '#4A5D4A',
            fontFamily: 'serif',
          }}
        >
          Eterno Pet
        </div>
      ),
      size,
    );
  }

  const avatarSrc = pet.avatar_url ? await loadAvatarAsPng(pet.avatar_url) : null;

  const birthYear = yearOf(pet.birth_date);
  const deathYear = yearOf(pet.death_date);
  const lifespan = deathYear
    ? `${birthYear ?? '...'} — ${deathYear}`
    : birthYear
      ? `${birthYear}`
      : pet.species;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #FAF7F2 0%, #EFE8DC 100%)',
          padding: '70px',
          fontFamily: 'serif',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 22,
                letterSpacing: '0.3em',
                color: '#8B6F47',
                textTransform: 'uppercase',
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              Eterno Pet
            </div>
            <div
              style={{
                fontSize: 32,
                color: '#7A8B7A',
                fontStyle: 'italic',
                marginBottom: 30,
              }}
            >
              {pet.death_date ? 'Em memória de' : 'Memorial de'}
            </div>
            <div
              style={{
                fontSize: 110,
                color: '#4A5D4A',
                lineHeight: 1,
                fontWeight: 500,
              }}
            >
              {pet.name}
            </div>
            <div
              style={{
                fontSize: 38,
                color: '#7A8B7A',
                fontStyle: 'italic',
                marginTop: 24,
              }}
            >
              {lifespan}
            </div>
          </div>

          {pet.tribute_text && (
            <div
              style={{
                fontSize: 28,
                color: '#5A6B5A',
                fontStyle: 'italic',
                lineHeight: 1.4,
                maxWidth: 600,
                display: 'flex',
              }}
            >
              {`"${pet.tribute_text.length > 140 ? `${pet.tribute_text.slice(0, 140).trimEnd()}…` : pet.tribute_text}"`}
            </div>
          )}
        </div>

        <div
          style={{
            width: 420,
            height: 420,
            borderRadius: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
            background: '#FFF',
            border: '8px solid #FFF',
            boxShadow: '0 24px 48px rgba(74, 93, 74, 0.18)',
            overflow: 'hidden',
          }}
        >
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarSrc}
              alt={pet.name}
              width={420}
              height={420}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          ) : (
            <div style={{ fontSize: 200, color: '#C7B89C' }}>🐾</div>
          )}
        </div>
      </div>
    ),
    size,
  );
}
