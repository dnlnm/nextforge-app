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

const FormCardSkeleton = ({ fields = 3 }: { readonly fields?: number }) => {
  const inputs = Array.from({ length: fields }, (_, index) => ({
    id: `field-${index}`,
  }));

  return (
    <PreviewCard
      header={
        <span className="flex items-center gap-2.5">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-4 w-36" />
        </span>
      }
      stageClassName="min-h-0 flex-1 flex-col justify-start gap-4 p-4 sm:p-5"
    >
      <div className="grid gap-4">
        {inputs.map((input) => (
          <div className="grid gap-1.5" key={input.id}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </PreviewCard>
  );
};

const TableCardSkeleton = ({
  columns = 4,
  rows = 6,
  toolbar = false,
}: {
  readonly columns?: number;
  readonly rows?: number;
  readonly toolbar?: boolean;
}) => {
  const cols = Array.from({ length: columns }, (_, index) => ({
    id: `col-${index}`,
  }));
  const skeletonRows = Array.from({ length: rows }, (_, index) => ({
    id: `row-${index}`,
  }));

  return (
    <PreviewCard
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-7 w-16 rounded-md" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-[84px] rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      }
      header={
        toolbar ? (
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <Skeleton className="h-9 w-full max-w-sm rounded-lg" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        ) : undefined
      }
      stageClassName="flex-col p-0"
    >
      {/* Desktop table */}
      <div className="hidden w-full md:block">
        <div className="flex gap-3 border-b px-2.5 py-3">
          {cols.map((col) => (
            <Skeleton className="h-4 flex-1" key={col.id} />
          ))}
        </div>
        {skeletonRows.map((row) => (
          <div
            className="flex items-center gap-3 border-b px-2.5 py-4 last:border-b-0"
            key={row.id}
          >
            {cols.map((col) => (
              <Skeleton className="h-5 flex-1" key={col.id} />
            ))}
          </div>
        ))}
      </div>
      {/* Mobile cards */}
      <div className="grid gap-0 px-4 md:hidden">
        {skeletonRows.slice(0, Math.min(rows, 4)).map((row) => (
          <div
            className="flex items-center gap-4 border-b py-3 last:border-b-0"
            key={row.id}
          >
            <Skeleton className="size-10 rounded-full" />
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </PreviewCard>
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
