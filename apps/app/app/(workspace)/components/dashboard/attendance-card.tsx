import { database } from "@repo/database";
import { Button } from "@repo/design-system/components/ui/button";
import {
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { CardShell } from "@repo/design-system/components/ui/card-shell";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import {
  StatDescription,
  StatTrend,
} from "@repo/design-system/components/ui/stat";
import { getAttendanceData } from "@repo/domain";
import { privateFileUrl } from "@repo/storage/client";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ClipboardListIcon,
} from "lucide-react";
import Link from "next/link";
import { StudentAvatar } from "../student-avatar";
import { TrendChart } from "./trend-chart";

interface AttendanceCardProps {
  readonly organizationId: string;
}

export const AttendanceCard = async ({
  organizationId,
}: AttendanceCardProps) => {
  const data = await getAttendanceData(database, organizationId);
  const hasAttendance = data.monthlyPercentage !== null;

  return (
    <CardShell className="h-full">
      <CardHeader>
        <CardTitle>Attendance (This Month)</CardTitle>
        <CardAction>
          <Button render={<Link href="/attendance" />} size="sm" variant="link">
            View Attendance
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        {hasAttendance ? (
          <>
            <div className="mb-3 shrink-0">
              <div className="flex items-end gap-3">
                <p className="font-semibold text-4xl tracking-tight">
                  {data.monthlyPercentage}%
                </p>
                {data.vsLastMonthPp !== 0 ? (
                  <StatTrend trend={data.vsLastMonthPp > 0 ? "up" : "down"}>
                    {data.vsLastMonthPp > 0 ? (
                      <ArrowUpIcon />
                    ) : (
                      <ArrowDownIcon />
                    )}
                    {Math.abs(data.vsLastMonthPp)}% vs last month
                  </StatTrend>
                ) : (
                  <StatDescription>No change vs last month</StatDescription>
                )}
              </div>
              <p className="mt-1 text-muted-foreground text-sm">
                Overall attendance
              </p>
            </div>
            <TrendChart
              color="var(--success)"
              data={data.weeklyTrend}
              formatValue={(value) => `${value}%`}
              height={140}
            />
            <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3">
              <div className="flex min-w-0 items-center gap-2">
                {data.absentTodayTotal > 0 ? (
                  <>
                    <div className="flex -space-x-1.5">
                      {data.absentToday.map((student) => (
                        <StudentAvatar
                          className="size-7 ring-2 ring-background"
                          gender={student.gender}
                          key={student.id}
                          name={student.name}
                          photoUrl={privateFileUrl(student.photoKey)}
                        />
                      ))}
                    </div>
                    {data.absentTodayTotal > data.absentToday.length ? (
                      <span className="flex size-7 items-center justify-center rounded-full border bg-muted font-medium text-[10px] text-muted-foreground ring-2 ring-background">
                        +{data.absentTodayTotal - data.absentToday.length}
                      </span>
                    ) : null}
                  </>
                ) : null}
                <p className="truncate text-muted-foreground text-sm">
                  {data.absentTodayTotal > 0
                    ? `${data.absentTodayTotal} ${data.absentTodayTotal === 1 ? "student" : "students"} absent today`
                    : "No absences today"}
                </p>
              </div>
              <Button
                render={<Link href="/attendance" />}
                size="sm"
                variant="link"
              >
                View Attendance
                <ArrowRightIcon className="size-3.5" />
              </Button>
            </div>
          </>
        ) : (
          <Empty>
            <EmptyContent>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ClipboardListIcon className="size-4.5" />
                </EmptyMedia>
                <EmptyTitle>No attendance marked yet</EmptyTitle>
                <EmptyDescription>
                  Attendance records will appear after teachers mark
                  today&apos;s classes.
                </EmptyDescription>
              </EmptyHeader>
              <Button render={<Link href="/attendance" />} size="sm">
                Open Attendance
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </CardContent>
    </CardShell>
  );
};
