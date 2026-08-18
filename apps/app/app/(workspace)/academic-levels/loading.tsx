import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { HeaderSkeleton } from "../components/loading-skeletons";

const TAB_IDS = ["tab-primary", "tab-secondary", "tab-pre-u", "tab-general"];
const ROW_IDS = ["row-1", "row-2", "row-3", "row-4", "row-5"];

const Loading = () => (
  <>
    <HeaderSkeleton />
    <main className="grid gap-5 p-4 pt-4 sm:p-6 sm:pt-4">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="grid gap-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="flex gap-0.5 overflow-x-auto rounded-lg bg-muted p-0.5 lg:w-72 lg:flex-none lg:flex-col lg:overflow-hidden">
          {TAB_IDS.map((id) => (
            <div
              className="flex w-full min-w-56 flex-none items-center gap-3 rounded-md px-3 py-2 lg:min-w-0"
              key={id}
            >
              <Skeleton className="size-10 rounded-full" />
              <div className="grid gap-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border bg-card text-card-foreground">
          <div className="flex items-center justify-between gap-4 border-b bg-muted/30 px-5 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="grid gap-1.5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="ml-1 hidden h-5 w-24 rounded-full sm:block" />
            </div>
            <Skeleton className="size-8" />
          </div>

          <div className="grid overflow-hidden">
            <div className="grid grid-cols-[1fr_4rem_5rem_5rem_5rem_3rem] items-center gap-4 border-b bg-muted/50 px-5 py-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-8 justify-self-end" />
            </div>
            {ROW_IDS.map((id) => (
              <div
                className="grid grid-cols-[1fr_4rem_5rem_5rem_5rem_3rem] items-center gap-4 border-b px-5 py-3 last:border-b-0"
                key={id}
              >
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-14" />
                <Skeleton className="size-6 justify-self-end" />
              </div>
            ))}
          </div>

          <div className="flex justify-center border-t px-5 py-3">
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </div>
    </main>
  </>
);

export default Loading;
