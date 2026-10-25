"use client";

// ---------------------------------------------------------------------------
// In-App Documentation & Metric Reference Dialog
// ---------------------------------------------------------------------------
// Provides technical documentation of monitored resources, metric definitions,
// threshold alerting rules, and architecture directly in the dashboard UI.
// ---------------------------------------------------------------------------

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Cpu,
  HardDrive,
  Wifi,
  Activity,
  MemoryStick,
  Server,
  Database,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface DocsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocsDialog({ open, onOpenChange }: DocsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Cloud Monitoring Documentation & Metric Definitions
              </DialogTitle>
              <DialogDescription className="text-xs">
                Comprehensive guide to monitored resources, metric formulas, and alert configuration.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2 text-xs text-foreground">
          {/* Section 1: Monitored Cloud Resources */}
          <div className="space-y-2.5">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2 border-b border-border/50 pb-1">
              <Server className="h-4 w-4 text-blue-500" />
              1. Monitored Cloud Resources
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-blue-500" />
                  Compute Instances (VM)
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Virtual machines (AWS EC2 / GCP Compute Engine). Monitored for vCPU utilization, memory allocation, and operational uptime.
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-violet-500" />
                  Managed Databases
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Managed relational & NoSQL clusters (PostgreSQL, MySQL, Redis). Monitored for query load, disk capacity, and connection counts.
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Wifi className="h-3.5 w-3.5 text-amber-500" />
                  Network & Load Balancers
                </span>
                <p className="text-[11px] text-muted-foreground">
                  L4/L7 Ingress Gateways & ALBs. Monitored for throughput bandwidth (MB/s), request routing, and latency spikes.
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5 text-emerald-500" />
                  Cloud Storage Buckets
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Object storage (S3 / GCS) & provisioned block storage volumes. Monitored for capacity utilization and read/write I/O.
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1 sm:col-span-2">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-rose-500" />
                  Serverless Functions
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Event-driven micro-functions (AWS Lambda / Google Cloud Functions). Monitored for invocations per second, concurrency, and cold-start latency.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Metric Definitions & Formulas */}
          <div className="space-y-2.5">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2 border-b border-border/50 pb-1">
              <Activity className="h-4 w-4 text-primary" />
              2. Metric Definitions & Measurement Standards
            </h3>
            <div className="space-y-2">
              <div className="rounded-xl border border-border/60 bg-card p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-blue-500" />
                    CPU Utilization (%)
                  </span>
                  <Badge variant="outline" className="text-[10px]">0 - 100%</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Percentage of allocated vCPU processing cycles actively consumed by user processes and operating system threads. Sampled at 5-second intervals.
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <MemoryStick className="h-3.5 w-3.5 text-violet-500" />
                    Memory Utilization (%)
                  </span>
                  <Badge variant="outline" className="text-[10px]">0 - 100%</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Total physical RAM in active use relative to total provisioned instance memory capacity. Prevents out-of-memory (OOM) fatal process kills.
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <HardDrive className="h-3.5 w-3.5 text-emerald-500" />
                    Storage Capacity (%)
                  </span>
                  <Badge variant="outline" className="text-[10px]">0 - 100%</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Percentage of disk partition or object bucket quota consumed. Includes uploaded file artifacts and provisioned local volumes.
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Wifi className="h-3.5 w-3.5 text-amber-500" />
                    Network Traffic (MB/s)
                  </span>
                  <Badge variant="outline" className="text-[10px]">Megabytes / sec</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Aggregated ingress (inbound) and egress (outbound) network bandwidth throughput transferred across virtual network interfaces.
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-rose-500" />
                    Request Counts (req/s)
                  </span>
                  <Badge variant="outline" className="text-[10px]">Requests / sec</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Frequency of HTTP/HTTPS requests processed per second through ingress gateways and application load balancers.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Threshold & Alert Rules */}
          <div className="space-y-2.5">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2 border-b border-border/50 pb-1">
              <Sliders className="h-4 w-4 text-amber-500" />
              3. Usage Thresholds & Alert Configuration
            </h3>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                The dashboard runs an automated detection engine evaluating each live metric against user-configured thresholds on every telemetry sample:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-muted-foreground pl-1">
                <li>
                  <strong className="text-foreground">Consecutive Sample Window:</strong> Prevents false alarms from transient spikes. An alert triggers only when a metric breaches the configured threshold for <code className="text-primary font-mono">N</code> consecutive intervals.
                </li>
                <li>
                  <strong className="text-foreground">Severity Classification:</strong> Alerts are designated as <span className="text-amber-500 font-semibold">Warning</span> when surpassing threshold, or <span className="text-rose-500 font-semibold">Critical</span> when reaching &gt;90% capacity or dangerous levels.
                </li>
                <li>
                  <strong className="text-foreground">Lifecycle States:</strong> Active &rarr; Acknowledged &rarr; Resolved.
                </li>
                <li>
                  <strong className="text-foreground">Controlled Test Demonstration:</strong> Use the &quot;Controlled Test&quot; action in the header to safely inject synthetic load spikes and observe real-time alert notifications and chart markers.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close Documentation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
