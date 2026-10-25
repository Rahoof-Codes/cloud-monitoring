"use client";

// ---------------------------------------------------------------------------
// Attention Panel / Alert Center
// ---------------------------------------------------------------------------
// Displays active threshold alerts, metric breaches, severity status,
// and actionable resolution controls (Acknowledge, Resolve, Inspect).
// ---------------------------------------------------------------------------

import {
  AlertTriangle,
  HardDrive,
  Server,
  Database,
  Wifi,
  Cpu,
  MemoryStick,
  Activity,
  Check,
  Eye,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard, type ResourceType } from "./dashboard-provider";
import type { Alert } from "@/lib/data";
import { FREE_TIER_CAP_BYTES, formatBytes } from "@/lib/cost";

function typeIcon(type: ResourceType) {
  const cls = "h-3.5 w-3.5";
  switch (type) {
    case "VM":
      return <Server className={cls} />;
    case "Database":
      return <Database className={cls} />;
    case "Network":
      return <Wifi className={cls} />;
    case "Storage":
      return <HardDrive className={cls} />;
    case "Serverless":
      return <Activity className={cls} />;
  }
}

function metricIcon(metric: Alert["metric"]) {
  const cls = "h-3.5 w-3.5";
  switch (metric) {
    case "CPU":
      return <Cpu className={cls} />;
    case "Memory":
      return <MemoryStick className={cls} />;
    case "Storage":
      return <HardDrive className={cls} />;
    case "Network":
      return <Wifi className={cls} />;
    case "Requests":
      return <Activity className={cls} />;
  }
}

export function AttentionPanel() {
  const {
    abnormal,
    alerts,
    resourcesLoading,
    setSelectedResource,
    resources,
    totalStorageUsedBytes,
    acknowledgeAlert,
    resolveAlert,
    openAiWithPrompt,
  } = useDashboard();

  if (resourcesLoading) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const storageWarning = totalStorageUsedBytes > FREE_TIER_CAP_BYTES * 0.8;
  const hasIssues = alerts.length > 0 || abnormal.length > 0 || storageWarning;

  if (!hasIssues) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/[0.03] dark:bg-amber-500/[0.06] shadow-xs">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            Needs Attention & Active Threshold Breaches
            {alerts.length > 0 && (
              <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 text-[10px] ml-1">
                {alerts.length} active
              </Badge>
            )}
          </CardTitle>

          {alerts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                openAiWithPrompt(
                  `I have ${alerts.length} active threshold alerts (${alerts
                    .map((a) => `${a.resourceName} ${a.metric}: ${a.value}${a.unit}`)
                    .join(", ")}). What is your root-cause analysis and remediation plan?`
                )
              }
              className="h-7 text-xs text-primary gap-1 hover:bg-primary/10"
            >
              <span>Ask AI Remediation</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Consecutive-sample anomaly alerts */}
          {alerts.map((alert) => {
            const resource = resources.find(
              (r) => r.id === alert.resourceId || r.name === alert.resourceName
            );

            const isCritical = alert.severity === "critical";

            return (
              <div
                key={alert.id}
                className={`flex flex-col justify-between rounded-xl border p-3 transition-all ${
                  isCritical
                    ? "border-rose-500/40 bg-rose-500/5 hover:border-rose-500/60"
                    : "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={isCritical ? "text-rose-500" : "text-amber-500"}>
                        {metricIcon(alert.metric)}
                      </span>
                      <p className="truncate text-xs font-semibold text-foreground">
                        {alert.resourceName}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-[9px] uppercase font-bold px-1.5 py-0 ${
                          isCritical
                            ? "border-rose-500/40 text-rose-600 dark:text-rose-400"
                            : "border-amber-500/40 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {alert.severity}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-[9px] uppercase px-1 py-0 text-muted-foreground"
                      >
                        {alert.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span
                      className={`font-mono font-bold ${
                        isCritical
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {alert.metric}: {alert.value}
                      {alert.unit}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      (threshold: {alert.threshold}
                      {alert.unit})
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] text-muted-foreground/85 leading-relaxed line-clamp-2">
                    {alert.reason}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[10px]">
                  <span className="text-muted-foreground/70">{alert.time}</span>
                  <div className="flex items-center gap-1">
                    {resource && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedResource(resource)}
                        className="h-6 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="h-3 w-3" />
                        Inspect
                      </Button>
                    )}

                    {alert.status === "active" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="h-6 px-1.5 text-[10px] gap-1 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                      >
                        <Check className="h-3 w-3" />
                        Ack
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resolveAlert(alert.id)}
                      className="h-6 px-1.5 text-[10px] gap-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <ShieldCheck className="h-3 w-3" />
                      Resolve
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Storage warning */}
          {storageWarning && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
              <HardDrive className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Global Cloud Storage Nearing Cap
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatBytes(totalStorageUsedBytes)} / {formatBytes(FREE_TIER_CAP_BYTES)} free tier
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
