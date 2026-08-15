import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import type { listStudentActivity } from "@repo/domain/students/activity";
import { formatDateTime } from "@repo/date";
import {
  ActivityIcon,
  ArrowLeftRightIcon,
  CalendarCheck2Icon,
  CreditCardIcon,
  PlusIcon,
  ReceiptTextIcon,
  RotateCcwIcon,
  UserRoundIcon,
} from "lucide-react";
import type { ComponentType } from "react";

const eventMeta: Record<
  string,
  {
    readonly icon: ComponentType<{ readonly className?: string }>;
    readonly label: string;
  }
> = {
  "attendance.marked": { icon: CalendarCheck2Icon, label: "Attendance" },
  "enrollment.created": { icon: PlusIcon, label: "Enrollment" },
  "enrollment.ended": { icon: UserRoundIcon, label: "Enrollment ended" },
  "enrollment.transferred": { icon: ArrowLeftRightIcon, label: "Transferred" },
  "invoice.generated": { icon: ReceiptTextIcon, label: "Invoice" },
  "payment.recorded": { icon: CreditCardIcon, label: "Payment" },
  "payment.reversed": { icon: CreditCardIcon, label: "Payment reversed" },
  "student.archived": { icon: UserRoundIcon, label: "Archived" },
  "student.created": { icon: PlusIcon, label: "Created" },
  "student.restored": { icon: RotateCcwIcon, label: "Restored" },
};

const fallbackMeta = { icon: ActivityIcon, label: "Activity" };

const formatDate = (date: Date) => formatDateTime(date);

const getActorName = (
  actor: {
    readonly email: string | null;
    readonly firstName: string | null;
    readonly lastName: string | null;
  } | null
) => {
  if (!actor) {
    return null;
  }

  const name = [actor.firstName, actor.lastName].filter(Boolean).join(" ");

  return name.trim() || actor.email;
};

export interface StudentActivityTimelineProps {
  readonly activities: Awaited<ReturnType<typeof listStudentActivity>>;
}

export const StudentActivityTimeline = ({
  activities,
}: StudentActivityTimelineProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Activity Timeline</CardTitle>
      <CardDescription>
        Recent enrollments, attendance, billing, and profile changes.
      </CardDescription>
    </CardHeader>
    <CardContent>
      {activities.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No activity recorded yet. Activity tracking begins from the deployment
          date.
        </p>
      ) : (
        <ol className="relative grid gap-6 border-l pl-6">
          {activities.map((event) => {
            const eventType =
              event.metadata && typeof event.metadata === "object"
                ? ((event.metadata as Record<string, unknown>).eventType as
                    | string
                    | undefined)
                : undefined;
            const meta = eventType
              ? (eventMeta[eventType] ?? fallbackMeta)
              : fallbackMeta;
            const Icon = meta.icon;
            const actorName = getActorName(event.actor);

            return (
              <li className="relative" key={event.id}>
                <span className="absolute top-0.5 -left-[calc(1.5rem+1px)] flex size-6 items-center justify-center rounded-full border bg-background">
                  <Icon className="size-3.5 text-muted-foreground" />
                </span>
                <div className="grid gap-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-sm">{event.summary}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(event.createdAt)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                    <span>{meta.label}</span>
                    {actorName ? <span>· {actorName}</span> : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </CardContent>
  </Card>
);
