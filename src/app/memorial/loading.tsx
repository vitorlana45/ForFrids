import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">

      {/* Header */}
      <header className="bg-surface/85 backdrop-blur-md border-b border-outline-variant/20 sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-[1200px] mx-auto">
          <Skeleton className="h-7 w-28" />
          <div className="hidden md:flex gap-8">
            {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-4 w-16" />)}
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6">

        {/* Hero */}
        <section className="py-32 flex flex-col items-center text-center">
          <Skeleton className="w-64 h-64 md:w-80 md:h-80 rounded-full mb-8" />
          <Skeleton className="h-14 w-64 mb-4" />
          <Skeleton className="h-6 w-32 mb-6" />
          <Skeleton className="h-8 w-96 max-w-full" />
        </section>

        {/* Timeline placeholder */}
        <section className="py-16 border-t border-primary/10">
          <Skeleton className="h-10 w-56 mx-auto mb-16" />
          <div className="max-w-3xl mx-auto space-y-8">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex gap-8 items-start">
                <Skeleton className="w-48 h-4 hidden md:block mt-6" />
                <Skeleton className="w-4 h-4 rounded-full shrink-0 mt-5" />
                <div className="flex-1 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 space-y-3">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Gallery placeholder */}
        <section className="py-16">
          <Skeleton className="h-10 w-48 mx-auto mb-16" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
              <Skeleton key={i} className={`rounded-xl ${i % 2 === 0 ? 'aspect-[3/4]' : 'aspect-square'}`} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
