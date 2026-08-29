import { appName } from "@repo/config/brand";
import { differenceInMalaysiaCalendarDays } from "@repo/date";
import { TimerIcon } from "lucide-react";
import Link from "next/link";

interface TrialBannerProps {
  readonly organizationId: string;
  readonly trialEndsAt: Date | null;
}

export const TrialBanner = ({
  organizationId,
  trialEndsAt,
}: TrialBannerProps) => {
  if (!trialEndsAt) {
    return null;
  }

  const daysLeft = Math.max(
    0,
    differenceInMalaysiaCalendarDays(trialEndsAt, new Date())
  );
  const ended = daysLeft === 0;

  return (
    <div className="w-full border-b bg-amber-50/80 dark:bg-amber-950/40">
      <div className="mx-auto flex max-w-[1416px] items-center justify-center gap-2 px-4 py-2 text-center text-amber-900 text-sm dark:text-amber-100">
        <TimerIcon className="size-4 shrink-0" />
        <span>
          {ended ? (
            <>
              Your free trial has ended.{" "}
              <Link
                className="font-medium underline underline-offset-2 hover:opacity-80"
                href={`/centres/${organizationId}/subscription`}
              >
                Choose a plan to keep using {appName}.
              </Link>
            </>
          ) : (
            <>
              {daysLeft} day{daysLeft === 1 ? "" : "s"} left in your free trial.{" "}
              <Link
                className="font-medium underline underline-offset-2 hover:opacity-80"
                href={`/centres/${organizationId}/subscription`}
              >
                Choose a plan.
              </Link>
            </>
          )}
        </span>
      </div>
    </div>
  );
};
