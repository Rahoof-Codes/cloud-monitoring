"use client";

// ---------------------------------------------------------------------------
// Controlled Threshold Alert Test Dialog
// ---------------------------------------------------------------------------
// Demonstrates live threshold alert detection, toast notification, and chart
// anomaly markers by injecting controlled spikes or resetting baselines.
// ---------------------------------------------------------------------------

import { useState } from "react";
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
  Zap,
  RotateCcw,
  Cpu,
  Wifi,
  HardDrive,
  Activity,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useDashboard } from "./dashboard-provider";

interface ControlledTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ControlledTestDialog({
  open,
  onOpenChange,
}: ControlledTestDialogProps) {
  const { simulateStressTest, thresholds, resources } = useDashboard();
  const [activeTest, setActiveTest] = useState<string | null>(null);

  const runningResource = resources.find((r) => r.status === "running") || resources[0];

  const handleTest = async (
    type: "cpu" | "storage" | "network" | "requests" | "reset"
  ) => {
    setActiveTest(type);
    await simulateStressTest(type);
    setTimeout(() => {
      setActiveTest(null);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Controlled Threshold Alert Demonstration
              </DialogTitle>
              <DialogDescription className="text-xs">
                Inject controlled metric spikes to verify live threshold alerts and real-time observability.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Target Resource Banner */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Activity className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">
                  Target: {runningResource ? runningResource.name : "Active Cloud Resource"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {runningResource ? `${runningResource.type} · ${runningResource.region} · Current CPU: ${runningResource.cpuUsage}%` : "No instance found"}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase">
              {runningResource?.status || "Ready"}
            </Badge>
          </div>

          {/* Test Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* CPU Spike */}
            <button
              type="button"
              onClick={() => handleTest("cpu")}
              className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                activeTest === "cpu"
                  ? "border-rose-500 bg-rose-500/10"
                  : "border-border/60 bg-card hover:border-rose-500/40 hover:shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <Cpu className="h-4 w-4 text-blue-500" />
                  Trigger CPU Spike
                </span>
                <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[10px]">
                  95% CPU
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Exceeds configured threshold ({thresholds.cpu}%). Fires alert notification and chart anomaly marker.
              </p>
            </button>

            {/* Storage Warning */}
            <button
              type="button"
              onClick={() => handleTest("storage")}
              className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                activeTest === "storage"
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border/60 bg-card hover:border-emerald-500/40 hover:shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <HardDrive className="h-4 w-4 text-emerald-500" />
                  Trigger Storage Warning
                </span>
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                  94% Disk
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Exceeds storage threshold ({thresholds.storage}%). Triggers disk capacity exhaustion warning.
              </p>
            </button>

            {/* Network Bandwidth Surge */}
            <button
              type="button"
              onClick={() => handleTest("network")}
              className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                activeTest === "network"
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-border/60 bg-card hover:border-amber-500/40 hover:shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <Wifi className="h-4 w-4 text-amber-500" />
                  Network Bandwidth Surge
                </span>
                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]">
                  88.5 MB/s
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Exceeds bandwidth threshold ({thresholds.network} MB/s). Simulates an unthrottled ingress traffic burst.
              </p>
            </button>

            {/* Request Flood */}
            <button
              type="button"
              onClick={() => handleTest("requests")}
              className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                activeTest === "requests"
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-border/60 bg-card hover:border-purple-500/40 hover:shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-purple-500" />
                  Traffic Request Flood
                </span>
                <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px]">
                  2450 req/s
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Exceeds rate threshold ({thresholds.requestCount} req/s). Demonstrates DDoS/high-load alerting.
              </p>
            </button>
          </div>

          {/* Reset Baseline Action */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              <div>
                <p className="font-semibold text-xs text-blue-700 dark:text-blue-300">
                  Restore Healthy Baseline
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Returns all resource metrics back to normal baseline (35% CPU, 12 MB/s).
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleTest("reset")}
              className="gap-1.5 text-xs border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Fleet
            </Button>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
