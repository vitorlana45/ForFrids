import type { ReactNode } from 'react';
import UpgradePrompt from '@/components/ui/UpgradePrompt';

interface Props {
  children: ReactNode;
  feature: string;
  description: string;
  minHeight?: string;
}

export default function LockedFeaturePreview({
  children,
  feature,
  description,
  minHeight = 'min-h-[560px]',
}: Props) {
  return (
    <div className={`relative overflow-hidden rounded-3xl ${minHeight}`}>
      <div className="pointer-events-none select-none blur-[3px] opacity-55" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 bg-surface/45" />
      <div className="absolute inset-0 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <UpgradePrompt feature={feature} description={description} variant="overlay" />
        </div>
      </div>
    </div>
  );
}
