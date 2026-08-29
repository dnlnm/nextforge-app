import { database } from "@repo/database";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/design-system/components/ui/avatar";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import { PreviewCard } from "@repo/design-system/components/preview-card";
import { cn } from "@repo/design-system/lib/utils";
import {
  type DashboardSessionRow,
  getTodaysClassesData,
  type SessionDisplayStatus,
} from "@repo/domain";
import { CalendarDaysIcon, UserRoundIcon } from "lucide-react";
import Link from "next/link";

interface TodaysClassesCardProps {
  readonly organizationId: string;
}

const STATUS_BADGE: Record<
  SessionDisplayStatus,
  {
    dot: string;
    label: (minutes: number | null) => string;
    variant: "error" | "info" | "outline" | "secondary" | "success" | "warning";
  }
> = {
  CANCELLED: {
    dot: "bg-destructive",
    label: () => "Cancelled",
    variant: "secondary",
  },
  COMPLETED: {
    dot: "bg-muted-foreground/40",
    label: () => "Completed",
    variant: "success",
  },
  IN_PROGRESS: {
    dot: "bg-success",
    label: () => "In progress",
    variant: "info",
  },
  STARTING_SOON: {
    dot: "bg-warning",
    label: (minutes) => `Starting in ${Math.max(1, Math.round(minutes ?? 1))}m`,
    variant: "warning",
  },
  UPCOMING: {
    dot: "bg-muted-foreground/40",
    label: () => "Upcoming",
    variant: "outline",
  },
};

interface SessionRowProps {
  readonly isLast: boolean;
  readonly session: DashboardSessionRow;
}

const SessionRow = ({ isLast, session }: SessionRowProps) => {
  const status = STATUS_BADGE[session.displayStatus.status];

  return (
    <Link
      aria-label={`${session.title} at ${session.startsAt}`}
      className={cn(
        "grid grid-cols-2 items-start gap-3 rounded-lg px-3 py-3 text-sm outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring md:grid-cols-[4.5rem_1fr_1fr_4.5rem_6.5rem] md:items-center md:gap-3",
        !isLast && "border-b md:rounded-none md:border-b"
      )}
      href="/today"
      key={session.id}
    >
      <span className="flex items-center gap-2 font-medium md:text-muted-foreground">
        <span className={cn("size-2 rounded-full", status.dot)} />
        {session.startsAt}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium md:font-normal">
          {session.title}
        </span>
        <span className="block truncate text-muted-foreground text-xs">
          {session.subjectName}
          {session.roomName ? ` · ${session.roomName}` : ""}
        </span>
      </span>
      <span className="col-span-2 flex items-center gap-2 md:col-span-1">
        {session.teacherName ? (
          <>
            <Avatar className="size-6">
              {session.teacherImageUrl ? (
                <AvatarImage
                  alt={session.teacherName}
                  src={session.teacherImageUrl}
                />
              ) : null}
              <AvatarFallback className="text-[10px]">
                {session.teacherName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-muted-foreground">
              {session.teacherName}
            </span>
          </>
        ) : (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <UserRoundIcon className="size-3.5" />
            Unassigned
          </span>
        )}
      </span>
      <span className="text-right font-medium tabular-nums md:font-normal md:text-muted-foreground">
        {session.studentCount}
        <span className="ml-1 font-normal text-muted-foreground text-xs md:hidden">
          students
        </span>
      </span>
      <span className="flex justify-end">
        <Badge variant={status.variant}>
          {status.label(session.displayStatus.minutesUntilStart)}
        </Badge>
      </span>
    </Link>
  );
};

export const TodaysClassesCard = async ({
  organizationId,
}: TodaysClassesCardProps) => {
  const { sessions } = await getTodaysClassesData(database, organizationId);

  return (
    <PreviewCard
      className="flex h-full flex-col"
      header={
        <>
          <span className="font-medium text-foreground text-sm">
            Today&apos;s Classes
          </span>
          <Button render={<Link href="/schedules" />} size="sm" variant="link">
            View Schedule
          </Button>
        </>
      }
      stageClassName="min-h-0 flex-1 justify-start p-1 sm:p-1"
    >
      {sessions.length === 0 ? (
        <Empty>
          <EmptyContent>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarDaysIcon className="size-4.5" />
              </EmptyMedia>
              <EmptyTitle>No classes today</EmptyTitle>
              <EmptyDescription>
                Create a class session from the schedule to start managing
                today&apos;s attendance.
              </EmptyDescription>
            </EmptyHeader>
            <Button render={<Link href="/classes/new" />} size="sm">
              Create Class
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="hidden shrink-0 grid-cols-[4.5rem_1fr_1fr_4.5rem_6.5rem] gap-3 border-b px-3 py-2 font-medium text-muted-foreground text-xs md:grid">
            <span>Time</span>
            <span>Class</span>
            <span>Teacher</span>
            <span className="text-right">Students</span>
            <span className="text-right">Status</span>
          </div>
          <div className="grid min-h-0 content-start gap-1 overflow-y-auto">
            {sessions.map((session, index) => (
              <SessionRow
                isLast={index === sessions.length - 1}
                key={session.id}
                session={session}
              />
            ))}
          </div>
        </div>
      )}
    </PreviewCard>
  );
};
