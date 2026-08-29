import { CardShell } from "@repo/design-system/components/ui/card-shell";
import { PreviewCard } from "@repo/design-system/components/preview-card";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { cn } from "@repo/design-system/lib/utils";

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
}) => {
  const cards = Array.from({ length: count }, (_, index) => ({
    id: `stat-${index}`,
  }));

  return (
    <section className={`grid gap-3 ${className}`}>
      {cards.map((card) => (
        <PreviewCard
          className="flex h-full flex-col"
          key={card.id}
          label={<Skeleton className="h-3 w-24" />}
          footer={
            <div className="relative z-10">
              <Skeleton className="size-8" />
            </div>
          }
          stageClassName="flex-col items-start justify-center gap-4 p-6 sm:p-6"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-7 w-24" />
        </PreviewCard>
      ))}
    </section>
  );
};

const FormCardSkeleton = ({ fields = 2 }: { readonly fields?: number }) => {
  const inputs = Array.from({ length: fields }, (_, index) => ({
    id: `field-${index}`,
  }));

  return (
    <CardShell>
      <div className="grid gap-2 p-6">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-56 max-w-full" />
      </div>
      <div className="grid gap-4 p-6 pt-0">
        {inputs.map((input) => (
          <div className="grid gap-2" key={input.id}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <Skeleton className="h-9 w-32" />
      </div>
    </CardShell>
  );
};

const TableCardSkeleton = ({
  columns: _columns = 4,
  rows = 6,
  toolbar = false,
}: {
  readonly columns?: number;
  readonly rows?: number;
  readonly toolbar?: boolean;
}) => {
  const skeletonRows = Array.from({ length: rows }, (_, index) => ({
    id: `row-${index}`,
  }));

  return (
    <CardShell>
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
        {skeletonRows.map((row) => (
          <div
            className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-b py-3 last:border-b-0"
            key={row.id}
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
    </CardShell>
  );
};

const ChartCardSkeleton = ({
  height = "h-[clamp(20rem,42dvh,30rem)]",
}: {
  readonly height?: string;
}) => (
  <PreviewCard
    className={cn("flex h-full flex-col", height)}
    header={
      <>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-16" />
      </>
    }
    stageClassName="min-h-0 flex-1 flex-col justify-start gap-3 p-4 sm:p-4"
  >
    <div className="grid gap-2">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-3 w-40" />
    </div>
    <Skeleton className="mt-auto h-48 w-full" />
  </PreviewCard>
);

export {
  ChartCardSkeleton,
  FormCardSkeleton,
  HeaderSkeleton,
  PageTitleSkeleton,
  StatCardsSkeleton,
  TableCardSkeleton,
};
