"use client";

import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip as PieTooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "./dashboard-provider";

// ── CPU Line Chart ──────────────────────────────────────────────────────────

export function CpuChart() {
  const { cpuSeries, resourcesLoading } = useDashboard();

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

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          CPU Usage — Last 24 h
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[260px] w-full min-w-0">
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
                tick={{ fontSize: 10 }}
                stroke="hsl(0 0% 50% / 0.3)"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10 }}
                stroke="hsl(0 0% 50% / 0.3)"
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
              <Area
                type="monotone"
                dataKey="peakCpu"
                stroke="hsl(350, 70%, 55%)"
                strokeWidth={1.5}
                fill="url(#peakGrad)"
                name="Peak"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="avgCpu"
                stroke="hsl(210, 80%, 55%)"
                strokeWidth={2}
                fill="url(#cpuGrad)"
                name="Average"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
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
                <Legend
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
