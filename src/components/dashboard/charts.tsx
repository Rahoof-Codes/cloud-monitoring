"use client";

import { useState } from "react";
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
import { Cpu, MemoryStick, HardDrive, Wifi, Activity } from "lucide-react";

type ActiveMetric = "cpu" | "memory" | "storage" | "network" | "requests";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AnomalyDot(props: any) {
  const { cx, cy, payload, dataKey, threshold } = props;
  if (!payload?.anomaly) return null;
  const value = payload[dataKey];
  if (value == null || value <= (threshold ?? 80)) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4.5}
      fill="hsl(0, 85%, 60%)"
      stroke="#fff"
      strokeWidth={1.5}
    />
  );
}

export function CpuChart() {
  const { cpuSeries, resourcesLoading, resources, thresholds } = useDashboard();
  const [activeMetric, setActiveMetric] = useState<ActiveMetric>("cpu");

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

  // Metric configuration
  let avgKey = "avgCpu";
  let peakKey = "peakCpu";
  let unit = "%";
  let thresholdVal = thresholds.cpu;
  let yDomain: [number, number | "auto"] = [0, 100];
  let gradColor = "hsl(210, 85%, 55%)";
  let peakGradColor = "hsl(350, 70%, 55%)";
  let avgLabel = "Avg CPU";
  let peakLabel = "Peak CPU";

  switch (activeMetric) {
    case "memory":
      avgKey = "avgMemory";
      peakKey = "peakMemory";
      unit = "%";
      thresholdVal = thresholds.memory;
      yDomain = [0, 100];
      gradColor = "hsl(280, 65%, 55%)";
      avgLabel = "Avg Memory";
      peakLabel = "Peak Memory";
      break;
    case "storage":
      avgKey = "avgStorage";
      peakKey = "peakStorage";
      unit = "%";
      thresholdVal = thresholds.storage;
      yDomain = [0, 100];
      gradColor = "hsl(160, 75%, 45%)";
      avgLabel = "Avg Storage";
      peakLabel = "Peak Storage";
      break;
    case "network":
      avgKey = "avgNetwork";
      peakKey = "peakNetwork";
      unit = " MB/s";
      thresholdVal = thresholds.network;
      yDomain = [0, Math.max(100, thresholds.network * 1.4)];
      gradColor = "hsl(35, 85%, 55%)";
      avgLabel = "Avg Bandwidth";
      peakLabel = "Peak Surge";
      break;
    case "requests":
      avgKey = "avgRequests";
      peakKey = "peakRequests";
      unit = " req/s";
      thresholdVal = thresholds.requestCount;
      yDomain = [0, Math.max(2000, thresholds.requestCount * 1.4)];
      gradColor = "hsl(330, 80%, 55%)";
      avgLabel = "Avg Requests";
      peakLabel = "Peak Rate";
      break;
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-primary" />
              Live Telemetry Streams
            </CardTitle>
            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/10 text-[10px] text-primary px-1.5 py-0"
            >
              5s Ingestion
            </Badge>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/40 border border-border/60 self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveMetric("cpu")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                activeMetric === "cpu"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Cpu className="h-3 w-3 text-blue-500" />
              <span>CPU</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMetric("memory")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                activeMetric === "memory"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MemoryStick className="h-3 w-3 text-violet-500" />
              <span>RAM</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMetric("storage")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                activeMetric === "storage"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <HardDrive className="h-3 w-3 text-emerald-500" />
              <span>Disk</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMetric("network")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                activeMetric === "network"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Wifi className="h-3 w-3 text-amber-500" />
              <span>Network</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMetric("requests")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                activeMetric === "requests"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Activity className="h-3 w-3 text-rose-500" />
              <span>Requests</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="h-[260px] w-full min-w-0">
          {showEmpty ? (
            <div className="flex h-full flex-col items-center justify-center gap-1">
              <p className="text-sm text-muted-foreground">No active metrics yet</p>
              <p className="text-xs text-muted-foreground/60">
                Start cloud resources to observe live metric patterns
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={cpuSeries} margin={{ top: 8, right: 8, bottom: 0, left: -15 }}>
                <defs>
                  <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={gradColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={gradColor} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="peakGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={peakGradColor} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={peakGradColor} stopOpacity={0} />
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
                  domain={yDomain}
                  tick={{ fontSize: 10, fill: "hsl(0 0% 45%)" }}
                  stroke="hsl(0 0% 50% / 0.5)"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}${unit === "%" ? "%" : ""}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0 0% 10%)",
                    border: "1px solid hsl(0 0% 20%)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#fff",
                  }}
                  formatter={(value) => [`${value}${unit}`, undefined]}
                />
                {/* Dynamic configured threshold reference line */}
                <ReferenceLine
                  y={thresholdVal}
                  stroke="hsl(0, 75%, 55%)"
                  strokeDasharray="6 3"
                  strokeWidth={1.5}
                  label={{
                    value: `Threshold (${thresholdVal}${unit})`,
                    position: "insideTopRight",
                    fill: "hsl(0, 75%, 55%)",
                    fontSize: 10,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={peakKey}
                  stroke={peakGradColor}
                  strokeWidth={1.5}
                  fill="url(#peakGrad)"
                  name={peakLabel}
                  dot={<AnomalyDot dataKey={peakKey} threshold={thresholdVal} />}
                  activeDot={{ r: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey={avgKey}
                  stroke={gradColor}
                  strokeWidth={2}
                  fill="url(#metricGrad)"
                  name={avgLabel}
                  dot={<AnomalyDot dataKey={avgKey} threshold={thresholdVal} />}
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
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
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
          Fleet Resource Distribution by Type
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[260px] w-full min-w-0">
          {!hasData ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">No resources to chart</p>
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
                <PieLegend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
