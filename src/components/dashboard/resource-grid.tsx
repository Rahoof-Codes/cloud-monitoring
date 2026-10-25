"use client";

// ---------------------------------------------------------------------------
// Resource Grid & Table View Component
// ---------------------------------------------------------------------------

import { useState } from "react";
import {
  Plus,
  Server,
  Database,
  Wifi,
  HardDrive,
  Activity,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useDashboard,
  type Resource,
  type ResourceType,
  type ResourceStatus,
  type ResourceSize,
} from "./dashboard-provider";
import { REGIONS } from "@/lib/useResources";
import { getHourlyRate, PRICING_TIERS } from "@/lib/pricing";
import { ResourceTable } from "./resource-table";

// ── Helpers ─────────────────────────────────────────────────────────────────

function typeIcon(type: ResourceType) {
  const cls = "h-4 w-4";
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

function statusVariant(status: ResourceStatus) {
  switch (status) {
    case "running":
      return "default" as const;
    case "stopped":
      return "secondary" as const;
    case "warning":
      return "outline" as const;
    case "error":
      return "destructive" as const;
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

// ── Add Resource Dialog ─────────────────────────────────────────────────────

function AddResourceDialog() {
  const { addResource } = useDashboard();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<ResourceType>("VM");
  const [size, setSize] = useState<ResourceSize>("small");
  const [region, setRegion] = useState<string>(REGIONS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const currentRate = getHourlyRate(type, size);
  const tierInfo = PRICING_TIERS[type]?.[size];

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    await addResource({ name: name.trim(), type, size, region });
    setIsCreating(false);
    setOpen(false);
    setName("");
    setType("VM");
    setSize("small");
    setRegion(REGIONS[0]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/85"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Resource
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Provision Cloud Resource</DialogTitle>
          <DialogDescription>
            Create a new monitored resource with AWS Mumbai telemetry and continuous metric collection.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Resource Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. web-prod-api or s3-media-vault"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Resource Type
            </label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as ResourceType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VM">VM (Compute Engine / EC2)</SelectItem>
                <SelectItem value="Database">Database (Managed PostgreSQL / Redis)</SelectItem>
                <SelectItem value="Network">Network (Load Balancer / Ingress)</SelectItem>
                <SelectItem value="Storage">Storage Service (S3 / Cloud Storage Bucket)</SelectItem>
                <SelectItem value="Serverless">Serverless (Cloud Function / Lambda Worker)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Size */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                Capacity / Size Tier
              </label>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                ₹{currentRate.toFixed(2)}/hr
              </span>
            </div>
            <Select
              value={size}
              onValueChange={(v) => setSize(v as ResourceSize)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">
                  Small — {PRICING_TIERS[type]?.small?.label ?? "Small"} (₹{PRICING_TIERS[type]?.small?.hourlyRate.toFixed(2)}/hr)
                </SelectItem>
                <SelectItem value="medium">
                  Medium — {PRICING_TIERS[type]?.medium?.label ?? "Medium"} (₹{PRICING_TIERS[type]?.medium?.hourlyRate.toFixed(2)}/hr)
                </SelectItem>
                <SelectItem value="large">
                  Large — {PRICING_TIERS[type]?.large?.label ?? "Large"} (₹{PRICING_TIERS[type]?.large?.hourlyRate.toFixed(2)}/hr)
                </SelectItem>
              </SelectContent>
            </Select>
            {tierInfo && (
              <p className="text-[11px] text-muted-foreground/80">
                {tierInfo.specs}
              </p>
            )}
          </div>

          {/* Region */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Region
            </label>
            <Select value={region} onValueChange={(v) => v && setRegion(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r} {r === "ap-south-1" ? "(AWS Mumbai)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || isCreating}>
            {isCreating ? "Provisioning…" : "Provision Resource"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Resource Card ───────────────────────────────────────────────────────────

function ResourceCard({ resource }: { resource: Resource }) {
  const { setSelectedResource, thresholds } = useDashboard();

  const isCpuHigh = resource.cpuUsage > thresholds.cpu;
  const isMemHigh = resource.memoryUsage > thresholds.memory;
  const isStorageHigh = (resource.storageUsage ?? 0) > thresholds.storage;

  return (
    <button
      onClick={() => setSelectedResource(resource)}
      className="group relative flex w-full flex-col gap-3 rounded-[22px] border border-border/70 dark:border-white/10 bg-gradient-to-b from-card/90 via-card/70 to-card/50 dark:from-zinc-900/80 dark:to-zinc-950/80 p-4 text-left backdrop-blur-md shadow-xs transition-all duration-300 hover:border-primary/50 hover:shadow-[0_12px_32px_rgba(0,0,0,0.18),0_0_24px_rgba(59,130,246,0.12)] hover:-translate-y-0.5"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-2xs group-hover:scale-105 group-hover:bg-primary/15 transition-all shrink-0">
            {typeIcon(resource.type)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight text-foreground truncate">
              {resource.name}
            </p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap mt-0.5">
              <span>{resource.type}</span>
              <span>·</span>
              <span className="capitalize font-medium text-foreground/80">{resource.size || "small"}</span>
              <span>·</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                ₹{(resource.hourlyRate ?? getHourlyRate(resource.type, resource.size)).toFixed(2)}/hr
              </span>
              <span>·</span>
              <span className="truncate">{resource.region}</span>
            </p>
          </div>
        </div>
        <Badge
          variant={statusVariant(resource.status)}
          className="flex items-center gap-1.5 text-[9.5px] uppercase font-bold tracking-wider rounded-full px-2.5 py-0.5 shrink-0"
        >
          {statusDot(resource.status)}
          {resource.status}
        </Badge>
      </div>

      {/* Metrics Row 1: CPU & Memory Capsules */}
      <div className="grid grid-cols-2 gap-2.5 pt-0.5">
        {/* CPU Capsule */}
        <div className="p-2.5 rounded-2xl bg-muted/25 dark:bg-zinc-950/40 border border-border/40 transition-colors group-hover:border-border/60">
          <div className="flex items-center justify-between text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1">
            <span>CPU</span>
            <span className="font-mono text-[9px] text-muted-foreground/70 bg-muted/60 px-1.5 py-0.2 rounded-full">
              {thresholds.cpu}% limit
            </span>
          </div>
          <p
            className={`text-base font-bold tabular-nums tracking-tight ${
              isCpuHigh ? "text-rose-500" : "text-foreground"
            }`}
          >
            {resource.cpuUsage}
            <span className="text-xs font-normal text-muted-foreground">%</span>
          </p>
          <Progress
            value={resource.cpuUsage}
            className={`mt-1.5 h-1.5 rounded-full ${isCpuHigh ? "[&>div]:bg-rose-500" : "[&>div]:bg-primary"}`}
          />
        </div>

        {/* Memory Capsule */}
        <div className="p-2.5 rounded-2xl bg-muted/25 dark:bg-zinc-950/40 border border-border/40 transition-colors group-hover:border-border/60">
          <div className="flex items-center justify-between text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1">
            <span>Memory</span>
            <span className="font-mono text-[9px] text-muted-foreground/70 bg-muted/60 px-1.5 py-0.2 rounded-full">
              {thresholds.memory}% limit
            </span>
          </div>
          <p
            className={`text-base font-bold tabular-nums tracking-tight ${
              isMemHigh ? "text-amber-500" : "text-foreground"
            }`}
          >
            {resource.memoryUsage}
            <span className="text-xs font-normal text-muted-foreground">%</span>
          </p>
          <Progress
            value={resource.memoryUsage}
            className={`mt-1.5 h-1.5 rounded-full ${isMemHigh ? "[&>div]:bg-amber-500" : "[&>div]:bg-primary"}`}
          />
        </div>
      </div>

      {/* Metrics Row 2: Storage & Network Load Strip */}
      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-muted/20 dark:bg-zinc-950/30 border border-border/40 text-[11px]">
        <div>
          <span className="text-[9.5px] uppercase font-semibold tracking-wider text-muted-foreground block">
            Storage Capacity
          </span>
          <p
            className={`font-semibold tabular-nums mt-0.5 ${
              isStorageHigh ? "text-rose-500" : "text-foreground"
            }`}
          >
            {resource.storageUsage ?? 35}%
            <span className="text-[10px] text-muted-foreground font-normal ml-1">
              used
            </span>
          </p>
        </div>

        <div>
          <span className="text-[9.5px] uppercase font-semibold tracking-wider text-muted-foreground block">
            Throughput & Load
          </span>
          <p className="font-semibold tabular-nums text-foreground truncate mt-0.5">
            {resource.networkTraffic ?? 10} MB/s
            <span className="text-[10px] text-muted-foreground font-normal ml-1">
              · {resource.requestCount ?? 120} req/s
            </span>
          </p>
        </div>
      </div>
    </button>
  );
}

// ── Resource Grid Main Component ────────────────────────────────────────────

export function ResourceGrid() {
  const { resources, resourcesLoading, viewMode, setViewMode } = useDashboard();

  if (resourcesLoading) {
    return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="mb-3 h-8 w-full" />
                <Skeleton className="mb-2 h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* View Switcher and Add Resource Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            Monitored Cloud Resources
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({resources.length})
            </span>
          </h2>

          {/* View Mode Toggle: Grid vs Table */}
          <div className="flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all ${
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all ${
                viewMode === "table"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Tabular Monitoring View"
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>

        <AddResourceDialog />
      </div>

      {resources.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Server className="mx-auto h-10 w-10 text-muted-foreground/20" />
            <p className="mt-2 text-sm text-muted-foreground">No cloud resources provisioned yet</p>
            <p className="text-xs text-muted-foreground/60">
              Click &quot;Add Resource&quot; to begin monitoring your cloud infrastructure
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <ResourceTable />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {resources.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      )}
    </div>
  );
}
