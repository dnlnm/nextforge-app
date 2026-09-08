import { FluidPanel } from "@repo/design-system/components/fluid-panel";
import { HeaderSkeleton } from "../../components/loading-skeletons";

const Loading = () => (
  <>
    <HeaderSkeleton />
    <main className="mx-auto grid w-full max-w-6xl gap-5 p-4 pt-4">
      <div className="grid gap-2">
        <div aria-hidden="true" className="animate-pulse bg-muted h-7 w-40" />
        <div aria-hidden="true" className="animate-pulse bg-muted h-4 w-72 max-w-full" />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_300px] 2xl:grid-cols-[1fr_360px]">
        <section className="grid content-start gap-5 xl:col-start-1 xl:row-start-1">
          {/* Student Information — mirrors PhotoUploadTile + 2-col + 3-col + 2-col + textarea */}
          <FluidPanel
            header={
              <span className="flex items-center gap-2.5">
                <div aria-hidden="true" className="animate-pulse bg-muted size-8 rounded-lg" />
                <div aria-hidden="true" className="animate-pulse bg-muted h-4 w-36" />
              </span>
            }
            stageClassName="min-h-0 flex-1 flex-col justify-start gap-4 p-4 sm:p-5"
          >
            <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-56" />
            <div className="flex items-start gap-5">
              <div aria-hidden="true" className="animate-pulse bg-muted size-20 shrink-0 rounded-full" />
              <div className="grid flex-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-20" />
                  <div aria-hidden="true" className="animate-pulse bg-muted h-9 w-full rounded-lg" />
                </div>
                <div className="grid gap-1.5">
                  <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-28" />
                  <div aria-hidden="true" className="animate-pulse bg-muted h-9 w-full rounded-lg" />
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-24" />
                <div aria-hidden="true" className="animate-pulse bg-muted h-9 w-full rounded-lg" />
              </div>
              <div className="grid gap-1.5">
                <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-20" />
                <div aria-hidden="true" className="animate-pulse bg-muted h-9 w-full rounded-lg" />
              </div>
              <div className="grid gap-1.5">
                <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-16" />
                <div aria-hidden="true" className="animate-pulse bg-muted h-9 w-full rounded-lg" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-24" />
                <div aria-hidden="true" className="animate-pulse bg-muted h-9 w-full rounded-lg" />
              </div>
              <div className="grid gap-1.5">
                <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-24" />
                <div aria-hidden="true" className="animate-pulse bg-muted h-9 w-full rounded-lg" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-16" />
              <div aria-hidden="true" className="animate-pulse bg-muted h-[68px] w-full rounded-lg" />
            </div>
          </FluidPanel>

          {/* Parent / Guardian */}
          <FluidPanel
            header={
              <span className="flex items-center gap-2.5">
                <div aria-hidden="true" className="animate-pulse bg-muted size-8 rounded-lg" />
                <div aria-hidden="true" className="animate-pulse bg-muted h-4 w-32" />
              </span>
            }
            stageClassName="min-h-0 flex-1 flex-col justify-start gap-4 p-4 sm:p-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-20" />
                <div aria-hidden="true" className="animate-pulse bg-muted h-9 w-full rounded-lg" />
              </div>
              <div className="grid gap-1.5">
                <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-24" />
                <div aria-hidden="true" className="animate-pulse bg-muted h-9 w-full rounded-lg" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-28" />
                <div aria-hidden="true" className="animate-pulse bg-muted h-9 w-full rounded-lg" />
              </div>
              <div className="grid gap-1.5">
                <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-20" />
                <div aria-hidden="true" className="animate-pulse bg-muted h-9 w-full rounded-lg" />
              </div>
            </div>
          </FluidPanel>

          {/* School & Enrollment — tabs + stage/level/school */}
          <FluidPanel
            header={
              <span className="flex items-center gap-2.5">
                <div aria-hidden="true" className="animate-pulse bg-muted size-8 rounded-lg" />
                <span className="grid gap-1">
                  <div aria-hidden="true" className="animate-pulse bg-muted h-4 w-36" />
                  <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-56 max-w-full" />
                </span>
              </span>
            }
            stageClassName="min-h-0 flex-1 flex-col justify-start gap-4 p-4 sm:p-5"
          >
            <div className="flex gap-2 border-b pb-2">
              <div aria-hidden="true" className="animate-pulse bg-muted h-7 w-28 rounded-full" />
              <div aria-hidden="true" className="animate-pulse bg-muted h-7 w-28 rounded-full" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-12" />
                <div aria-hidden="true" className="animate-pulse bg-muted h-9 w-full rounded-lg" />
              </div>
              <div className="grid gap-1.5">
                <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-12" />
                <div aria-hidden="true" className="animate-pulse bg-muted h-9 w-full rounded-lg" />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-24" />
                <div aria-hidden="true" className="animate-pulse bg-muted h-9 w-full rounded-lg" />
              </div>
            </div>
          </FluidPanel>

          {/* Additional Information — collapsible */}
          <FluidPanel
            header={
              <div className="flex w-full items-center justify-between gap-4">
                <span className="flex items-center gap-3">
                  <div aria-hidden="true" className="animate-pulse bg-muted size-8 rounded-lg" />
                  <span className="grid gap-1">
                    <div aria-hidden="true" className="animate-pulse bg-muted h-4 w-40" />
                    <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-56 max-w-full" />
                  </span>
                </span>
                <div aria-hidden="true" className="animate-pulse bg-muted size-8 rounded-md" />
              </div>
            }
            stageClassName="min-h-0 flex-1 flex-col justify-start gap-4 p-4 sm:p-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-32" />
                <div aria-hidden="true" className="animate-pulse bg-muted h-9 w-full rounded-lg" />
              </div>
              <div className="grid gap-1.5">
                <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-32" />
                <div aria-hidden="true" className="animate-pulse bg-muted h-9 w-full rounded-lg" />
              </div>
            </div>
          </FluidPanel>
        </section>

        {/* Profile preview aside — mirrors CreateProfilePreview */}
        <aside className="order-2 grid content-start gap-4 xl:sticky xl:top-4 xl:col-start-2 xl:row-start-1 xl:self-start">
          <span className="block h-3 w-24">
            <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-24" />
          </span>
          <FluidPanel stageClassName="p-0">
            <div className="relative h-16 bg-muted">
              <div className="absolute -bottom-8 left-5">
                <div aria-hidden="true" className="animate-pulse bg-muted size-20 rounded-full" />
              </div>
            </div>
            <div className="grid gap-2 px-5 pt-12 pb-5">
              <div aria-hidden="true" className="animate-pulse bg-muted h-5 w-32" />
              <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-20" />
              <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-28" />
            </div>
          </FluidPanel>
          <FluidPanel stageClassName="gap-3 p-4">
            <div aria-hidden="true" className="animate-pulse bg-muted h-3 w-24" />
            <div aria-hidden="true" className="animate-pulse bg-muted h-4 w-full" />
            <div aria-hidden="true" className="animate-pulse bg-muted h-4 w-3/4" />
          </FluidPanel>
        </aside>

        <div className="order-3 flex flex-col gap-3 sm:flex-row xl:col-start-1 xl:row-start-2">
          <div aria-hidden="true" className="animate-pulse bg-muted h-11 flex-1 rounded-lg" />
          <div aria-hidden="true" className="animate-pulse bg-muted h-11 w-28 rounded-lg" />
        </div>
      </div>
    </main>
  </>
);

export default Loading;
