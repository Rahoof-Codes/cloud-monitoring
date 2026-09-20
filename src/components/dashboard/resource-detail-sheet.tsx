"use client";

// ---------------------------------------------------------------------------
// Resource Preview / Detail Side Sheet
// ---------------------------------------------------------------------------
// Features:
//   - Name, Type, Size, Status, Region
//   - Created Time, Live Uptime, Hourly Rate, Accrued Cost So Far
//   - Per-Resource CPU & Memory Telemetry Chart
//   - Per-Resource Alerts
//   - Fake API Credentials (masked by default, Reveal, Copy, Regenerate)
//   - "Sample credentials - not valid for any real service." notice
// ---------------------------------------------------------------------------

import { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Server,
  Database,
  Wifi,
  MapPin,
  Cpu,
  MemoryStick,
  Play,
  Square,
  Trash2,
  Clock,
  IndianRupee,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Layers,
  Calendar,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useDashboard, type ResourceType, type ResourceStatus } from "./dashboard-provider";
import { computeResourceTotalCost, formatDuration, toTimestampMs } from "@/lib/billing";
import { PRICING_TIERS } from "@/lib/pricing";
import { toast } from "sonner";

function typeIcon(type: ResourceType) {
  const cls = "h-5 w-5";
  switch (type) {
    case "VM":
      return <Server className={cls} />;
    case "Database":
      return <Database className={cls} />;
    case "Network":
      return <Wifi className={cls} />;
  }
}

function statusColor(s: ResourceStatus) {
  switch (s) {
    case "running":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "stopped":
      return "bg-zinc-500/15 text-zinc-500 border-zinc-500/30";
    case "warning":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "error":
      return "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30";
  }
}

