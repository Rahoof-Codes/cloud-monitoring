"use client";

// ---------------------------------------------------------------------------
// Threshold Configuration Dialog
// ---------------------------------------------------------------------------
// Allows configuring usage thresholds for CPU, Memory, Storage, Network,
// and Request counts, plus consecutive sample requirements and alerts.
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
  Sliders,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  Activity,
  Bell,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { useDashboard, type ThresholdConfig } from "./dashboard-provider";

interface ThresholdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ThresholdDialog({ open, onOpenChange }: ThresholdDialogProps) {
  const { thresholds, updateThresholds, resetThresholds } = useDashboard();
  const [form, setForm] = useState<ThresholdConfig>(thresholds);

  useEffect(() => {
    if (open) {
      setForm(thresholds);
    }
  }, [open, thresholds]);

  const handleSave = () => {
    updateThresholds(form);
    onOpenChange(false);
  };

  const handleReset = () => {
    resetThresholds();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Usage Threshold & Alert Rules
              </DialogTitle>
              <DialogDescription className="text-xs">
                Configure metric thresholds for automated alerting and incident escalation.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* CPU Threshold */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Cpu className="h-4 w-4 text-blue-500" />
                CPU Utilization Threshold
              </span>
              <Badge variant="outline" className="font-mono text-xs font-bold text-blue-500">
                {form.cpu}%
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="40"
                max="95"
                step="5"
                value={form.cpu}
                onChange={(e) => setForm({ ...form, cpu: Number(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Trigger an alert when resource CPU utilization exceeds {form.cpu}%.
            </p>
          </div>

          {/* Memory Threshold */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <MemoryStick className="h-4 w-4 text-violet-500" />
                Memory Consumption Threshold
              </span>
              <Badge variant="outline" className="font-mono text-xs font-bold text-violet-500">
                {form.memory}%
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="40"
                max="95"
                step="5"
                value={form.memory}
                onChange={(e) => setForm({ ...form, memory: Number(e.target.value) })}
                className="w-full accent-violet-500 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Trigger an alert when resource RAM allocation exceeds {form.memory}%.
            </p>
          </div>

          {/* Storage Capacity Threshold */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <HardDrive className="h-4 w-4 text-emerald-500" />
                Storage Capacity Threshold
              </span>
              <Badge variant="outline" className="font-mono text-xs font-bold text-emerald-500">
                {form.storage}%
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="50"
                max="98"
                step="2"
                value={form.storage}
                onChange={(e) => setForm({ ...form, storage: Number(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Trigger a capacity alert when disk or volume reaches {form.storage}%.
            </p>
          </div>

          {/* Network Traffic Bandwidth */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Wifi className="h-4 w-4 text-amber-500" />
                Network Traffic Surge Threshold
              </span>
              <Badge variant="outline" className="font-mono text-xs font-bold text-amber-500">
                {form.network} MB/s
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="20"
                max="150"
                step="5"
                value={form.network}
                onChange={(e) => setForm({ ...form, network: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Alerts when ingress/egress network bandwidth exceeds {form.network} MB/s.
            </p>
          </div>

          {/* Request Count Rate */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Activity className="h-4 w-4 text-rose-500" />
                Request Count Rate Threshold
              </span>
              <Badge variant="outline" className="font-mono text-xs font-bold text-rose-500">
                {form.requestCount} req/s
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="400"
                max="3000"
                step="100"
                value={form.requestCount}
                onChange={(e) => setForm({ ...form, requestCount: Number(e.target.value) })}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Alerts when traffic rate reaches {form.requestCount} requests per second.
            </p>
          </div>

          {/* Consecutive Samples & Notification Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="rounded-xl border border-border/60 bg-card p-3 space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                Consecutive Samples Required
              </label>
              <select
                value={form.consecutiveSamples}
                onChange={(e) =>
                  setForm({ ...form, consecutiveSamples: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-medium outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={1}>1 sample (Immediate / Real-time)</option>
                <option value={2}>2 consecutive samples (Recommended)</option>
                <option value={3}>3 consecutive samples (Anti-flapping)</option>
                <option value={5}>5 consecutive samples (High stability)</option>
              </select>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-3 space-y-1.5 flex flex-col justify-between">
              <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Bell className="h-3.5 w-3.5 text-primary" />
                Toast Notifications
              </label>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-foreground font-medium">
                  {form.notificationsEnabled ? "Enabled" : "Disabled"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      notificationsEnabled: !form.notificationsEnabled,
                    })
                  }
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    form.notificationsEnabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                      form.notificationsEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t border-border/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1.5 text-xs text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Defaults
          </Button>
          <div className="flex items-center gap-2 sm:ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSave}>
              Save Thresholds
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
