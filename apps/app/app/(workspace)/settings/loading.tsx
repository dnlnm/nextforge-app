import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { HeaderSkeleton } from "../components/loading-skeletons";

const Loading = () => (
  <>
    <HeaderSkeleton />
    <main className="grid gap-4 p-4 pt-0">
      <div className="max-w-3xl rounded-lg border bg-card text-card-foreground">
        <div className="grid gap-2 p-6 pb-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="grid gap-4 border-t p-6 pt-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div className="grid gap-2" key={index}>
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <div className="max-w-3xl rounded-lg border bg-card text-card-foreground">
        <div className="grid gap-2 p-6 pb-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="border-t p-6 pt-4">
          <Skeleton className="h-9 w-44" />
        </div>
      </div>
    </main>
  </>
);

export default Loading;