export function ResourceDetailSheet() {
  const {
    selectedResource,
    setSelectedResource,
    toggleResourceStatus,
    deleteResource,
    regenerateCredentials,
    usageRecords,
    alerts,
    clockTick,
  } = useDashboard();

  const r = selectedResource;

  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Credentials visibility state
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [copiedField, setCopiedField] = useState<"ak" | "sk" | null>(null);

  // Alerts for this specific resource
  const resourceAlerts = useMemo(() => {
    if (!r) return [];
    return alerts.filter((a) => a.resourceName === r.name);
  }, [r, alerts]);

  // Total cost so far for this resource from usage subcollection
  const costSoFar = useMemo(() => {
    if (!r) return 0;
    return computeResourceTotalCost(r.id, usageRecords, new Date(clockTick));
  }, [r, usageRecords, clockTick]);

  // Created time string
  const createdTimeString = useMemo(() => {
    if (!r?.createdAt) return "Unknown";
    const ms = toTimestampMs(r.createdAt);
    return new Date(ms).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [r?.createdAt]);

  // Uptime calculation
  const uptimeString = useMemo(() => {
    if (!r?.createdAt) return "—";
    if (r.status === "stopped") return "Stopped (0s active)";
    const ms = toTimestampMs(r.createdAt);
    const elapsedSeconds = Math.max(0, (clockTick - ms) / 1000);
    return formatDuration(elapsedSeconds);
  }, [r?.createdAt, r?.status, clockTick]);

  // Synthetic telemetry history points for this resource's chart
  const resourceChartData = useMemo(() => {
    if (!r) return [];
    const points = [];
    const baseCpu = r.cpuUsage;
    const baseMem = r.memoryUsage;
    for (let i = 8; i >= 0; i--) {
      const deltaCpu = (Math.sin(i + (r.name.length % 5)) * 12) + (Math.random() - 0.5) * 6;
      const deltaMem = (Math.cos(i + (r.name.length % 5)) * 8) + (Math.random() - 0.5) * 4;
      const isLatest = i === 0;
      points.push({
        sample: isLatest ? "Now" : `-${i * 5}m`,
        cpu: isLatest ? baseCpu : Math.max(0, Math.min(100, Math.round(baseCpu + deltaCpu))),
        mem: isLatest ? baseMem : Math.max(0, Math.min(100, Math.round(baseMem + deltaMem))),
      });
    }
    return points;
  }, [r?.id, r?.cpuUsage, r?.memoryUsage]);

  const handleToggle = async () => {
    if (!r) return;
    setIsToggling(true);
    await toggleResourceStatus(r.id, r.status);
    setIsToggling(false);
  };

  const handleDelete = async () => {
    if (!r) return;
    setIsDeleting(true);
    await deleteResource(r.id);
    setIsDeleting(false);
    setShowDelete(false);
    setSelectedResource(null);
  };

  const handleRegenerate = async () => {
    if (!r) return;
    setIsRegenerating(true);
    await regenerateCredentials(r.id);
    setIsRegenerating(false);
  };

  const handleCopy = (text: string, field: "ak" | "sk") => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(field === "ak" ? "Access Key copied" : "Secret Key copied");
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const maskString = (str: string, prefixLen: number = 7) => {
    if (!str) return "••••••••••••••••••••";
    const prefix = str.slice(0, prefixLen);
    return `${prefix}${"•".repeat(Math.max(16, str.length - prefixLen))}`;
  };

  return (
    <>
      <Sheet
        open={!!r}
        onOpenChange={(open) => !open && setSelectedResource(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {r && (
            <>
              {/* Header */}
              <SheetHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    {typeIcon(r.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="text-base truncate">{r.name}</SheetTitle>
                    <SheetDescription className="text-xs flex items-center gap-2 mt-0.5">
                      <span>{r.type}</span>
                      <span>·</span>
                      <span className="capitalize font-medium text-foreground/80">
                        {r.size || "small"}
                      </span>
                      <span>·</span>
                      <span className="font-mono text-muted-foreground">
                        {r.id.slice(0, 10)}…
                      </span>
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-5 text-xs">
                {/* Status, Region & Tier Specs */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 p-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`${statusColor(r.status)} border uppercase text-[10px] tracking-wider`}
                    >
                      {r.status}
                    </Badge>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {r.region}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground">
                    <Layers className="h-3 w-3 mr-1" />
                    {PRICING_TIERS[r.type]?.[r.size || "small"]?.label ?? r.size}
                  </Badge>
                </div>

                {/* Billing Stats & Rate Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/60 bg-card p-3 shadow-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <IndianRupee className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-[11px] font-medium">Hourly Rate</span>
                    </div>
                    <p className="mt-1 text-lg font-bold text-foreground tabular-nums">
                      ₹{r.hourlyRate.toFixed(2)}
                      <span className="text-xs font-normal text-muted-foreground">/hr</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      AWS Mumbai On-Demand
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card p-3 shadow-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-[11px] font-medium">Cost So Far</span>
                    </div>
                    <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      ₹{costSoFar.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      Uptime: {uptimeString}
                    </p>
                  </div>
                </div>

                {/* Timestamps & Meta */}
                <div className="rounded-xl border border-border/50 bg-muted/10 p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Created
                    </span>
                    <span className="font-medium text-foreground">{createdTimeString}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Uptime
                    </span>
                    <span className="font-medium text-foreground">{uptimeString}</span>
                  </div>
                </div>

                <Separator />

                {/* Alerts Section (if any for this resource) */}
                {resourceAlerts.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Active Resource Alerts ({resourceAlerts.length})</span>
                    </div>
                    {resourceAlerts.map((alt) => (
                      <div
                        key={alt.id}
                        className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-amber-700 dark:text-amber-300">
                            {alt.metric} Anomaly Spike: {alt.value}%
                          </span>
                          <span className="text-[10px] text-muted-foreground">{alt.time}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {alt.reason}
                        </p>
                      </div>
                    ))}
                    <Separator />
                  </div>
                )}

                {/* Resource CPU/Memory Telemetry Chart */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-blue-500" />
                      Telemetry History (CPU & Memory)
                    </span>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="flex items-center gap-1 text-blue-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> CPU: {r.cpuUsage}%
                      </span>
                      <span className="flex items-center gap-1 text-violet-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-500" /> Mem: {r.memoryUsage}%
                      </span>
                    </div>
                  </div>

                  <div className="h-[140px] w-full rounded-xl border border-border/60 bg-muted/15 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={resourceChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="detailCpuGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="detailMemGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(280, 60%, 55%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(280, 60%, 55%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 50% / 0.1)" />
                        <XAxis dataKey="sample" tick={{ fontSize: 9 }} stroke="hsl(0 0% 50% / 0.5)" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="hsl(0 0% 50% / 0.5)" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(0 0% 10%)",
                            border: "1px solid hsl(0 0% 20%)",
                            borderRadius: 6,
                            fontSize: 11,
                            color: "#fff",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="cpu"
                          stroke="hsl(210, 80%, 55%)"
                          fill="url(#detailCpuGrad)"
                          strokeWidth={1.5}
                          name="CPU"
                        />
                        <Area
                          type="monotone"
                          dataKey="mem"
                          stroke="hsl(280, 60%, 55%)"
                          fill="url(#detailMemGrad)"
                          strokeWidth={1.5}
                          name="Memory"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <Separator />

                {/* API Credentials Section */}
                <div className="space-y-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Key className="h-4 w-4 text-amber-500" />
                      <span>API Credentials</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRegenerate}
                      disabled={isRegenerating}
                      className="h-7 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className={`h-3 w-3 ${isRegenerating ? "animate-spin" : ""}`} />
                      <span>Regenerate</span>
                    </Button>
                  </div>

                  {/* Access Key */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Access Key</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setShowAccessKey(!showAccessKey)}
                          className="p-1 hover:text-foreground text-muted-foreground transition-colors"
                          title={showAccessKey ? "Mask" : "Reveal"}
                        >
                          {showAccessKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => handleCopy(r.apiCredentials?.accessKey || "", "ak")}
                          className="p-1 hover:text-foreground text-muted-foreground transition-colors"
                          title="Copy"
                        >
                          {copiedField === "ak" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                    <p className="font-mono text-xs rounded-lg border border-border/50 bg-muted/30 px-2.5 py-1.5 select-all break-all">
                      {showAccessKey ? r.apiCredentials?.accessKey : maskString(r.apiCredentials?.accessKey, 7)}
                    </p>
                  </div>

                  {/* Secret Key */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Secret Key</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setShowSecretKey(!showSecretKey)}
                          className="p-1 hover:text-foreground text-muted-foreground transition-colors"
                          title={showSecretKey ? "Mask" : "Reveal"}
                        >
                          {showSecretKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => handleCopy(r.apiCredentials?.secretKey || "", "sk")}
                          className="p-1 hover:text-foreground text-muted-foreground transition-colors"
                          title="Copy"
                        >
                          {copiedField === "sk" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                    <p className="font-mono text-xs rounded-lg border border-border/50 bg-muted/30 px-2.5 py-1.5 select-all break-all">
                      {showSecretKey ? r.apiCredentials?.secretKey : maskString(r.apiCredentials?.secretKey, 7)}
                    </p>
                  </div>

                  {/* Sample notice */}
                  <p className="text-[10px] text-muted-foreground/75 italic pt-0.5">
                    Sample credentials — not valid for any real service.
                  </p>
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Resource Controls
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant={r.status === "running" ? "outline" : "default"}
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={handleToggle}
                      disabled={isToggling || r.status === "error"}
                    >
                      {r.status === "running" ? (
                        <>
                          <Square className="h-3.5 w-3.5" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          Start
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setShowDelete(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete resource?</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">{r?.name}</span>.
              Usage history and accrued billing charges will be retained.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDelete(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
