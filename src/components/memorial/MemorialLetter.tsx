import { getLetterHeading } from '@/lib/memorial/letter';

interface Props {
  content: string;
  petName: string;
  ownerName: string | null;
  ownerTitle: string | null;
  updatedAt: string | null;
  isDeceased: boolean;
}

export default function MemorialLetter({
  content,
  petName,
  ownerName,
  ownerTitle,
  updatedAt,
  isDeceased,
}: Props) {
  const heading = getLetterHeading(petName, isDeceased);
  const dateLabel = updatedAt
    ? new Date(updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Título da seção */}
      <div className="mb-12 text-center">
        <h2 className="font-serif text-4xl text-primary md:text-5xl">{heading}</h2>
      </div>

      {/* A carta como artefato */}
      <article className="relative overflow-hidden rounded-[1.75rem] border border-secondary/15 bg-surface-container-lowest px-7 py-12 shadow-memorial md:px-16 md:py-16">
        {/* Marca d'água discreta (pegada) */}
        <span
          aria-hidden
          className="material-symbols-outlined pointer-events-none absolute -bottom-10 -right-8 select-none text-[190px] leading-none text-primary/[0.045]"
        >
          pets
        </span>

        {/* Data, no alto — como uma carta datada */}
        {dateLabel && (
          <p className="relative mb-8 text-right font-sans text-[11px] uppercase tracking-[0.22em] text-on-surface-variant/70">
            {dateLabel}
          </p>
        )}

        {/* Corpo: as palavras do tutor, com as quebras preservadas */}
        <p
          className="relative whitespace-pre-line break-words font-serif text-lg leading-[1.9] text-on-surface md:text-xl"
          style={{ overflowWrap: 'anywhere' }}
        >
          {content}
        </p>

        {/* Assinatura */}
        {(ownerName || ownerTitle) && (
          <div className="relative mt-12 flex flex-col items-end">
            {ownerName && (
              <p
                className="text-4xl leading-none text-primary md:text-5xl"
                style={{ fontFamily: '"Caveat", cursive' }}
              >
                {ownerName}
              </p>
            )}
            <svg
              aria-hidden
              width="132"
              height="12"
              viewBox="0 0 132 12"
              fill="none"
              className="mt-1 text-primary/35"
            >
              <path
                d="M2 7c22-6 46 5 66 1s41-6 62-2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            {ownerTitle && (
              <p className="mt-2 font-sans text-[11px] uppercase tracking-[0.18em] text-on-surface-variant/70">
                {ownerTitle}
              </p>
            )}
          </div>
        )}
      </article>
    </div>
  );
}
