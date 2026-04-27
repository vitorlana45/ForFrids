import Image from 'next/image';

interface Props {
  fullName: string;
  avatarUrl: string | null;
  guardianTitle: string | null;
  bio: string | null;
}

export default function TutorSection({ fullName, avatarUrl, guardianTitle, bio }: Props) {
  return (
    <section className="py-24 border-t border-primary/10" id="tutor">
      <h2 className="font-serif text-4xl text-center text-primary mb-16">Sobre o Tutor</h2>

      <div className="max-w-xl mx-auto flex flex-col items-center text-center gap-6">
        <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-surface-container-lowest shadow-xl bg-surface-container-high flex items-center justify-center shrink-0">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={fullName} fill unoptimized className="object-cover" />
          ) : (
            <span className="font-serif text-4xl text-primary">
              {fullName.trim()[0]?.toUpperCase() ?? 'T'}
            </span>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="font-serif text-2xl text-on-surface">{fullName}</h3>
          {guardianTitle && (
            <p className="text-[11px] font-bold tracking-[0.2em] text-secondary uppercase">
              {guardianTitle}
            </p>
          )}
        </div>

        {bio && (
          <>
            <div className="h-px w-12 bg-secondary/30" />
            <p className="font-serif text-lg italic text-on-surface-variant leading-relaxed break-words" style={{ overflowWrap: 'anywhere' }}>
              "{bio}"
            </p>
          </>
        )}
      </div>
    </section>
  );
}
