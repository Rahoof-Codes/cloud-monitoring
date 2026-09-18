"use client";

import { useState } from "react";
import {
  Plus,
  Server,
  Database,
  Wifi,
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
import { useDashboard, type Resource, type ResourceType, type ResourceStatus } from "./dashboard-provider";
import { REGIONS } from "@/lib/useResources";

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
  const [region, setRegion] = useState<string>(REGIONS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    await addResource({ name: name.trim(), type, region });
    setIsCreating(false);
    setOpen(false);
    setName("");
    setType("VM");
    setRegion(REGIONS[0]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Resource
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
          <DialogDescription>
            Create a new simulated cloud resource. CPU and memory values will be
            nudged automatically to simulate live telemetry.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. web-prod-api"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Type
            </label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as ResourceType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VM">VM</SelectItem>
                <SelectItem value="Database">Database</SelectItem>
                <SelectItem value="Network">Network</SelectItem>
              </SelectContent>
            </Select>
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
                    {r}
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
            {isCreating ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Resource Card ───────────────────────────────────────────────────────────

function ResourceCard({ resource }: { resource: Resource }) {
  const { setSelectedResource } = useDashboard();

  return (
    <button
      onClick={() => setSelectedResource(resource)}
      className="group flex w-full flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-md"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
            {typeIcon(resource.type)}
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">{resource.name}</p>
            <p className="text-xs text-muted-foreground">
              {resource.type} · {resource.region}
            </p>
          </div>
        </div>
        <Badge
          variant={statusVariant(resource.status)}
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide"
        >
          {statusDot(resource.status)}
          {resource.status}
        </Badge>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {/* CPU */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            CPU
          </p>
          <p
            className={`text-lg font-bold tabular-nums ${
              resource.cpuUsage > 85 ? "text-amber-500" : ""
            }`}
          >
            {resource.cpuUsage}
            <span className="text-xs font-normal text-muted-foreground">%</span>
          </p>
          <Progress value={resource.cpuUsage} className="mt-1 h-1" />
        </div>
        {/* Memory */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Memory
          </p>
          <p
            className={`text-lg font-bold tabular-nums ${
              resource.memoryUsage > 85 ? "text-amber-500" : ""
            }`}
          >
            {resource.memoryUsage}
            <span className="text-xs font-normal text-muted-foreground">%</span>
          </p>
          <Progress value={resource.memoryUsage} className="mt-1 h-1" />
        </div>
      </div>
    </button>
  );
}

// ── Resource Grid ───────────────────────────────────────────────────────────

export function ResourceGrid() {
  const { resources, resourcesLoading } = useDashboard();

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
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">
          All Resources
          <span className="ml-2 text-xs font-normal">({resources.length})</span>
        </h2>
        <AddResourceDialog />
      </div>

      {resources.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Server className="mx-auto h-10 w-10 text-muted-foreground/20" />
            <p className="mt-2 text-sm text-muted-foreground">
              No resources yet
            </p>
            <p className="text-xs text-muted-foreground/60">
              Click &quot;Add Resource&quot; to create your first cloud resource
            </p>
          </CardContent>
        </Card>
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
