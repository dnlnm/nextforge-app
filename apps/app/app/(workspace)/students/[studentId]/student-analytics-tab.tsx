import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import type { StudentTrends } from "@repo/domain/analytics";
import { TrendChart } from "../../components/dashboard/trend-chart";

const formatMoney = (amountSen: number) =>
  new Intl.NumberFormat("en-MY", {
    currency: "MYR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amountSen / 100);

export const StudentAnalyticsTab = ({
  trends,
}: {
  readonly trends: StudentTrends;
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
        <CardTitle>Attendance rate by month</CardTitle>
        <CardDescription>
          Present and late share of non-excused records.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TrendChart
          color="var(--success)"
          data={trends.attendanceRateByMonth}
          formatValue={(value) => `${value}%`}
          suffix="%"
        />
      </CardContent>
    </Card>

    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Recorded payments by month</CardTitle>
        <CardDescription>
          Payments recorded over the last six months.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TrendChart
          color="var(--destructive)"
          data={trends.paymentByMonth}
          formatValue={formatMoney}
        />
      </CardContent>
    </Card>
  </div>
);
