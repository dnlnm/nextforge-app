import {
  HeaderSkeleton,
  PageTitleSkeleton,
  StatCardsSkeleton,
  TableCardSkeleton,
} from "../components/loading-skeletons";

const Loading = () => (
  <>
    <HeaderSkeleton />
    <main className="grid gap-5 p-4 pt-4">
      <PageTitleSkeleton />

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_320px] 2xl:grid-cols-[1fr_380px]">
        <section className="grid content-start gap-5">
          <StatCardsSkeleton className="md:grid-cols-2 2xl:grid-cols-4" />
          <TableCardSkeleton columns={8} rows={6} toolbar />
        </section>
      </div>
    </main>
  </>
);

export default Loading;
