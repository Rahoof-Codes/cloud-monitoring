"use client";

// ---------------------------------------------------------------------------
// Cloud Platform Monitoring Service Configuration Dialog
// ---------------------------------------------------------------------------
// Configures provider integration (AWS CloudWatch, GCP, Azure, Prometheus),
// collection intervals, enabled metric streams, and telemetry retention.
// ---------------------------------------------------------------------------

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Radio,
  Server,
  Cloud,
  CheckCircle2,
  Clock,
  Layers,
  Cpu,
  HardDrive,
  Wifi,
  Activity,
  MemoryStick,
  Check,
} from "lucide-react";
import { useDashboard, type MonitoringConfig, type CloudProvider } from "./dashboard-provider";

interface MonitoringConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROVIDERS: {
  id: CloudProvider;
  name: string;
  tagline: string;
  iconBg: string;
}[] = [
  {
    id: "AWS CloudWatch",
    name: "Amazon CloudWatch",
    tagline: "Native AWS Mumbai (ap-south-1) agent & CloudWatch Alarms",
    iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  {
    id: "GCP Cloud Monitoring",
    name: "Google Cloud Monitoring",
    tagline: "Compute Engine & Cloud Storage multi-metric telemetry",
    iconBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  {
    id: "Azure Monitor",
    name: "Azure Monitor & Metrics",
    tagline: "Azure Virtual Machines, Blob storage, & Application Insights",
    iconBg: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
  },
  {
    id: "Prometheus / OpenTelemetry",
    name: "Prometheus / OTel Agent",
    tagline: "Open-standard multi-cloud collector & metric scraping",
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
];

export function MonitoringConfigDialog({
  open,
  onOpenChange,
}: MonitoringConfigDialogProps) {
  const { monitoringConfig, updateMonitoringConfig, refreshMetrics } = useDashboard();
  const [form, setForm] = useState<MonitoringConfig>(monitoringConfig);

  useEffect(() => {
    if (open) {
      setForm(monitoringConfig);
    }
  }, [open, monitoringConfig]);

  const handleSave = () => {
    updateMonitoringConfig(form);
    refreshMetrics();
    onOpenChange(false);
  };

  const toggleMetric = (key: keyof MonitoringConfig["enabledMetrics"]) => {
    setForm({
      ...form,
      enabledMetrics: {
        ...form.enabledMetrics,
        [key]: !form.enabledMetrics[key],
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Configure Cloud Monitoring Service
              </DialogTitle>
              <DialogDescription className="text-xs">
                Select your cloud observability platform and configure metric collection frequencies.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Live Agent Status Card */}
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <div>
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                  Telemetry Agent Connected
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Streaming from AWS Mumbai (ap-south-1) · 24ms round-trip latency
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
              Active Sync
            </Badge>
          </div>

          {/* Cloud Platform Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-primary" />
              Cloud Monitoring Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PROVIDERS.map((prov) => {
                const isSelected = form.provider === prov.id;
                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => setForm({ ...form, provider: prov.id })}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? "border-primary bg-primary/[0.04] shadow-xs"
                        : "border-border/60 bg-card hover:border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                        {prov.name}
                      </span>
                      {isSelected && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                      {prov.tagline}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collection Interval */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Metric Collection Frequency
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { sec: 5, label: "5 seconds", sub: "Real-time" },
                { sec: 10, label: "10 seconds", sub: "Fast" },
                { sec: 30, label: "30 seconds", sub: "Standard" },
                { sec: 60, label: "60 seconds", sub: "Eco Mode" },
              ].map((opt) => (
                <button
                  key={opt.sec}
                  type="button"
                  onClick={() => setForm({ ...form, intervalSeconds: opt.sec })}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    form.intervalSeconds === opt.sec
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border/60 bg-card text-muted-foreground hover:border-border"
                  }`}
                >
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className="text-[10px] opacity-75">{opt.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Enabled Metric Streams */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Enabled Telemetry Metrics
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                onClick={() => toggleMetric("cpu")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/60 bg-card cursor-pointer hover:border-primary/40 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={form.enabledMetrics.cpu}
                  onChange={() => {}}
                  className="rounded border-input text-primary accent-primary"
                />
                <Cpu className="h-4 w-4 text-blue-500" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">CPU Utilization</p>
                  <p className="text-[10px] text-muted-foreground">vCPU load percentages</p>
                </div>
              </label>

              <label
                onClick={() => toggleMetric("memory")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/60 bg-card cursor-pointer hover:border-primary/40 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={form.enabledMetrics.memory}
                  onChange={() => {}}
                  className="rounded border-input text-primary accent-primary"
                />
                <MemoryStick className="h-4 w-4 text-violet-500" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">Memory Consumption</p>
                  <p className="text-[10px] text-muted-foreground">RAM allocated vs free</p>
                </div>
              </label>

              <label
                onClick={() => toggleMetric("storage")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/60 bg-card cursor-pointer hover:border-primary/40 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={form.enabledMetrics.storage}
                  onChange={() => {}}
                  className="rounded border-input text-primary accent-primary"
                />
                <HardDrive className="h-4 w-4 text-emerald-500" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">Storage Capacity</p>
                  <p className="text-[10px] text-muted-foreground">Volume & disk utilization</p>
                </div>
              </label>

              <label
                onClick={() => toggleMetric("network")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/60 bg-card cursor-pointer hover:border-primary/40 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={form.enabledMetrics.network}
                  onChange={() => {}}
                  className="rounded border-input text-primary accent-primary"
                />
                <Wifi className="h-4 w-4 text-amber-500" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">Network Bandwidth</p>
                  <p className="text-[10px] text-muted-foreground">Inbound/outbound MB/s</p>
                </div>
              </label>

              <label
                onClick={() => toggleMetric("requestCount")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/60 bg-card cursor-pointer hover:border-primary/40 transition-colors sm:col-span-2"
              >
                <input
                  type="checkbox"
                  checked={form.enabledMetrics.requestCount}
                  onChange={() => {}}
                  className="rounded border-input text-primary accent-primary"
                />
                <Activity className="h-4 w-4 text-rose-500" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">Request Counts / Rates</p>
                  <p className="text-[10px] text-muted-foreground">
                    HTTP ingress throughput and requests per second
                  </p>
                </div>
              </label>
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
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleSave}>
            Apply Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
