"use client";

import { EvilPieChart } from "@repo/design-system/components/evilcharts/charts/recharts-pie-chart";
import type { ChartConfig } from "@repo/design-system/components/evilcharts/ui/recharts-chart";

// biome-ignore lint/style/useConsistentTypeDefinitions: interfaces lack the index signature required by EvilCharts' Record<string, unknown> constraint
type AttendanceSlice = {
  fill: string;
  label: string;
  status: string;
  value: number;
};

interface AttendanceDonutChartProps {
  average: number;
  data: AttendanceSlice[];
}

export const AttendanceDonutChart = ({
  average,
  data,
}: AttendanceDonutChartProps) => {
  const config: ChartConfig = Object.fromEntries(
    data.map((item) => [
      item.label,
      { label: item.label, colors: { light: [item.fill], dark: [item.fill] } },
    ])
  );

  return (
    <div className="relative h-[220px] w-full">
      <EvilPieChart
        className="aspect-auto h-full w-full"
        config={config}
        data={data}
        dataKey="value"
        nameKey="label"
      >
        <EvilPieChart.Pie innerRadius={64} outerRadius={82} paddingAngle={2} />
        <EvilPieChart.Tooltip />
      </EvilPieChart>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="font-semibold text-3xl leading-none">
            {average.toFixed(1)}%
          </p>
          <p className="mt-1 text-muted-foreground text-xs">Average</p>
        </div>
      </div>
    </div>
  );
};
