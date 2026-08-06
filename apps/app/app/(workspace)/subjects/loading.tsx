import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import {
  FormCardSkeleton,
  HeaderSkeleton,
  PageTitleSkeleton,
} from "../components/loading-skeletons";

const Loading = () => (
  <>
    <HeaderSkeleton />
    <main className="grid gap-5 p-4 pt-4">
      <PageTitleSkeleton action />

      <div className="grid items-start gap-5 lg:grid-cols-[360px_1fr]">
        <FormCardSkeleton fields={2} />

        <div className="grid items-start gap-5 xl:grid-cols-[1fr_300px]">
          <div className="rounded-lg border bg-card text-card-foreground">
            <div className="flex items-center justify-between gap-4 p-6 pb-4">
              <div className="grid gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48 max-w-full" />
              </div>
            </div>
            <div className="grid gap-0 border-t p-4 pt-0">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-b py-3 last:border-b-0"
                  key={index}
                >
                  <Skeleton className="size-10" />
                  <div className="grid gap-2">
                    <Skeleton className="h-4 w-48 max-w-full" />
                    <Skeleton className="h-3 w-32 max-w-full" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          </div>

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
      </div>
    </main>
  </>
);

export default Loading;
