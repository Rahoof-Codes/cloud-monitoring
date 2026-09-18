"use client";

import { AlertTriangle, HardDrive, Server, Database, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard, type Resource, type ResourceType, type ResourceStatus } from "./dashboard-provider";
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

function statusDot(status: ResourceStatus) {
  const colors: Record<ResourceStatus, string> = {
    running: "bg-emerald-500",
    stopped: "bg-zinc-400",
    warning: "bg-amber-500",
    error: "bg-red-500",
  };
  return (
    <span className="relative flex h-2 w-2">
      {(status === "running" || status === "warning") && (
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full ${colors[status]} opacity-40`}
        />
      )}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${colors[status]}`} />
    </span>
  );
}

export function AttentionPanel() {
  const {
    abnormal,
    resourcesLoading,
    setSelectedResource,
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
  const hasIssues = abnormal.length > 0 || storageWarning;

  if (!hasIssues) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/[0.03] dark:bg-amber-500/[0.06]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          Needs Attention
          {abnormal.length > 0 && (
            <span>
              — {abnormal.length} resource{abnormal.length > 1 ? "s" : ""}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {/* Resource alerts */}
          {abnormal.map((r: Resource) => (
            <button
              key={r.id}
              onClick={() => setSelectedResource(r)}
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/80 p-3 text-left transition-all hover:border-amber-500/40 hover:shadow-sm"
            >
              <span className="text-muted-foreground">{typeIcon(r.type)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.name}</p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  {statusDot(r.status)}
                  <span className="capitalize">{r.status}</span>
                  {r.cpuUsage > 0 && <span>• CPU {r.cpuUsage}%</span>}
                  {r.memoryUsage > 0 && <span>• Mem {r.memoryUsage}%</span>}
                </div>
              </div>
            </button>
          ))}

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
