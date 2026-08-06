import { Skeleton } from "@repo/design-system/components/ui/skeleton";

const HeaderSkeleton = () => (
  <header className="flex h-16 shrink-0 items-center justify-between gap-2">
    <div className="flex items-center gap-2 px-4">
      <Skeleton className="size-8" />
      <Skeleton className="h-4 w-px" />
      <Skeleton className="hidden h-4 w-20 md:block" />
      <Skeleton className="h-4 w-28" />
    </div>
    <div className="flex items-center gap-2 px-4">
      <Skeleton className="hidden size-8 md:block" />
      <Skeleton className="size-8" />
    </div>
  </header>
);

const PageTitleSkeleton = ({
  action = false,
}: {
  readonly action?: boolean;
}) => (
  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
    <div className="grid gap-2">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-4 w-64 max-w-full" />
    </div>
    {action && <Skeleton className="h-9 w-28" />}
  </div>
);

const StatCardsSkeleton = ({
  count = 4,
  className = "md:grid-cols-2 lg:grid-cols-4",
}: {
  readonly count?: number;
  readonly className?: string;
}) => (
  <section className={`grid gap-3 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <div className="grid gap-2 rounded-lg border p-4" key={index}>
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    ))}
  </section>
);

const FormCardSkeleton = ({ fields = 2 }: { readonly fields?: number }) => (
  <div className="rounded-lg border bg-card text-card-foreground">
    <div className="grid gap-2 p-6">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-4 w-56 max-w-full" />
    </div>
    <div className="grid gap-4 p-6 pt-0">
      {Array.from({ length: fields }).map((_, index) => (
        <div className="grid gap-2" key={index}>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
      <Skeleton className="h-9 w-32" />
    </div>
  </div>
);

const TableCardSkeleton = ({
  columns = 4,
  rows = 6,
  toolbar = false,
}: {
  readonly columns?: number;
  readonly rows?: number;
  readonly toolbar?: boolean;
}) => (
  <div className="rounded-lg border bg-card text-card-foreground">
    <div className="flex items-center justify-between gap-4 p-6 pb-4">
      <div className="grid gap-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48 max-w-full" />
      </div>
      <Skeleton className="h-9 w-24" />
    </div>
    {toolbar && (
      <div className="flex flex-wrap items-end gap-3 border-t p-4">
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-28" />
      </div>
    )}
    <div className="grid gap-0 border-t p-4 pt-0">
      <div className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-b py-3">
        <Skeleton className="size-10" />
        <div className="grid gap-2">
          <Skeleton className="h-4 w-48 max-w-full" />
          <Skeleton className="h-3 w-32 max-w-full" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      {Array.from({ length: rows }).map((_, index) => (
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
);

const ChartCardSkeleton = ({
  height = "h-[430px]",
}: {
  readonly height?: string;
}) => (
  <div
    className={`grid content-start gap-3 rounded-lg border bg-card p-6 text-card-foreground ${height}`}
  >
    <div className="flex items-center justify-between gap-4">
      <div className="grid gap-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-5 w-20" />
    </div>
    <div className="mt-2 grid gap-2">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-3 w-40" />
    </div>
    <Skeleton className="mt-auto h-48 w-full" />
  </div>
);

export {
  ChartCardSkeleton,
  FormCardSkeleton,
  HeaderSkeleton,
  PageTitleSkeleton,
  StatCardsSkeleton,
  TableCardSkeleton,
};
