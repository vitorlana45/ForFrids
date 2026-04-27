import { Skeleton } from '@/components/ui/skeleton';

function PetCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-card">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="px-5 pb-4 pt-4 space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="flex border-t border-outline-variant/10 px-5 py-3 gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 pb-24 md:pb-12">

      {/* Welcome */}
      <header className="mb-16 space-y-3">
        <Skeleton className="h-12 w-56" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left column */}
        <div className="lg:col-span-8 space-y-16">

          {/* Quick Actions */}
          <section>
            <Skeleton className="h-8 w-40 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map(i => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          </section>

          {/* Pet Cards */}
          <section>
            <div className="flex justify-between items-end mb-6">
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <PetCardSkeleton />
              <PetCardSkeleton />
            </div>
          </section>
        </div>

        {/* Right sidebar */}
        <aside className="lg:col-span-4 space-y-8">

          {/* Upcoming Dates */}
          <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/20 space-y-6">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-6 w-36" />
            </div>
            {[0, 1].map(i => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>

          {/* Progress */}
          <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/20 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
