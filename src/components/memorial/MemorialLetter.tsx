import { getLetterHeading } from '@/lib/memorial/letter';

interface Props {
  content: string;
  petName: string;
  ownerName: string | null;
  updatedAt: string | null;
  isDeceased: boolean;
}

export default function MemorialLetter({ content, petName, ownerName, updatedAt, isDeceased }: Props) {
  const heading = getLetterHeading(petName, isDeceased);
  const dateLabel = updatedAt
    ? new Date(updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="relative overflow-hidden rounded-[2rem] border border-secondary/15 bg-surface-container-lowest p-10 shadow-memorial md:p-14">
        <span className="material-symbols-outlined pointer-events-none absolute -right-6 -top-6 select-none text-[140px] text-primary/5">
          mail
        </span>
        <p className="relative mb-6 text-center font-serif text-3xl italic text-primary">{heading}</p>
        <p
          className="relative whitespace-pre-line break-words font-serif text-lg leading-8 text-on-surface-variant"
          style={{ overflowWrap: 'anywhere' }}
        >
          {content}
        </p>
        {(ownerName || dateLabel) && (
          <div className="relative mt-8 text-right">
            {ownerName && <p className="font-serif text-xl italic text-on-surface">{ownerName}</p>}
            {dateLabel && (
              <p className="mt-1 text-xs uppercase tracking-widest text-on-surface-variant/70">{dateLabel}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
