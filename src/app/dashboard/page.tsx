"use client";

// ---------------------------------------------------------------------------
// Dashboard Home — Overall Summary (Figure B.2 Specification)
// ---------------------------------------------------------------------------

import { useMemo } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  RefreshCw,
  Server,
  Activity,
  AlertTriangle,
  HeartPulse,
  ArrowRight,
  ShieldAlert,
  Sliders,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { useDashboard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardHomePage() {
  const {
    resources,
    alerts,
    cpuSeries,
    refreshMetrics,
    lastRefreshTime,
    refreshCountdown,
    isRefreshing,
    setSelectedResource,
  } = useDashboard();

  // Metrics calculation
  const runningResources = resources.filter((r) => r.status === "running");
  const activeAlerts = alerts.filter((a) => a.status === "active");

  const avgCpu = useMemo(() => {
    if (runningResources.length === 0) return 9.4;
    const sum = runningResources.reduce((acc, r) => acc + (r.cpuUsage ?? 0), 0);
    return +(sum / runningResources.length).toFixed(1);
  }, [runningResources]);

  // Overall Health Score: Starts at 100, drops with alerts / stopped instances
  const healthScore = useMemo(() => {
    let score = 100;
    score -= activeAlerts.length * 15;
    const errorCount = resources.filter((r) => r.status === "error").length;
    score -= errorCount * 25;
    return Math.max(10, Math.min(100, score));
  }, [activeAlerts, resources]);

  // Format time for Figure B.2 header: "Last updated 5:48:12 PM · auto-refresh 30s"
  const formattedRefreshTime = useMemo(() => {
    return lastRefreshTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  }, [lastRefreshTime]);

  // Fallback / Display series for CPUUtilization line chart matching Figure B.2
  const chartData = useMemo(() => {
    if (cpuSeries.length > 0) {
      return cpuSeries.map((pt) => ({
        timestamp: pt.time,
        value: pt.avgCpu ?? 10,
      }));
    }
    // Baseline sample points if series is still collecting
    return [
      { timestamp: "15:53", value: 8 },
      { timestamp: "16:13", value: 12 },
      { timestamp: "16:33", value: 9 },
      { timestamp: "16:53", value: 11 },
      { timestamp: "17:13", value: 14 },
      { timestamp: "17:33", value: avgCpu },
    ];
  }, [cpuSeries, avgCpu]);

  return (
    <div className="space-y-6">
      {/* ── Active Alert Notice Banner (if any) ── */}
      {activeAlerts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5 text-rose-600 dark:text-rose-400">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5 shrink-0 animate-bounce" />
            <div>
              <p className="text-sm font-semibold">
                {activeAlerts.length} Active Cloud Monitoring Alarm
                {activeAlerts.length > 1 ? "s" : ""} Requiring Attention
              </p>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/80">
                {activeAlerts[0].reason}
              </p>
            </div>
          </div>
          <Link href="/dashboard/alerts">
            <Button
              size="sm"
              variant="destructive"
              className="h-8 gap-1 text-xs shrink-0 font-medium"
            >
              <span>View & Remediate</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}

      {/* ── Top Header matching Figure B.2: Overall Summary + Refresh Now ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Overall Summary
            </h1>
            <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Simulated metrics
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Executive telemetry overview of provisioned cloud infrastructure
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Last updated {formattedRefreshTime} · auto-refresh {refreshCountdown}s
          </span>
          <Button
            size="sm"
            onClick={refreshMetrics}
            disabled={isRefreshing}
            className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs gap-1.5 shadow-sm"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh now</span>
          </Button>
        </div>
      </div>

      {/* ── 4 Summary Cards matching Figure B.2 ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Resources */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Total Resources
              </span>
              <Server className="h-4 w-4 text-blue-500/70" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {resources.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {runningResources.length} healthy
            </p>
          </CardContent>
        </Card>

        {/* Card 2: CPU Utilization */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                CPU Utilization
              </span>
              <Activity className="h-4 w-4 text-blue-500/70" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {avgCpu}%
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              EC2 average
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Active Alarms */}
        <Card
          className={`border-l-4 ${
            activeAlerts.length > 0 ? "border-l-rose-500" : "border-l-emerald-500"
          } shadow-sm transition-all hover:shadow-md`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Active Alarms
              </span>
              <AlertTriangle
                className={`h-4 w-4 ${
                  activeAlerts.length > 0
                    ? "text-rose-500"
                    : "text-emerald-500/70"
                }`}
              />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {activeAlerts.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              of 5 configured
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Health Score */}
        <Card
          className={`border-l-4 ${
            healthScore >= 90 ? "border-l-emerald-500" : "border-l-amber-500"
          } shadow-sm transition-all hover:shadow-md`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Health Score
              </span>
              <HeartPulse
                className={`h-4 w-4 ${
                  healthScore >= 90 ? "text-emerald-500/70" : "text-amber-500/70"
                }`}
              />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {healthScore}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              out of 100
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── 2-Column Section matching Figure B.2: Left CPU Chart, Right Monitored Resources ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left Column: CPUUtilization Line Chart */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-semibold tracking-tight">
              CPUUtilization
            </CardTitle>
            <Link
              href="/dashboard/metrics"
              className="text-xs font-medium text-blue-500 hover:text-blue-600 flex items-center gap-1"
            >
              <span>Explore Metrics</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="currentColor"
                    className="stroke-border/40"
                  />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fontSize: 11 }}
                    stroke="currentColor"
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={{ stroke: "currentColor", className: "stroke-border/50" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tick={{ fontSize: 11 }}
                    stroke="currentColor"
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={{ stroke: "currentColor", className: "stroke-border/50" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      borderColor: "var(--border)",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                    }}
                    formatter={(val: any) => [`${val}%`, "CPU Utilization"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#cpuGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Monitored Resources Table */}
        <Card className="shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/40">
              <CardTitle className="text-sm font-semibold tracking-tight">
                Monitored Resources
              </CardTitle>
              <Link
                href="/dashboard/resources"
                className="text-xs font-medium text-blue-500 hover:text-blue-600 flex items-center gap-1"
              >
                <span>Manage Fleet</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="pt-2 px-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border/40 text-muted-foreground bg-muted/20">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Name</th>
                      <th className="px-4 py-2.5 font-medium">Type</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {resources.slice(0, 6).map((res) => {
                      const displayType =
                        res.type === "VM"
                          ? "EC2"
                          : res.type === "Storage"
                          ? "S3"
                          : res.type === "Database"
                          ? "RDS"
                          : res.type === "Serverless"
                          ? "Lambda"
                          : "VPC";

                      const isHealthy = res.status === "running";
                      const statusLabel =
                        res.type === "Storage" && isHealthy
                          ? "available"
                          : res.status;

                      return (
                        <tr
                          key={res.id}
                          onClick={() => setSelectedResource(res)}
                          className="hover:bg-muted/40 cursor-pointer transition-colors"
                          title="Click to inspect telemetry"
                        >
                          <td className="px-4 py-3 font-medium text-foreground">
                            {res.name}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">
                            {displayType}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                isHealthy
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : res.status === "warning"
                                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </div>

          <div className="border-t border-border/40 p-3 bg-muted/10 text-right">
            <Link
              href="/dashboard/resources"
              className="text-xs font-medium text-blue-500 hover:text-blue-600 inline-flex items-center gap-1"
            >
              <span>View all {resources.length} resources in dedicated table</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>
      </div>

      {/* ── Functional Deep-Dive Shortcuts ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2">
        <Link href="/dashboard/resources" className="block group">
          <Card className="h-full border-border/60 hover:border-blue-500/50 transition-all p-3.5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-foreground group-hover:text-blue-500 transition-colors">
                Resource Provisioning
              </p>
              <p className="text-[11px] text-muted-foreground">
                Deploy, start/stop, and manage inventory
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
          </Card>
        </Link>

        <Link href="/dashboard/metrics" className="block group">
          <Card className="h-full border-border/60 hover:border-blue-500/50 transition-all p-3.5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-foreground group-hover:text-blue-500 transition-colors">
                Metric Telemetry
              </p>
              <p className="text-[11px] text-muted-foreground">
                Disk, network throughput & request volume
              </p>
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
          </Card>
        </Link>

        <Link href="/dashboard/thresholds" className="block group">
          <Card className="h-full border-border/60 hover:border-blue-500/50 transition-all p-3.5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-foreground group-hover:text-blue-500 transition-colors">
                Usage Thresholds
              </p>
              <p className="text-[11px] text-muted-foreground">
                Configure alarms & sample windows
              </p>
            </div>
            <Sliders className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
          </Card>
        </Link>

        <Link href="/dashboard/alerts" className="block group">
          <Card className="h-full border-border/60 hover:border-blue-500/50 transition-all p-3.5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-foreground group-hover:text-blue-500 transition-colors">
                Alerts & Controlled Test
              </p>
              <p className="text-[11px] text-muted-foreground">
                Test spikes and active alarm remediation
              </p>
            </div>
            <ShieldAlert className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
          </Card>
        </Link>
      </div>
    </div>
  );
}
