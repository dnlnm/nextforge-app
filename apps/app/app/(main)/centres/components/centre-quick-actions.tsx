import { buildWorkspaceUrl } from "@repo/auth/domain";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/fluid-card";
import {
  ArrowUpRightIcon,
  BookOpenIcon,
  CalendarCheckIcon,
  ClipboardCheckIcon,
  GraduationCapIcon,
  ReceiptIcon,
  UsersIcon,
} from "lucide-react";

export interface CentreQuickActionsProps {
  readonly slug: string;
}

interface QuickActionItem {
  readonly description: string;
  readonly href: string;
  readonly icon: React.ReactNode;
  readonly title: string;
}

export const CentreQuickActions = ({ slug }: CentreQuickActionsProps) => {
  const actions: QuickActionItem[] = [
    {
      title: "Today's Schedule & Attendance",
      description: "Review today's classes and record student attendance",
      href: buildWorkspaceUrl(slug, "/today"),
      icon: (
        <CalendarCheckIcon className="size-4 text-blue-600 dark:text-blue-400" />
      ),
    },
    {
      title: "Students & Enrolment",
      description:
        "Register new students, update profiles, or bulk import records",
      href: buildWorkspaceUrl(slug, "/students"),
      icon: (
        <UsersIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
      ),
    },
    {
      title: "Classes & Schedules",
      description: "Manage academic subjects, rooms, and weekly timetables",
      href: buildWorkspaceUrl(slug, "/classes"),
      icon: (
        <BookOpenIcon className="size-4 text-indigo-600 dark:text-indigo-400" />
      ),
    },
    {
      title: "Invoices & Payments",
      description: "Issue monthly student fee invoices and record payments",
      href: buildWorkspaceUrl(slug, "/invoices"),
      icon: (
        <ReceiptIcon className="size-4 text-amber-600 dark:text-amber-400" />
      ),
    },
    {
      title: "Teaching Staff",
      description: "Manage teacher profiles, assignments, and invitations",
      href: buildWorkspaceUrl(slug, "/teachers"),
      icon: (
        <GraduationCapIcon className="size-4 text-purple-600 dark:text-purple-400" />
      ),
    },
    {
      title: "Attendance History",
      description: "Inspect historical attendance records and session rates",
      href: buildWorkspaceUrl(slug, "/attendance"),
      icon: (
        <ClipboardCheckIcon className="size-4 text-teal-600 dark:text-teal-400" />
      ),
    },
  ];

  return (
    <Card className="flex h-full flex-col overflow-hidden border-border/80 shadow-xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-base sm:text-lg">Quick Workflows</CardTitle>
        <CardDescription>
          Jump directly into common operational tasks in your centre workspace
        </CardDescription>
      </CardHeader>

      <CardContent className="grid flex-1 grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
        {actions.map((action) => (
          <a
            className="group flex items-start gap-3 rounded-lg border border-border/60 bg-surface-1 p-3 transition-colors hover:border-primary/40 hover:bg-surface-2"
            href={action.href}
            key={action.title}
          >
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted/80 ring-1 ring-border/50 group-hover:bg-background">
              {action.icon}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="font-medium text-foreground text-sm group-hover:text-primary">
                  {action.title}
                </span>
                <ArrowUpRightIcon className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="line-clamp-1 text-muted-foreground text-xs">
                {action.description}
              </p>
            </div>
          </a>
        ))}
      </CardContent>
    </Card>
  );
};
