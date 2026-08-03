import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { HeaderSkeleton } from "../components/loading-skeletons";

const Loading = () => (
  <>
    <HeaderSkeleton />
    <main className="mx-auto max-w-7xl space-y-8 p-6 pt-0">
      <div className="rounded-lg border-2 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="grid gap-2" key={index}>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="grid gap-2" key={index}>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </main>
  </>
);

export default Loading;
