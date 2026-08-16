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
      <PageTitleSkeleton action />
      <StatCardsSkeleton />
      <TableCardSkeleton columns={8} rows={8} toolbar />
    </main>
  </>
);

export default Loading;
