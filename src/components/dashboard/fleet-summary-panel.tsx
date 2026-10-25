"use client";

// ---------------------------------------------------------------------------
// Fleet Summary Panel — Overall Summary of Monitored Cloud Resources
// ---------------------------------------------------------------------------

import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Sliders,
  Cloud,
  Zap,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboard } from "./dashboard-provider";
import { ThresholdDialog } from "./threshold-dialog";
import { MonitoringConfigDialog } from "./monitoring-config-dialog";
import { ControlledTestDialog } from "./controlled-test-dialog";
import { DocsDialog } from "./docs-dialog";

export function FleetSummaryPanel() {
  const {
    resources,
    alerts,
    monitoringConfig,
    thresholds,
    refreshMetrics,
    lastRefreshTime,
    refreshCountdown,
    isRefreshing,
  } = useDashboard();

  const [thresholdOpen, setThresholdOpen] = useState(false);
  const [monitoringOpen, setMonitoringOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);

  const total = resources.length;
  const running = resources.filter((r) => r.status === "running").length;
  const stopped = resources.filter((r) => r.status === "stopped").length;
  const warning = resources.filter((r) => r.status === "warning" || r.status === "error").length;

  const runningResources = resources.filter((r) => r.status === "running");
  const runningCount = runningResources.length || 1;

  const fleetAvgCpu = Math.round(
    runningResources.reduce((sum, r) => sum + r.cpuUsage, 0) / runningCount
  );
  const fleetAvgMem = Math.round(
    runningResources.reduce((sum, r) => sum + r.memoryUsage, 0) / runningCount
  );
  const fleetTotalThroughput = Number(
    runningResources
      .reduce((sum, r) => sum + (r.networkTraffic ?? 0), 0)
      .toFixed(1)
  );
  const fleetTotalRequests = runningResources.reduce(
    (sum, r) => sum + (r.requestCount ?? 0),
    0
  );

  const isDegraded = alerts.length > 0 || warning > 0;
  const healthScore = total === 0 ? 100 : Math.max(70, Math.round(100 - (alerts.length * 12)));

  return (
    <>
      <Card className="relative overflow-hidden border-border/70 bg-gradient-to-r from-card via-card to-muted/20 shadow-xs">
        {/* Subtle accent line on top */}
        <div
          className={`absolute inset-x-0 top-0 h-[2px] ${
            isDegraded
              ? "bg-gradient-to-r from-amber-500 via-rose-500 to-amber-400"
              : "bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-400"
          }`}
        />

        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Overall Health & Fleet Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Cloud className="h-3.5 w-3.5 text-primary" />
                  Fleet Observability Overview
                </span>
                <Badge
                  className={`gap-1 text-[11px] font-semibold ${
                    isDegraded
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  }`}
                >
                  {isDegraded ? (
                    <>
                      <AlertTriangle className="h-3 w-3" />
                      {healthScore}% Health · Attention Required
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      {healthScore}% Health · Normal Operations
                    </>
                  )}
                </Badge>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  {monitoringConfig.provider} ({monitoringConfig.intervalSeconds}s sync)
                </Badge>
              </div>

              {/* Resource state pills */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-semibold text-foreground">
                  {total} Monitored Resources:
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {running} Running
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-zinc-500/10 px-2 py-0.5 font-medium text-zinc-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                  {stopped} Stopped
                </span>
                {warning > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 font-medium text-amber-600 dark:text-amber-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {warning} In Alert
                  </span>
                )}
              </div>
            </div>

            {/* Center: Aggregate Telemetry Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 py-2 lg:py-0 border-y lg:border-y-0 lg:border-x border-border/50 px-0 lg:px-6">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Cpu className="h-3 w-3 text-blue-500" />
                  Fleet Avg CPU
                </p>
                <p className="text-base font-bold text-foreground tabular-nums mt-0.5">
                  {fleetAvgCpu}%
                  <span className="text-[10px] font-normal text-muted-foreground ml-1">
                    (limit {thresholds.cpu}%)
                  </span>
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Wifi className="h-3 w-3 text-amber-500" />
                  Combined Egress
                </p>
                <p className="text-base font-bold text-foreground tabular-nums mt-0.5">
                  {fleetTotalThroughput}{" "}
                  <span className="text-[10px] font-normal text-muted-foreground">MB/s</span>
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Activity className="h-3 w-3 text-purple-500" />
                  Fleet Requests
                </p>
                <p className="text-base font-bold text-foreground tabular-nums mt-0.5">
                  {fleetTotalRequests.toLocaleString()}{" "}
                  <span className="text-[10px] font-normal text-muted-foreground">req/s</span>
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-rose-500" />
                  Active Breaches
                </p>
                <p
                  className={`text-base font-bold tabular-nums mt-0.5 ${
                    alerts.length > 0 ? "text-rose-500" : "text-emerald-500"
                  }`}
                >
                  {alerts.length}
                  <span className="text-[10px] font-normal text-muted-foreground ml-1">
                    alerts
                  </span>
                </p>
              </div>
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap lg:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setThresholdOpen(true)}
                className="h-8 gap-1.5 text-xs"
                title="Configure Metric Thresholds"
              >
                <Sliders className="h-3.5 w-3.5 text-primary" />
                <span>Thresholds</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setMonitoringOpen(true)}
                className="h-8 gap-1.5 text-xs"
                title="Configure Cloud Monitoring Platform"
              >
                <Cloud className="h-3.5 w-3.5 text-blue-500" />
                <span>Monitoring Service</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setTestOpen(true)}
                className="h-8 gap-1.5 text-xs border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                title="Demonstrate Threshold Alert"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Controlled Test</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDocsOpen(true)}
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                title="Metrics & Alert Documentation"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Docs</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ThresholdDialog open={thresholdOpen} onOpenChange={setThresholdOpen} />
      <MonitoringConfigDialog open={monitoringOpen} onOpenChange={setMonitoringOpen} />
      <ControlledTestDialog open={testOpen} onOpenChange={setTestOpen} />
      <DocsDialog open={docsOpen} onOpenChange={setDocsOpen} />
    </>
  );
}
