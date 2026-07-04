import Link from 'next/link';
import { Sparkles } from 'lucide-react';

interface Props {
  feature: string;
  description?: string;
  variant?: 'standalone' | 'overlay';
}

export default function UpgradePrompt({ feature, description, variant = 'standalone' }: Props) {
  const isOverlay = variant === 'overlay';

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        isOverlay
          ? 'rounded-3xl border border-outline-variant/20 bg-surface/95 px-7 py-9 shadow-2xl backdrop-blur-md'
          : 'rounded-3xl border border-dashed border-primary/30 bg-primary-fixed/30 px-8 py-20'
      }`}
    >
      <span
        className={`mb-5 flex items-center justify-center rounded-2xl bg-primary-fixed text-primary ${
          isOverlay ? 'h-14 w-14' : 'h-16 w-16'
        }`}
      >
        <Sparkles className={isOverlay ? 'h-7 w-7' : 'h-8 w-8'} />
      </span>
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-secondary">
        Recurso Premium
      </p>
      <h2 className={`font-serif text-on-surface ${isOverlay ? 'text-2xl' : 'text-3xl'}`}>
        {feature}
      </h2>
      <p className="mx-auto mt-3 max-w-sm text-on-surface-variant">
        {description ?? `${feature} está disponível no plano Premium.`}
      </p>
      <Link
        href="/dashboard/planos"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim"
      >
        <Sparkles className="h-4 w-4" />
        Ver planos
      </Link>
    </div>
  );
}
