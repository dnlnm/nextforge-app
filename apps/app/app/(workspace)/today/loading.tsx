import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { HeaderSkeleton } from "../components/loading-skeletons";

const Loading = () => (
  <>
    <HeaderSkeleton />
    <main className="grid gap-4 p-4 pt-0">
      <div className="rounded-lg border bg-card text-card-foreground">
        <div className="flex flex-wrap items-start justify-between gap-4 p-6 pb-4">
          <div className="grid gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid gap-4 border-t p-6 pt-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton className="h-9 w-full" key={index} />
          ))}
        </div>
      </div>

      {Array.from({ length: 2 }).map((_, index) => (
        <div
          className="rounded-lg border bg-card text-card-foreground"
          key={index}
        >
          <div className="grid gap-2 p-6 pb-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <div className="grid gap-3 border-t p-6 pt-4">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
            {Array.from({ length: 3 }).map((_, row) => (
              <Skeleton className="h-9 w-full" key={row} />
            ))}
          </div>
        </div>
      ))}
    </main>
  </>
);

export default Loading;
