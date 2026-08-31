import { PreviewCard } from "@repo/design-system/components/preview-card";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { FormCardSkeleton, HeaderSkeleton } from "../../components/loading-skeletons";

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
          <FormCardSkeleton fields={4} />
          <FormCardSkeleton fields={3} />
        </section>

        <aside className="order-2 grid content-start gap-4 xl:sticky xl:top-4 xl:col-start-2 xl:row-start-1 xl:self-start">
          <PreviewCard stageClassName="p-4">
            <Skeleton className="h-3 w-24" />
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 rounded-full" />
              <div className="grid gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </PreviewCard>
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
