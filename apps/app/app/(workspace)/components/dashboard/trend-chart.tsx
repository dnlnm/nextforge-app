"use client";

import { EvilBarChart } from "@repo/design-system/components/evilcharts/charts/recharts-bar-chart";
import {
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/design-system/components/evilcharts/ui/recharts-tooltip";

// biome-ignore lint/style/useConsistentTypeDefinitions: interfaces lack the index signature required by EvilCharts' Record<string, unknown> constraint
type TrendDatum = {
  readonly label: string;
  readonly value: number;
};

export interface TrendChartProps {
  readonly color?: string;
  readonly data: TrendDatum[];
  readonly formatValue?: (value: number) => string;
  readonly height?: number;
  readonly suffix?: string;
}

export const TrendChart = ({
  color = "var(--primary)",
  data,
  formatValue = (value) => value.toString(),
  height = 180,
  suffix = "",
}: TrendChartProps) => {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground text-sm">
        No data available for this period.
      </p>
    );
  }

  const config = {
    value: {
      label: "Value",
      colors: {
        light: [color],
        dark: [color],
      },
    },
  };

  return (
    <div style={{ height }}>
      <EvilBarChart className="aspect-auto h-full" config={config} data={data}>
        <EvilBarChart.XAxis dataKey="label" fontSize={11} />
        <EvilBarChart.YAxis allowDecimals={false} fontSize={11} width={34} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => (
                <div className="flex w-full items-center justify-between gap-4 leading-none">
                  <span className="text-muted-foreground">Value</span>
                  <span className="font-medium font-mono text-foreground tabular-nums">
                    {`${formatValue(Number(value ?? 0))}${suffix}`}
                  </span>
                </div>
              )}
            />
          }
          cursor={{ fill: "var(--muted)" }}
        />
        <EvilBarChart.Bar dataKey="value" radius={4} />
      </EvilBarChart>
    </div>
  );
};
