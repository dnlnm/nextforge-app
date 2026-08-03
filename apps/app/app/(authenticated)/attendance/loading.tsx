import {
  FormCardSkeleton,
  HeaderSkeleton,
  TableCardSkeleton,
} from "../components/loading-skeletons";

const Loading = () => (
  <>
    <HeaderSkeleton />
    <main className="grid items-start gap-4 p-4 pt-0 xl:grid-cols-[360px_1fr]">
      <FormCardSkeleton fields={2} />
      <TableCardSkeleton columns={5} rows={6} />
    </main>
  </>
);

export default Loading;
