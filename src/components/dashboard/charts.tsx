"use client";

import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
  ReferenceLine,
  Legend,
} from "recharts";
import {
  PieChart,
  Pie,
  Cell,
  Legend as PieLegend,
  Tooltip as PieTooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "./dashboard-provider";

// ── Custom dot renderer for anomalous points ────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AnomalyDot(props: any) {
  const { cx, cy, payload, dataKey } = props;
  if (!payload?.anomaly) return null;
  const value = payload[dataKey];
  if (value == null || value <= 80) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="hsl(0, 85%, 60%)"
      stroke="#fff"
      strokeWidth={1.5}
    />
  );
}

// ── CPU Line Chart ──────────────────────────────────────────────────────────

export function CpuChart() {
  const { cpuSeries, resourcesLoading, resources } = useDashboard();
  const hasRunningResources = resources.some((r) => r.status === "running");

  if (resourcesLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[260px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const showEmpty = cpuSeries.length === 0 || !hasRunningResources;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            CPU Usage — Live
          </CardTitle>
          {!showEmpty && (
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-600 dark:text-amber-400 px-1.5 py-0"
            >
              Simulated metrics
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[260px] w-full min-w-0">
          {showEmpty ? (
            <div className="flex h-full flex-col items-center justify-center gap-1">
              <p className="text-sm text-muted-foreground">
                No running resources
              </p>
              <p className="text-xs text-muted-foreground/60">
                Add and start resources to see live CPU metrics
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={cpuSeries} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="peakGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(350, 70%, 55%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(350, 70%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 50% / 0.1)" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: "hsl(0 0% 45%)" }}
                  stroke="hsl(0 0% 50% / 0.5)"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: "hsl(0 0% 45%)" }}
                  stroke="hsl(0 0% 50% / 0.5)"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0 0% 10%)",
                    border: "1px solid hsl(0 0% 20%)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#fff",
                  }}
                  formatter={(value) => [`${value}%`, undefined]}
                />
                {/* 80% anomaly threshold reference line */}
                <ReferenceLine
                  y={80}
                  stroke="hsl(0, 70%, 55%)"
                  strokeDasharray="6 3"
                  strokeWidth={1.5}
                  label={{
                    value: "80% threshold",
                    position: "insideTopRight",
                    fill: "hsl(0, 70%, 55%)",
                    fontSize: 10,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="peakCpu"
                  stroke="hsl(350, 70%, 55%)"
                  strokeWidth={1.5}
                  fill="url(#peakGrad)"
                  name="Peak CPU"
                  dot={<AnomalyDot dataKey="peakCpu" />}
                  activeDot={{ r: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="avgCpu"
                  stroke="hsl(210, 80%, 55%)"
                  strokeWidth={2}
                  fill="url(#cpuGrad)"
                  name="Avg CPU"
                  dot={<AnomalyDot dataKey="avgCpu" />}
                  activeDot={{ r: 4 }}
                />
                <Legend
                  iconType="line"
                  iconSize={12}
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Distribution Donut ──────────────────────────────────────────────────────

const RADIAN = Math.PI / 180;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderLabel(props: any) {
  const { cx, cy, midAngle, innerRadius, outerRadius, value } = props;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (value === 0) return null;
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {value}
    </text>
  );
}

export function DistributionChart() {
  const { distribution, resourcesLoading } = useDashboard();

  if (resourcesLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <Skeleton className="h-[260px] w-[260px] rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = distribution.some((d) => d.value > 0);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Resource Distribution by Type
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[260px] w-full min-w-0">
          {!hasData ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No resources to chart
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={distribution.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={renderLabel}
                  stroke="none"
                >
                  {distribution
                    .filter((d) => d.value > 0)
                    .map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                </Pie>
                <PieTooltip
                  contentStyle={{
                    backgroundColor: "hsl(0 0% 10%)",
                    border: "1px solid hsl(0 0% 20%)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#fff",
                  }}
                />
                <PieLegend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
