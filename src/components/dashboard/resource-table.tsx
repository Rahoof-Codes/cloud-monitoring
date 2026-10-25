"use client";

// ---------------------------------------------------------------------------
// Resource Table View — Detailed Tabular Monitoring View
// ---------------------------------------------------------------------------

import { useState, useMemo } from "react";
import {
  Server,
  Database,
  Wifi,
  HardDrive,
  Cpu,
  Search,
  Filter,
  ArrowUpDown,
  Play,
  Square,
  Eye,
  Trash2,
  Activity,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDashboard, type Resource, type ResourceType, type ResourceStatus } from "./dashboard-provider";

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

export function ResourceTable() {
  const {
    resources,
    setSelectedResource,
    toggleResourceStatus,
    deleteResource,
    thresholds,
  } = useDashboard();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"name" | "cpu" | "storage" | "rate">("name");
  const [sortAsc, setSortAsc] = useState(true);

  const filteredResources = useMemo(() => {
    return resources
      .filter((r) => {
        const matchesSearch =
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.region.toLowerCase().includes(search.toLowerCase()) ||
          r.id.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === "all" || r.type === typeFilter;
        const matchesStatus = statusFilter === "all" || r.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === "name") diff = a.name.localeCompare(b.name);
        else if (sortField === "cpu") diff = a.cpuUsage - b.cpuUsage;
        else if (sortField === "storage") diff = (a.storageUsage ?? 0) - (b.storageUsage ?? 0);
        else if (sortField === "rate") diff = a.hourlyRate - b.hourlyRate;
        return sortAsc ? diff : -diff;
      });
  }, [resources, search, typeFilter, statusFilter, sortField, sortAsc]);

  const toggleSort = (field: "name" | "cpu" | "storage" | "rate") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search resources by name, region, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-medium text-foreground outline-none"
          >
            <option value="all">All Types</option>
            <option value="VM">VM (Compute)</option>
            <option value="Database">Database</option>
            <option value="Network">Network</option>
            <option value="Storage">Storage Service</option>
            <option value="Serverless">Serverless</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-medium text-foreground outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="running">Running</option>
            <option value="stopped">Stopped</option>
            <option value="warning">Warning / Anomaly</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border/60 bg-muted/30 text-[11px] font-semibold text-muted-foreground">
            <tr>
              <th
                onClick={() => toggleSort("name")}
                className="py-3 px-3 cursor-pointer hover:text-foreground"
              >
                <div className="flex items-center gap-1">
                  <span>Resource</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-2">Type</th>
              <th className="py-3 px-2">Status</th>
              <th
                onClick={() => toggleSort("cpu")}
                className="py-3 px-2 cursor-pointer hover:text-foreground"
              >
                <div className="flex items-center gap-1">
                  <span>CPU %</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-2">Memory %</th>
              <th
                onClick={() => toggleSort("storage")}
                className="py-3 px-2 cursor-pointer hover:text-foreground"
              >
                <div className="flex items-center gap-1">
                  <span>Storage %</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-2">Network</th>
              <th className="py-3 px-2">Requests</th>
              <th className="py-3 px-2">Region</th>
              <th
                onClick={() => toggleSort("rate")}
                className="py-3 px-2 cursor-pointer hover:text-foreground"
              >
                <div className="flex items-center gap-1">
                  <span>Rate</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filteredResources.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-muted-foreground">
                  No resources match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredResources.map((r) => {
                const isCpuHigh = r.cpuUsage > thresholds.cpu;
                const isMemHigh = r.memoryUsage > thresholds.memory;
                const isStorageHigh = (r.storageUsage ?? 0) > thresholds.storage;

                return (
                  <tr
                    key={r.id}
                    className="hover:bg-muted/20 transition-colors group"
                  >
                    {/* Resource Name */}
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() => setSelectedResource(r)}
                        className="flex items-center gap-2 text-left group-hover:text-primary transition-colors"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary shrink-0">
                          {typeIcon(r.type)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate max-w-[130px] sm:max-w-[160px]">
                            {r.name}
                          </p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            {r.id.slice(0, 8)}…
                          </p>
                        </div>
                      </button>
                    </td>

                    {/* Type */}
                    <td className="py-2.5 px-2">
                      <Badge variant="outline" className="text-[10px] font-medium">
                        {r.type}
                      </Badge>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-2">
                      <span className="flex items-center gap-1.5 font-medium capitalize text-[11px]">
                        {statusDot(r.status)}
                        {r.status}
                      </span>
                    </td>

                    {/* CPU */}
                    <td className="py-2.5 px-2 font-mono tabular-nums">
                      <div className="w-16">
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span
                            className={
                              isCpuHigh ? "font-bold text-rose-500" : "text-foreground"
                            }
                          >
                            {r.cpuUsage}%
                          </span>
                        </div>
                        <Progress
                          value={r.cpuUsage}
                          className={`h-1 ${isCpuHigh ? "[&>div]:bg-rose-500" : ""}`}
                        />
                      </div>
                    </td>

                    {/* Memory */}
                    <td className="py-2.5 px-2 font-mono tabular-nums">
                      <div className="w-16">
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span
                            className={
                              isMemHigh ? "font-bold text-amber-500" : "text-foreground"
                            }
                          >
                            {r.memoryUsage}%
                          </span>
                        </div>
                        <Progress
                          value={r.memoryUsage}
                          className={`h-1 ${isMemHigh ? "[&>div]:bg-amber-500" : ""}`}
                        />
                      </div>
                    </td>

                    {/* Storage */}
                    <td className="py-2.5 px-2 font-mono tabular-nums">
                      <div className="w-16">
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span
                            className={
                              isStorageHigh ? "font-bold text-emerald-500" : "text-foreground"
                            }
                          >
                            {r.storageUsage ?? 35}%
                          </span>
                        </div>
                        <Progress
                          value={r.storageUsage ?? 35}
                          className="h-1"
                        />
                      </div>
                    </td>

                    {/* Network */}
                    <td className="py-2.5 px-2 font-mono tabular-nums text-muted-foreground">
                      {r.networkTraffic ?? 10} MB/s
                    </td>

                    {/* Requests */}
                    <td className="py-2.5 px-2 font-mono tabular-nums text-muted-foreground">
                      {r.requestCount ?? 150} req/s
                    </td>

                    {/* Region */}
                    <td className="py-2.5 px-2 text-muted-foreground text-[11px]">
                      {r.region}
                    </td>

                    {/* Rate */}
                    <td className="py-2.5 px-2 font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                      ₹{r.hourlyRate.toFixed(2)}/h
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedResource(r)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Inspect Telemetry Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleResourceStatus(r.id, r.status)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title={r.status === "running" ? "Stop Resource" : "Start Resource"}
                        >
                          {r.status === "running" ? (
                            <Square className="h-3.5 w-3.5" />
                          ) : (
                            <Play className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteResource(r.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          title="Delete Resource"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
