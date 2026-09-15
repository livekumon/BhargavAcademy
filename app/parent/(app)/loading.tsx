import { Skeleton } from "@/components/ui/skeleton";

export default function ParentLoading() {
  return (
    <div className="space-y-10" role="status" aria-label="Loading">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((key) => (
          <Skeleton key={key} className="h-64 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </div>
  );
}
