import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import type { ClassTrends } from "@repo/domain/analytics";
import { TrendChart } from "../../components/dashboard/trend-chart";

export const ClassAnalyticsTab = ({
  trends,
}: {
  readonly trends: ClassTrends;
}) => (
  <div className="grid gap-5 lg:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle>Attendance by month</CardTitle>
        <CardDescription>
          Marked records over the last six months.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TrendChart
          color="var(--primary)"
          data={trends.attendanceByMonth}
          suffix=" marked"
        />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Enrollment starts</CardTitle>
        <CardDescription>Enrollments started each month.</CardDescription>
      </CardHeader>
      <CardContent>
        <TrendChart
          color="var(--success)"
          data={trends.enrollmentStartsByMonth}
          suffix=" started"
        />
      </CardContent>
    </Card>

    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Enrollment ends</CardTitle>
        <CardDescription>Enrollments ended each month.</CardDescription>
      </CardHeader>
      <CardContent>
        <TrendChart
          color="var(--destructive)"
          data={trends.enrollmentEndsByMonth}
          suffix=" ended"
        />
      </CardContent>
    </Card>
  </div>
);
