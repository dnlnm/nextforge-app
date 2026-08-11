"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TrendDatum {
  readonly label: string;
  readonly value: number;
}

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

  return (
    <ResponsiveContainer height={height} width="100%">
      <BarChart data={data} margin={{ bottom: 0, left: 0, right: 0, top: 8 }}>
        <XAxis
          dataKey="label"
          fontSize={11}
          stroke="var(--muted-foreground)"
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          fontSize={11}
          stroke="var(--muted-foreground)"
          tickLine={false}
          width={34}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          formatter={(value) => [
            `${formatValue(Number(value ?? 0))}${suffix}`,
            "Value",
          ]}
          labelFormatter={(label) => String(label)}
        />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
