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
      <PageTitleSkeleton />

      <StatCardsSkeleton
        className="md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
        count={5}
      />

      <section className="grid items-start gap-5 2xl:grid-cols-[1.15fr_1fr_0.95fr]">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-[1.1fr_0.95fr_0.9fr]">
        <ChartCardSkeleton height="h-auto" />
        <ChartCardSkeleton height="h-auto" />
        <ChartCardSkeleton height="h-auto" />
      </section>
    </main>
  </>
);

export default Loading;
