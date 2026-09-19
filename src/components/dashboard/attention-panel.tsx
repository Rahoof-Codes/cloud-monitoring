"use client";

import { AlertTriangle, HardDrive, Server, Database, Wifi, Cpu, MemoryStick } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard, type ResourceType } from "./dashboard-provider";
import type { Alert } from "@/lib/data";
import { FREE_TIER_CAP_BYTES, formatBytes } from "@/lib/cost";

function typeIcon(type: ResourceType) {
  const cls = "h-4 w-4";
  switch (type) {
    case "VM":
      return <Server className={cls} />;
    case "Database":
      return <Database className={cls} />;
    case "Network":
      return <Wifi className={cls} />;
  }
}

function metricIcon(metric: Alert["metric"]) {
  const cls = "h-3.5 w-3.5";
  return metric === "CPU" ? (
    <Cpu className={cls} />
  ) : (
    <MemoryStick className={cls} />
  );
}

export function AttentionPanel() {
  const {
    abnormal,
    alerts,
    resourcesLoading,
    setSelectedResource,
    resources,
    totalStorageUsedBytes,
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
    <Card className="border-amber-500/30 bg-amber-500/[0.03] dark:bg-amber-500/[0.06]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          Needs Attention
          {alerts.length > 0 && (
            <span>
              — {alerts.length} alert{alerts.length > 1 ? "s" : ""}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {/* Consecutive-sample anomaly alerts */}
          {alerts.map((alert) => {
            const resource = resources.find(
              (r) => r.name === alert.resourceName
            );
            return (
              <button
                key={alert.id}
                onClick={() => resource && setSelectedResource(resource)}
                className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-left transition-all hover:border-amber-500/40 hover:shadow-sm"
              >
                <span className="text-amber-500">
                  {metricIcon(alert.metric)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">
                      {typeIcon(alert.resourceType)}
                    </span>
                    <p className="truncate text-sm font-medium">
                      {alert.resourceName}
                    </p>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {alert.metric} {alert.value}%
                    </span>
                    <span>· {alert.time}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                    {alert.reason}
                  </p>
                </div>
              </button>
            );
          })}

          {/* Storage warning */}
          {storageWarning && (
            <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <HardDrive className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Storage nearing cap
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(totalStorageUsedBytes)} /{" "}
                  {formatBytes(FREE_TIER_CAP_BYTES)} free tier
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
