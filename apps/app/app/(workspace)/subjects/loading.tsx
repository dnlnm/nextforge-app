import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import {
  HeaderSkeleton,
  PageTitleSkeleton,
} from "../components/loading-skeletons";

const listRow = "flex items-center gap-4 border-b py-3 last:border-b-0";

const SKELETON_ROWS = Array.from({ length: 6 }, (_, index) => `row-${index}`);

const Loading = () => (
  <>
    <HeaderSkeleton />
    <main className="grid gap-5 p-4 pt-4">
      <PageTitleSkeleton action />

      <div className="rounded-lg border bg-card text-card-foreground">
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="grid gap-0 px-4">
          {SKELETON_ROWS.map((row) => (
            <div className={listRow} key={row}>
              <Skeleton className="size-9 shrink-0 rounded-md" />
              <div className="grid min-w-0 flex-1 gap-2">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-3 w-32 max-w-full" />
              </div>
              <Skeleton className="h-4 w-24 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </main>
  </>
);

export default Loading;
