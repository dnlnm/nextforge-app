import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import {
  HeaderSkeleton,
  PageTitleSkeleton,
} from "../components/loading-skeletons";

const Loading = () => (
  <>
    <HeaderSkeleton />
    <main className="grid gap-5 p-4 pt-4">
      <PageTitleSkeleton action />

      <div className="rounded-lg border bg-card text-card-foreground">
        <div className="flex items-center justify-between gap-4 p-6 pb-4">
          <div className="grid gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
        </div>
        <div className="grid gap-4 border-t p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex gap-1 rounded-lg bg-muted p-[3px]">
              <Skeleton className="h-7 w-16 rounded-md" />
              <Skeleton className="h-7 w-20 rounded-md" />
              <Skeleton className="h-7 w-28 rounded-md" />
              <Skeleton className="h-7 w-28 rounded-md" />
            </div>
            <div className="relative md:ml-auto md:min-w-56">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>

          <div className="grid gap-0 border-t pt-0">
            <div className="grid grid-cols-[1fr_5rem_5rem_3rem] items-center gap-4 border-b py-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-6" />
            </div>
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                className="grid grid-cols-[1fr_5rem_5rem_3rem] items-center gap-4 border-b py-3 last:border-b-0"
                key={index}
              >
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-6 w-6" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  </>
);

export default Loading;
