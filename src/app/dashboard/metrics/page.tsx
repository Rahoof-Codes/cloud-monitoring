"use client";

// ---------------------------------------------------------------------------
// Metrics Page — Telemetry Deep-Dive & Time-Series Pattern Analysis
// ---------------------------------------------------------------------------

import { useMemo } from "react";
import {
  BarChart3,
  Cpu,
  HardDrive,
  Wifi,
  Activity,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import {
  useDashboard,
  CpuChart,
  DistributionChart,
  SummaryCards,
} from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MetricsPage() {
  const { resources, thresholds, cpuSeries, setSelectedResource } = useDashboard();

  const runningResources = resources.filter((r) => r.status === "running");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Cloud Metrics Telemetry
          </h1>
          <Badge variant="outline" className="text-xs">
            Multi-Metric Pipeline
          </Badge>
          <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Simulated metrics
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Real-time time-series telemetry streams, metric distribution, and utilization patterns across compute, storage, and networking.
        </p>
      </div>

      {/* 5 Real-Time Telemetry Summary Cards */}
      <SummaryCards />

      {/* Detailed Multi-Metric Time Series Chart & Anomaly Visualizer */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CpuChart />
        </div>
        <div className="lg:col-span-1">
          <DistributionChart />
        </div>
      </div>

      {/* Resource Telemetry Breakdown Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold tracking-tight">
              Per-Resource Telemetry Matrix
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {runningResources.length} active instances reporting telemetry
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/40 text-muted-foreground bg-muted/20">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Resource</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">CPU (%)</th>
                  <th className="px-4 py-2.5 font-medium">Memory (%)</th>
                  <th className="px-4 py-2.5 font-medium">Storage (%)</th>
                  <th className="px-4 py-2.5 font-medium">Network (MB/s)</th>
                  <th className="px-4 py-2.5 font-medium">Traffic (req/s)</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {resources.map((res) => {
                  const isRunning = res.status === "running";
                  const cpuVal = res.cpuUsage ?? 0;
                  const memVal = res.memoryUsage ?? 0;
                  const storageVal = res.storageUsage ?? 0;
                  const netVal = res.networkTraffic ?? 0;
                  const reqVal = res.requestCount ?? 0;

                  const isCpuBreach = isRunning && cpuVal >= thresholds.cpu;
                  const isStorageBreach = isRunning && storageVal >= thresholds.storage;

                  return (
                    <tr
                      key={res.id}
                      onClick={() => setSelectedResource(res)}
                      className="hover:bg-muted/40 cursor-pointer transition-colors"
                      title="Click to view detailed metrics"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {res.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">
                        {res.type}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-mono ${
                            isCpuBreach
                              ? "text-rose-500 font-bold"
                              : "text-foreground"
                          }`}
                        >
                          {isRunning ? `${cpuVal}%` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {isRunning ? `${memVal}%` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-mono ${
                            isStorageBreach
                              ? "text-rose-500 font-bold"
                              : "text-foreground"
                          }`}
                        >
                          {isRunning ? `${storageVal}%` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {isRunning ? `${netVal} MB/s` : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {isRunning ? `${reqVal} req/s` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            res.status === "running"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : res.status === "warning"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {res.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
