"use client";

import { EvilAreaChart } from "@repo/design-system/components/evilcharts/charts/recharts-area-chart";
import {
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/design-system/components/evilcharts/ui/recharts-tooltip";
import { formatMoneyValue } from "@repo/money";

// biome-ignore lint/style/useConsistentTypeDefinitions: interfaces lack the index signature required by EvilCharts' Record<string, unknown> constraint
type FeeCollectionPoint = {
  collected: number;
  day: string;
};

interface FeeCollectionChartProps {
  currency: string;
  data: FeeCollectionPoint[];
}

export const FeeCollectionChart = ({
  currency,
  data,
}: FeeCollectionChartProps) => {
  const config = {
    collected: {
      label: "Collected",
      colors: {
        light: ["var(--chart-1)"],
        dark: ["var(--chart-1)"],
      },
    },
  };

  return (
    <EvilAreaChart
      className="aspect-auto"
      config={config}
      curveType="natural"
      data={data}
    >
      <EvilAreaChart.Grid />
      <EvilAreaChart.XAxis
        dataKey="day"
        interval="preserveStartEnd"
        tickMargin={10}
      />
      <EvilAreaChart.YAxis
        tickFormatter={(value) => formatMoneyValue(Number(value), { currency })}
        width={62}
      />
      <ChartTooltip
        content={
          <ChartTooltipContent
            formatter={(value) => (
              <div className="flex w-full items-center justify-between gap-4 leading-none">
                <span className="text-muted-foreground">Collected</span>
                <span className="font-medium font-mono text-foreground tabular-nums">
                  {formatMoneyValue(Number(value ?? 0), { currency })}
                </span>
              </div>
            )}
          />
        }
        cursor={false}
      />
      <EvilAreaChart.Area
        dataKey="collected"
        strokeVariant="solid"
        strokeWidth={2}
      />
    </EvilAreaChart>
  );
};
