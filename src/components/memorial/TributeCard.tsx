import type { Tribute } from '@/types/database';

const AVATAR_COLORS = [
  'bg-secondary-container text-secondary',
  'bg-primary-fixed text-primary',
  'bg-tertiary-fixed text-on-tertiary-fixed',
  'bg-surface-container-highest text-on-surface',
];

interface Props {
  tribute: Tribute;
  index: number;
}

export default function TributeCard({ tribute, index }: Props) {
  const colorClass = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initial = tribute.author_name.charAt(0).toUpperCase();

  return (
    <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-primary-container/10 flex flex-col relative">
      <span className="material-symbols-outlined text-primary/20 absolute top-4 right-4 text-4xl select-none">
        format_quote
      </span>
      <p
        className="font-serif italic text-on-surface mb-6 flex-grow leading-relaxed break-words"
        style={{ overflowWrap: 'anywhere' }}
      >
        “{tribute.message}”
      </p>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${colorClass} rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0`}>
          {initial}
        </div>
        <div>
          <p
            className="font-semibold text-on-surface text-xs uppercase tracking-wider break-words"
            style={{ overflowWrap: 'anywhere' }}
          >
            {tribute.author_name}
          </p>
          {tribute.author_relation && (
            <p className="text-[10px] text-tertiary capitalize">{tribute.author_relation}</p>
          )}
        </div>
      </div>
    </div>
  );
}
