import { Skeleton } from "@/components/ui/skeleton";

/** Shown instantly while a student page streams in, shaped like the page to come. */
export default function StudentLoading() {
  return (
    <div className="space-y-10" role="status" aria-label="Loading">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-64 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-2 rounded-xl bg-surface p-5 ring-1 ring-line">
          <Skeleton className="mb-4 h-6 w-28" />
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 py-2">
              <Skeleton className="size-9 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
        <div className="space-y-4 rounded-xl bg-surface p-5 ring-1 ring-line">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2.5 w-full rounded-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
