import {
  ChartCardSkeleton,
  HeaderSkeleton,
  PageTitleSkeleton,
  StatCardsSkeleton,
} from "./components/loading-skeletons";

const Loading = () => (
  <>
    <HeaderSkeleton />
    <main className="grid gap-5 p-4 pt-4">
      <PageTitleSkeleton action />

      <section className="flex flex-wrap items-center gap-2">
        {[110, 132, 154, 176].map((width) => (
          <div
            className="h-8 rounded-md bg-muted/60"
            key={width}
            style={{ width: `${width}px` }}
          />
        ))}
      </section>

      <StatCardsSkeleton className="lg:grid-cols-3 2xl:grid-cols-5" count={5} />

      <section className="grid items-start gap-5 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <ChartCardSkeleton />
        </div>
        <div className="xl:col-span-5">
          <ChartCardSkeleton />
        </div>
        <div className="xl:col-span-7">
          <ChartCardSkeleton />
        </div>
        <div className="xl:col-span-5">
          <ChartCardSkeleton />
        </div>
        <div className="xl:col-span-7">
          <ChartCardSkeleton height="h-auto" />
        </div>
        <div className="xl:col-span-5">
          <ChartCardSkeleton height="h-auto" />
        </div>
      </section>
    </main>
  </>
);

export default Loading;
