import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import {
  FormCardSkeleton,
  HeaderSkeleton,
} from "../../components/loading-skeletons";

const Loading = () => (
  <>
    <HeaderSkeleton />
    <main className="mx-auto grid w-full max-w-6xl gap-5 p-4 pt-4">
      <div className="grid gap-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_300px] 2xl:grid-cols-[1fr_360px]">
        <section className="grid content-start gap-5">
          <FormCardSkeleton fields={3} />
          <FormCardSkeleton fields={3} />
          <FormCardSkeleton fields={3} />
          <div className="grid gap-2 rounded-xl border border-border bg-card p-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
        </section>

        <aside className="order-2 grid content-start gap-4 xl:sticky xl:top-4 xl:col-start-2 xl:row-start-1 xl:self-start">
          <div className="grid gap-3 rounded-xl border border-border bg-card p-6">
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

        <div className="order-3 flex flex-col gap-3 sm:flex-row xl:col-start-1 xl:row-start-2">
          <Skeleton className="h-11 flex-1" />
          <Skeleton className="h-11 w-28" />
        </div>
      </div>
    </main>
  </>
);

export default Loading;
