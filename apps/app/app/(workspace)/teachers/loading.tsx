import { CardShell } from "@repo/design-system/components/ui/card-shell";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import {
  HeaderSkeleton,
  StatCardsSkeleton,
  TableCardSkeleton,
} from "../components/loading-skeletons";

const PendingInvitationsSkeleton = () => (
  <CardShell>
    <div className="flex items-center gap-3 p-6 pb-2">
      <Skeleton className="size-5 rounded-md" />
      <Skeleton className="h-5 w-40" />
    </div>
    <div className="p-6 pt-2">
      <div className="grid gap-0">
        {[0, 1].map((row) => (
          <div
            className="flex items-center justify-between gap-4 border-b py-3 last:border-b-0"
            key={row}
          >
            <div className="grid min-w-0 gap-2">
              <Skeleton className="h-4 w-40 max-w-full" />
              <Skeleton className="h-3 w-56 max-w-full" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  </CardShell>
);

const Loading = () => (
  <>
    <HeaderSkeleton />
    <main className="mx-auto grid w-full max-w-6xl gap-5 p-4 pt-4 [scrollbar-gutter:stable]">
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

      <PendingInvitationsSkeleton />

      <div className="grid content-start gap-5">
        <StatCardsSkeleton className="grid-cols-2 xl:grid-cols-4" />
        <TableCardSkeleton columns={8} rows={6} toolbar />
      </div>
    </main>
  </>
);

export default Loading;
