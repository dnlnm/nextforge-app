"use client";

import { Label, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface AttendanceSlice {
  fill: string;
  label: string;
  status: string;
  value: number;
}

interface AttendanceDonutChartProps {
  average: number;
  data: AttendanceSlice[];
}

export const AttendanceDonutChart = ({
  average,
  data,
}: AttendanceDonutChartProps) => (
  <ResponsiveContainer className="mx-auto text-xs" height={220} width="100%">
    <PieChart>
      <Tooltip cursor={false} formatter={(value, name) => [value ?? 0, name]} />
      <Pie
        data={data}
        dataKey="value"
        innerRadius={64}
        nameKey="label"
        outerRadius={82}
        strokeWidth={4}
      >
        <Label
          content={({ viewBox }) => {
            if (!(viewBox && "cx" in viewBox && "cy" in viewBox)) {
              return null;
            }

            return (
              <text
                dominantBaseline="middle"
                textAnchor="middle"
                x={viewBox.cx}
                y={viewBox.cy}
              >
                <tspan
                  className="fill-foreground font-semibold text-3xl"
                  x={viewBox.cx}
                  y={viewBox.cy}
                >
                  {average.toFixed(1)}%
                </tspan>
                <tspan
                  className="fill-muted-foreground text-xs"
                  x={viewBox.cx}
                  y={(viewBox.cy ?? 0) + 24}
                >
                  Average
                </tspan>
              </text>
            );
          }}
        />
      </Pie>
    </PieChart>
  </ResponsiveContainer>
);
