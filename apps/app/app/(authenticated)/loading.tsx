import {
  Card,
  CardContent,
  CardHeader,
} from "@repo/design-system/components/ui/card";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";

const Loading = () => (
  <>
    <header className="flex h-16 shrink-0 items-center justify-between gap-2">
      <div className="flex items-center gap-2 px-4">
        <Skeleton className="size-8" />
        <Skeleton className="h-4 w-px" />
        <Skeleton className="hidden h-4 w-20 md:block" />
        <Skeleton className="h-4 w-28" />
      </div>
    </header>
    <main className="grid gap-5 p-4 pt-0 lg:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </CardHeader>
        <CardContent className="grid gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="grid gap-2" key={index.toString()}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="grid gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
          <Skeleton className="h-9 w-24" />
        </CardHeader>
        <CardContent className="grid gap-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-b py-3 last:border-b-0"
              key={index.toString()}
            >
              <Skeleton className="size-10" />
              <div className="grid gap-2">
                <Skeleton className="h-4 w-48 max-w-full" />
                <Skeleton className="h-3 w-32 max-w-full" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  </>
);

export default Loading;
