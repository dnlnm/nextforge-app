import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import {
  HeaderSkeleton,
  StatCardsSkeleton,
} from "../components/loading-skeletons";

const WEEK_DAY_KEYS = ["wd-1", "wd-2", "wd-3", "wd-4", "wd-5", "wd-6", "wd-7"];
const SESSION_KEYS = ["session-1", "session-2", "session-3"];
const ROW_KEYS = ["row-1", "row-2", "row-3", "row-4"];
const STATUS_KEYS = [
  "status-1",
  "status-2",
  "status-3",
  "status-4",
  "status-5",
];

const Loading = () => (
  <>
    <HeaderSkeleton />
    <main className="grid gap-4 p-4 pt-0">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>

      <div className="flex items-center gap-2 overflow-hidden">
        <Skeleton className="h-4 w-16 shrink-0" />
        {WEEK_DAY_KEYS.map((key) => (
          <Skeleton className="h-16 w-14 shrink-0 rounded-xl" key={key} />
        ))}
      </div>

      <StatCardsSkeleton />
      <div className="grid items-start gap-4 xl:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border bg-card text-card-foreground">
          <div className="border-b bg-muted/20 p-4">
            <Skeleton className="h-3 w-28" />
          </div>
          {SESSION_KEYS.map((key) => (
            <div className="grid gap-2 border-b p-4 last:border-b-0" key={key}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-1.5 w-full" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border bg-card text-card-foreground">
          <div className="border-b bg-muted/20 p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-3 w-52" />
            <Skeleton className="mt-4 h-3 w-40" />
            <Skeleton className="mt-1.5 h-2 w-full" />
          </div>
          <div className="grid gap-0 p-4">
            {ROW_KEYS.map((key) => (
              <div
                className="grid grid-cols-[2rem_1fr_9rem] items-center gap-3 border-b py-3 last:border-b-0"
                key={key}
              >
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-4 w-40 max-w-full" />
                <div className="flex gap-1">
                  {STATUS_KEYS.map((statusKey) => (
                    <Skeleton
                      className="size-8 rounded-lg"
                      key={`${key}-${statusKey}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  </>
);

export default Loading;
