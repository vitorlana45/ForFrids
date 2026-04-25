import Link from 'next/link';
import { Sparkles } from 'lucide-react';

interface Props {
  feature: string;
  description?: string;
}

export default function UpgradePrompt({ feature, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-primary/30 bg-primary-fixed/30 px-8 py-20 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
        <Sparkles className="h-8 w-8" />
      </span>
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-secondary">
        Recurso Premium
      </p>
      <h2 className="font-serif text-3xl text-on-surface">{feature}</h2>
      <p className="mx-auto mt-3 max-w-sm text-on-surface-variant">
        {description ?? `${feature} está disponível nos planos Premium e Eterno.`}
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
