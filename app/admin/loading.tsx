import { Skeleton } from "@/components/ui/skeleton";

/** Shared by every admin page: a page header, a filter strip, and a panel. */
export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-14 rounded-xl" />
      <div className="space-y-2 rounded-xl bg-surface p-5 ring-1 ring-line">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex items-center gap-3 py-2">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
