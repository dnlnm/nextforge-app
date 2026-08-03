import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { HeaderSkeleton } from "../components/loading-skeletons";

const Loading = () => (
  <>
    <HeaderSkeleton />
    <main className="grid gap-5 p-4 pt-4">
      <div className="inline-flex h-9 w-fit items-center gap-1 rounded-lg bg-muted p-[3px]">
        <Skeleton className="h-7 w-20 rounded-md" />
        <Skeleton className="h-7 w-16 rounded-md" />
        <Skeleton className="h-7 w-16 rounded-md" />
      </div>

      <div className="rounded-lg border-2 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div
              className="grid gap-3 rounded-lg border p-4"
              key={`stat-${index}`}
            >
              <div className="flex items-center gap-2">
                <Skeleton className="size-8 rounded-md" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-44" />
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
        </div>
        <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <div className="grid gap-2" key={`usage-${index}`}>
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
