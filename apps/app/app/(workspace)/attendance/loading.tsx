import { Card, CardContent } from "@repo/design-system/components/ui/card";
import { CardShell } from "@repo/design-system/components/ui/card-shell";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import {
  HeaderSkeleton,
  StatCardsSkeleton,
} from "../components/loading-skeletons";

const WEEK_DAY_KEYS = ["wd-1", "wd-2", "wd-3", "wd-4", "wd-5", "wd-6", "wd-7"];
const SESSION_KEYS = ["session-1", "session-2", "session-3"];
const ROW_KEYS = ["row-1", "row-2", "row-3", "row-4", "row-5"];

const Loading = () => (
  <>
    <HeaderSkeleton />
    <main className="mx-auto grid w-full max-w-6xl gap-5 p-4 pt-4 [scrollbar-gutter:stable]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-44 rounded-lg" />
      </div>

      {/* Week rail */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-2.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="hidden h-3 w-40 sm:block" />
        </div>
        <div className="flex gap-2 p-3">
          {WEEK_DAY_KEYS.map((key) => (
            <Skeleton
              className="h-[84px] min-w-[66px] flex-1 rounded-xl"
              key={key}
            />
          ))}
        </div>
      </Card>

      <StatCardsSkeleton count={4} />

      <div className="grid items-start gap-4 xl:grid-cols-[340px_1fr]">
        <CardShell className="overflow-hidden">
          <div className="border-b bg-muted/20 px-4 py-3">
            <Skeleton className="h-3 w-28" />
          </div>
          {SESSION_KEYS.map((key) => (
            <div className="grid gap-2 border-b p-4 last:border-b-0" key={key}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-1.5 w-full" />
            </div>
          ))}
        </CardShell>

        {/* Ledger sheet */}
        <Card className="overflow-hidden pl-[14px]">
          <div className="absolute inset-y-0 left-0 w-[14px] border-r border-dashed bg-muted/30" />
          <div className="border-b bg-muted/20 p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-6 w-64" />
            <Skeleton className="mt-4 h-3 w-56" />
            <Skeleton className="mt-1.5 h-2 w-full" />
          </div>
          <div className="flex items-center gap-2 border-b bg-muted/10 px-4 py-2.5">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="ml-auto h-8 w-36" />
          </div>
          <CardContent className="p-0">
            <div className="ml-[3px] grid gap-0">
              {ROW_KEYS.map((key) => (
                <div
                  className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
                  key={key}
                >
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <Skeleton className="h-4 w-40 max-w-full flex-1" />
                  <div className="flex gap-1">
                    <Skeleton className="size-8 rounded-lg" />
                    <Skeleton className="size-8 rounded-lg" />
                    <Skeleton className="size-8 rounded-lg" />
                    <Skeleton className="size-8 rounded-lg" />
                    <Skeleton className="size-8 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  </>
);

export default Loading;
