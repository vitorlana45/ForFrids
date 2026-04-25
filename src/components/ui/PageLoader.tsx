import { PawLoader } from '@/components/ui/OperationLoader';

export default function PageLoader() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-6">
      <PawLoader />
      <p className="font-serif text-sm text-on-surface-variant tracking-widest animate-pulse">
        Eterno Pet
      </p>
    </div>
  );
}
