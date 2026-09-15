import { Skeleton } from "@/components/ui/skeleton";

export default function ParentChildLoading() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading">
      <div className="flex items-center gap-5">
        <Skeleton className="size-16 rounded-full sm:size-20" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-64 max-w-full" />
          <Skeleton className="h-5 w-full max-w-md" />
        </div>
      </div>
      <Skeleton className="hidden h-11 w-80 rounded-full sm:block" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}
