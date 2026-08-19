import { EvilAreaChart } from "@repo/design-system/components/evilcharts/charts/recharts-area-chart";
import { EvilBarChart } from "@repo/design-system/components/evilcharts/charts/recharts-bar-chart";
import { EvilComposedChart } from "@repo/design-system/components/evilcharts/charts/recharts-composed-chart";
import { EvilLineChart } from "@repo/design-system/components/evilcharts/charts/recharts-line-chart";
import { EvilPieChart } from "@repo/design-system/components/evilcharts/charts/recharts-pie-chart";
import { EvilRadarChart } from "@repo/design-system/components/evilcharts/charts/recharts-radar-chart";
import { EvilRadialChart } from "@repo/design-system/components/evilcharts/charts/recharts-radial-chart";
import { EvilSankeyChart } from "@repo/design-system/components/evilcharts/charts/recharts-sankey-chart";
import type { ChartConfig } from "@repo/design-system/components/evilcharts/ui/recharts-chart";
import type { Meta, StoryObj } from "@storybook/react";

const multiSeriesData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const multiSeriesConfig = {
  desktop: {
    label: "Desktop",
    colors: {
      light: ["var(--chart-1)"],
      dark: ["var(--chart-2)"],
    },
  },
  mobile: {
    label: "Mobile",
    colors: {
      light: ["var(--chart-3)"],
      dark: ["var(--chart-4)"],
    },
  },
} satisfies ChartConfig;

const pieData = [
  { browser: "chrome", visitors: 275 },
  { browser: "safari", visitors: 200 },
  { browser: "firefox", visitors: 187 },
  { browser: "edge", visitors: 173 },
  { browser: "other", visitors: 90 },
];

const pieConfig = {
  chrome: {
    label: "Chrome",
    colors: { light: ["var(--chart-1)"], dark: ["var(--chart-2)"] },
  },
  safari: {
    label: "Safari",
    colors: { light: ["var(--chart-2)"], dark: ["var(--chart-3)"] },
  },
  firefox: {
    label: "Firefox",
    colors: { light: ["var(--chart-3)"], dark: ["var(--chart-4)"] },
  },
  edge: {
    label: "Edge",
    colors: { light: ["var(--chart-4)"], dark: ["var(--chart-5)"] },
  },
  other: {
    label: "Other",
    colors: { light: ["var(--chart-5)"], dark: ["var(--chart-1)"] },
  },
} satisfies ChartConfig;

const radarData = [
  { subject: "Math", desktop: 186, mobile: 80 },
  { subject: "English", desktop: 305, mobile: 200 },
  { subject: "Science", desktop: 237, mobile: 120 },
  { subject: "History", desktop: 73, mobile: 190 },
  { subject: "Art", desktop: 209, mobile: 130 },
];

const radialData = [
  { name: "Chrome", visitors: 275 },
  { name: "Safari", visitors: 200 },
  { name: "Firefox", visitors: 187 },
  { name: "Edge", visitors: 173 },
];

const radialConfig = {
  Chrome: {
    label: "Chrome",
    colors: { light: ["var(--chart-1)"], dark: ["var(--chart-2)"] },
  },
  Safari: {
    label: "Safari",
    colors: { light: ["var(--chart-2)"], dark: ["var(--chart-3)"] },
  },
  Firefox: {
    label: "Firefox",
    colors: { light: ["var(--chart-3)"], dark: ["var(--chart-4)"] },
  },
  Edge: {
    label: "Edge",
    colors: { light: ["var(--chart-4)"], dark: ["var(--chart-5)"] },
  },
} satisfies ChartConfig;

const sankeyData = {
  nodes: [
    { name: "Discover" },
    { name: "Visit" },
    { name: "Sign up" },
    { name: "Subscribe" },
    { name: "Churn" },
  ],
  links: [
    { source: 0, target: 1, value: 500 },
    { source: 1, target: 2, value: 120 },
    { source: 2, target: 3, value: 45 },
    { source: 2, target: 4, value: 75 },
    { source: 3, target: 4, value: 20 },
  ],
};

const sankeyConfig = {
  Discover: {
    label: "Discover",
    colors: { light: ["var(--chart-1)"], dark: ["var(--chart-2)"] },
  },
  Visit: {
    label: "Visit",
    colors: { light: ["var(--chart-2)"], dark: ["var(--chart-3)"] },
  },
  "Sign up": {
    label: "Sign up",
    colors: { light: ["var(--chart-3)"], dark: ["var(--chart-4)"] },
  },
  Subscribe: {
    label: "Subscribe",
    colors: { light: ["var(--chart-4)"], dark: ["var(--chart-5)"] },
  },
  Churn: {
    label: "Churn",
    colors: { light: ["var(--chart-5)"], dark: ["var(--chart-1)"] },
  },
} satisfies ChartConfig;

/**
 * Beautiful, animated charts. Built on the EvilCharts registry over Recharts.
 * Copy and paste into your apps.
 */
const meta = {
  title: "ui/Chart",
  component: EvilAreaChart,
  tags: ["autodocs"],
  argTypes: {},
  args: {
    config: multiSeriesConfig,
    data: multiSeriesData,
    children: <div />,
  },
} satisfies Meta<typeof EvilAreaChart>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Combine multiple Area components to create a stacked area chart.
 */
