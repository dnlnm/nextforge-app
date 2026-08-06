import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import {
  HeaderSkeleton,
  TableCardSkeleton,
} from "../components/loading-skeletons";

const Loading = () => (
  <>
    <HeaderSkeleton />
    <main className="grid gap-4 p-4 pt-0">
      <div className="rounded-lg border bg-card text-card-foreground">
        <div className="grid gap-2 p-6 pb-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
        <div className="flex flex-wrap gap-2 border-t p-6 pt-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton className="h-9 w-32" key={index} />
          ))}
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="grid gap-3 rounded-lg border p-6" key={index}>
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-40 max-w-full" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <TableCardSkeleton columns={4} rows={4} />
        <TableCardSkeleton columns={2} rows={4} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <TableCardSkeleton columns={3} rows={4} />
        <TableCardSkeleton columns={4} rows={4} />
      </section>
    </main>
  </>
);

export default Loading;
