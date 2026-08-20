import { database } from "@repo/database";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardFrame,
  CardFrameHeader,
  CardFrameTitle,
} from "@repo/design-system/components/ui/card";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@repo/design-system/components/ui/progress";
import { cn } from "@repo/design-system/lib/utils";
import { getSetupStatus, type SetupItemKey } from "@repo/domain";
import {
  Building2Icon,
  CheckCircle2Icon,
  CircleIcon,
  CoinsIcon,
  GraduationCapIcon,
  PresentationIcon,
  UserRoundPlusIcon,
} from "lucide-react";
import Link from "next/link";

interface SetupCardProps {
  readonly organizationId: string;
}

const SETUP_ITEMS: Record<
  SetupItemKey,
  { href: string; icon: typeof CircleIcon; label: string }
> = {
  ASSIGN_TEACHER: {
    href: "/teachers/new",
    icon: UserRoundPlusIcon,
    label: "Assign a teacher",
  },
  CENTRE_PROFILE: {
    href: "/settings",
    icon: Building2Icon,
    label: "Centre profile",
  },
  CREATE_CLASS: {
    href: "/classes/new",
    icon: PresentationIcon,
    label: "Create a class",
  },
  FEE_STRUCTURE: {
    href: "/classes",
    icon: CoinsIcon,
    label: "Set fee structure",
  },
  FIRST_STUDENT: {
    href: "/students/new",
    icon: GraduationCapIcon,
    label: "First student",
  },
};

export const SetupCard = async ({ organizationId }: SetupCardProps) => {
  const setup = await getSetupStatus(database, organizationId);

  if (setup.isOperational) {
    return null;
  }

  const nextStep = setup.items.find((item) => !item.done);
  const percentComplete = Math.round((setup.completeCount / setup.total) * 100);

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Get your centre ready</CardFrameTitle>
      </CardFrameHeader>
      <Card className="flex-1">
        <CardContent className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {setup.items.map((item) => {
              const definition = SETUP_ITEMS[item.key];

              return (
                <div
                  className="flex items-center gap-2 px-1 py-1.5 text-sm"
                  key={item.key}
                >
                  {item.done ? (
                    <CheckCircle2Icon className="size-4 shrink-0 text-success" />
                  ) : (
                    <CircleIcon className="size-4 shrink-0 text-muted-foreground/60" />
                  )}
                  <span
                    className={cn(
                      "min-w-0 truncate",
                      item.done
                        ? "text-muted-foreground line-through decoration-muted-foreground/40"
                        : "font-medium"
                    )}
                  >
                    {definition.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="grid gap-3 md:w-56">
            <div>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground">
                  {setup.completeCount} of {setup.total} complete
                </span>
                <span className="font-medium tabular-nums">
                  {percentComplete}%
                </span>
              </div>
              <Progress aria-label="Setup progress" value={percentComplete}>
                <ProgressTrack>
                  <ProgressIndicator style={{ width: `${percentComplete}%` }} />
                </ProgressTrack>
              </Progress>
            </div>
            {nextStep ? (
              <Button render={<Link href={SETUP_ITEMS[nextStep.key].href} />}>
                Continue Setup
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </CardFrame>
  );
};
