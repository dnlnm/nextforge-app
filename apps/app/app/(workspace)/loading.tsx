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

      <StatCardsSkeleton className="lg:grid-cols-3 2xl:grid-cols-5" count={5} />

      <section className="grid gap-5 xl:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </section>
    </main>
  </>
);

export default Loading;
