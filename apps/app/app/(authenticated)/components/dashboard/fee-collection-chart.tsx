"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface FeeCollectionPoint {
  collected: number;
  day: string;
}

interface FeeCollectionChartProps {
  data: FeeCollectionPoint[];
}

export const FeeCollectionChart = ({ data }: FeeCollectionChartProps) => (
  <ResponsiveContainer className="text-xs" height={230} width="100%">
    <AreaChart
      accessibilityLayer
      data={data}
      margin={{ bottom: 4, left: 0, right: 8, top: 10 }}
    >
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis
        axisLine={false}
        dataKey="day"
        interval="preserveStartEnd"
        stroke="hsl(var(--muted-foreground))"
        tickLine={false}
        tickMargin={10}
      />
      <YAxis
        axisLine={false}
        stroke="hsl(var(--muted-foreground))"
        tickFormatter={(value) => `RM ${Number(value).toLocaleString()}`}
        tickLine={false}
        tickMargin={8}
        width={62}
      />
      <Tooltip
        cursor={false}
        formatter={(value) => [
          `RM ${Number(value ?? 0).toLocaleString()}`,
          "Collected",
        ]}
      />
      <Area
        dataKey="collected"
        fill="hsl(var(--chart-1))"
        fillOpacity={0.12}
        stroke="hsl(var(--chart-1))"
        strokeWidth={2}
        type="natural"
      />
    </AreaChart>
  </ResponsiveContainer>
);
