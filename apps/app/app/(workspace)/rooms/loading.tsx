import { Skeleton } from "@repo/design-system/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="grid gap-5 p-4 pt-4">
      <Skeleton className="h-8 w-40" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
      </div>
    </main>
  );
}
