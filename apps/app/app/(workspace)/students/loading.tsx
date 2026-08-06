import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import {
  HeaderSkeleton,
  StatCardsSkeleton,
  TableCardSkeleton,
} from "../components/loading-skeletons";

const Loading = () => (
  <>
    <HeaderSkeleton />
    <main className="grid gap-5 p-4 pt-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="grid gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_300px] 2xl:grid-cols-[1fr_360px]">
        <section className="grid content-start gap-5">
          <StatCardsSkeleton className="sm:grid-cols-2 xl:grid-cols-4" />
          <TableCardSkeleton columns={4} rows={6} toolbar />
        </section>

        <aside className="xl:sticky xl:top-4 xl:self-start">
          <div className="grid gap-3 rounded-lg border p-6">
            <div className="flex items-start justify-between gap-4">
              <Skeleton className="size-20 rounded-full" />
              <Skeleton className="size-8" />
            </div>
            <div className="grid gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </aside>
      </div>
    </main>
  </>
);

export default Loading;