export const StackedAreaChart: Story = {
  render: () => (
    <EvilAreaChart
      className="aspect-auto"
      config={multiSeriesConfig}
      curveType="natural"
      data={multiSeriesData}
      stackType="stacked"
    >
      <EvilAreaChart.Grid />
      <EvilAreaChart.XAxis
        dataKey="month"
        tickFormatter={(value) => value.slice(0, 3)}
        tickMargin={10}
      />
      <EvilAreaChart.YAxis />
      <EvilAreaChart.Tooltip />
      <EvilAreaChart.Legend />
      <EvilAreaChart.Area dataKey="mobile" strokeVariant="solid" />
      <EvilAreaChart.Area dataKey="desktop" strokeVariant="solid" />
    </EvilAreaChart>
  ),
};

/**
 * Combine multiple Bar components to create a stacked bar chart.
 */
export const StackedBarChart: Story = {
  render: () => (
    <EvilBarChart
      className="aspect-auto"
      config={multiSeriesConfig}
      data={multiSeriesData}
      stackType="stacked"
    >
      <EvilBarChart.Grid />
      <EvilBarChart.XAxis
        dataKey="month"
        tickFormatter={(value) => value.slice(0, 3)}
        tickMargin={10}
      />
      <EvilBarChart.YAxis />
      <EvilBarChart.Tooltip />
      <EvilBarChart.Legend />
      <EvilBarChart.Bar dataKey="desktop" radius={4} />
      <EvilBarChart.Bar dataKey="mobile" radius={4} />
    </EvilBarChart>
  ),
};

/**
 * Combine multiple Line components to create a multi-series line chart.
 */
export const MultiLineChart: Story = {
  render: () => (
    <EvilLineChart
      className="aspect-auto"
      config={multiSeriesConfig}
      curveType="natural"
      data={multiSeriesData}
    >
      <EvilLineChart.Grid />
      <EvilLineChart.XAxis
        dataKey="month"
        tickFormatter={(value) => value.slice(0, 3)}
        tickMargin={10}
      />
      <EvilLineChart.YAxis />
      <EvilLineChart.Tooltip />
      <EvilLineChart.Legend />
      <EvilLineChart.Line
        dataKey="desktop"
        strokeVariant="solid"
        strokeWidth={2}
      />
      <EvilLineChart.Line
        dataKey="mobile"
        strokeVariant="dashed"
        strokeWidth={2}
      />
    </EvilLineChart>
  ),
};

/**
 * Combine Pie and an overlay to create a doughnut chart with a center label.
 */
export const DoughnutChart: Story = {
  render: () => {
    const totalVisitors = pieData.reduce((acc, curr) => acc + curr.visitors, 0);

    return (
      <div className="relative h-64 w-full">
        <EvilPieChart
          className="aspect-auto h-full w-full"
          config={pieConfig}
          data={pieData}
          dataKey="visitors"
          nameKey="browser"
        >
          <EvilPieChart.Pie innerRadius={48} paddingAngle={2} />
          <EvilPieChart.Legend />
          <EvilPieChart.Tooltip />
        </EvilPieChart>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="font-bold text-3xl">
              {totalVisitors.toLocaleString()}
            </p>
            <p className="text-muted-foreground">Visitors</p>
          </div>
        </div>
      </div>
    );
  },
};

/**
 * A radial bar chart — use it for single-metric progress.
 */
export const RadialChart: Story = {
  render: () => (
    <EvilRadialChart
      className="aspect-auto"
      config={radialConfig}
      data={radialData}
      nameKey="name"
    >
      <EvilRadialChart.RadialBar dataKey="visitors" showBackground />
      <EvilRadialChart.Tooltip />
      <EvilRadialChart.Legend />
    </EvilRadialChart>
  ),
};

/**
 * A radar chart comparing multiple series across categories.
 */
export const RadarChart: Story = {
  render: () => (
    <EvilRadarChart
      className="aspect-auto"
      config={multiSeriesConfig}
      data={radarData}
    >
      <EvilRadarChart.PolarGrid />
      <EvilRadarChart.PolarAngleAxis dataKey="subject" />
      <EvilRadarChart.Tooltip />
      <EvilRadarChart.Legend />
      <EvilRadarChart.Radar dataKey="desktop" />
      <EvilRadarChart.Radar dataKey="mobile" />
    </EvilRadarChart>
  ),
};

/**
 * Combine Bar and Line components into a single composed chart.
 */
export const ComposedChart: Story = {
  render: () => (
    <EvilComposedChart
      className="aspect-auto"
      config={multiSeriesConfig}
      curveType="natural"
      data={multiSeriesData}
    >
      <EvilComposedChart.Grid />
      <EvilComposedChart.XAxis
        dataKey="month"
        tickFormatter={(value) => value.slice(0, 3)}
        tickMargin={10}
      />
      <EvilComposedChart.YAxis />
      <EvilComposedChart.Tooltip />
      <EvilComposedChart.Legend />
      <EvilComposedChart.Bar dataKey="desktop" radius={4} />
      <EvilComposedChart.Line dataKey="mobile" strokeVariant="solid" />
    </EvilComposedChart>
  ),
};

/**
 * A sankey chart for visualizing flows between nodes.
 */
export const SankeyChart: Story = {
  render: () => (
    <EvilSankeyChart
      className="aspect-auto"
      config={sankeyConfig}
      data={sankeyData}
    >
      <EvilSankeyChart.Node isClickable>
        <EvilSankeyChart.NodeLabel position="outside" showValues />
      </EvilSankeyChart.Node>
      <EvilSankeyChart.Link />
      <EvilSankeyChart.Tooltip />
    </EvilSankeyChart>
  ),
};
