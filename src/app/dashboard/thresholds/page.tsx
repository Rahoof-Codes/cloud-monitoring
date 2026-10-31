"use client";

// ---------------------------------------------------------------------------
// Thresholds Page — Usage Thresholds & Alarm Rule Configuration
// ---------------------------------------------------------------------------

import { useState } from "react";
import {
  Sliders,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  Activity,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useDashboard } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export default function ThresholdsPage() {
  const { thresholds, updateThresholds, resetThresholds, resources, dataMode } = useDashboard();

  // Local state for interactive editing before save
  const [cpu, setCpu] = useState<number>(thresholds.cpu);
  const [memory, setMemory] = useState<number>(thresholds.memory);
  const [storage, setStorage] = useState<number>(thresholds.storage);
  const [network, setNetwork] = useState<number>(thresholds.network);
  const [requests, setRequests] = useState<number>(thresholds.requestCount);
  const [consecutiveSamples, setConsecutiveSamples] = useState<number>(
    thresholds.consecutiveSamples
  );

  const handleSave = () => {
    updateThresholds({
      cpu,
      memory,
      storage,
      network,
      requestCount: requests,
      consecutiveSamples,
    });
    toast.success("Usage thresholds updated successfully", {
      description: "Alarm evaluation engine is now applying updated boundaries.",
    });
  };

  const handleReset = () => {
    resetThresholds();
    setCpu(80);
    setMemory(80);
    setStorage(85);
    setNetwork(60);
    setRequests(1200);
    setConsecutiveSamples(2);
    toast.info("Reset thresholds to default recommendations");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Usage Thresholds & Alarm Rules
            </h1>
            <Badge variant="outline" className="text-xs">
              Rule Engine Active
            </Badge>
            <Badge
              variant="secondary"
              className={`text-xs ${
                dataMode === "real-with-creds"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              }`}
            >
              {dataMode === "real-with-creds" ? "Live Cloud Rules" : "Simulated metrics (Demo)"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure metric warning limits and evaluation criteria to trigger automatic alarms and prevent performance degradation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-8 gap-1.5 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="h-8 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Threshold Rules</span>
          </Button>
        </div>
      </div>

      {/* Threshold Controls Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* CPU Threshold */}
        <Card className="shadow-sm border-border/70">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-500">
                  <Cpu className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-semibold">
                  CPU Utilization
                </CardTitle>
              </div>
              <span className="font-mono text-base font-bold text-foreground">
                {cpu}%
              </span>
            </div>
            <CardDescription className="text-[11px]">
              Alarms trigger when average CPU exceeds this ceiling.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="range"
              min={20}
              max={100}
              step={5}
              value={cpu}
              onChange={(e) => setCpu(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>20% (Conservative)</span>
              <span>100% (Critical)</span>
            </div>
          </CardContent>
        </Card>

        {/* Memory Threshold */}
        <Card className="shadow-sm border-border/70">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-500/10 text-purple-500">
                  <MemoryStick className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-semibold">
                  Memory Utilization
                </CardTitle>
              </div>
              <span className="font-mono text-base font-bold text-foreground">
                {memory}%
              </span>
            </div>
            <CardDescription className="text-[11px]">
              Alerts when memory allocation threatens OOM conditions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="range"
              min={30}
              max={100}
              step={5}
              value={memory}
              onChange={(e) => setMemory(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>30%</span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>

        {/* Storage Capacity Threshold */}
        <Card className="shadow-sm border-border/70">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
                  <HardDrive className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-semibold">
                  Storage Capacity
                </CardTitle>
              </div>
              <span className="font-mono text-base font-bold text-foreground">
                {storage}%
              </span>
            </div>
            <CardDescription className="text-[11px]">
              Flags disks and S3 buckets near volume quota limits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="range"
              min={40}
              max={100}
              step={5}
              value={storage}
              onChange={(e) => setStorage(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>40%</span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>

        {/* Network Throughput Threshold */}
        <Card className="shadow-sm border-border/70">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500/10 text-sky-500">
                  <Wifi className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-semibold">
                  Network Throughput
                </CardTitle>
              </div>
              <span className="font-mono text-base font-bold text-foreground">
                {network} MB/s
              </span>
            </div>
            <CardDescription className="text-[11px]">
              Triggers alarms during network egress/ingress bandwidth surges.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="range"
              min={10}
              max={200}
              step={5}
              value={network}
              onChange={(e) => setNetwork(Number(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>10 MB/s</span>
              <span>200 MB/s</span>
            </div>
          </CardContent>
        </Card>

        {/* Request Rate Threshold */}
        <Card className="shadow-sm border-border/70">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
                  <Activity className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-semibold">
                  Request Rate Limit
                </CardTitle>
              </div>
              <span className="font-mono text-base font-bold text-foreground">
                {requests} req/s
              </span>
            </div>
            <CardDescription className="text-[11px]">
              Detects API traffic floods and high-concurrency spikes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="range"
              min={100}
              max={5000}
              step={100}
              value={requests}
              onChange={(e) => setRequests(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>100 req/s</span>
              <span>5,000 req/s</span>
            </div>
          </CardContent>
        </Card>

        {/* Evaluation Window (Anti-Flapping) */}
        <Card className="shadow-sm border-border/70">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-500/10 text-rose-500">
                  <Sliders className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-semibold">
                  Evaluation Window
                </CardTitle>
              </div>
              <span className="font-mono text-base font-bold text-foreground">
                {consecutiveSamples} samples
              </span>
            </div>
            <CardDescription className="text-[11px]">
              Consecutive breach samples required before firing an alert.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={consecutiveSamples}
              onChange={(e) => setConsecutiveSamples(Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>1 (Instant)</span>
              <span>5 (High Dampening)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Fleet Threshold Compliance Matrix */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight">
                Live Fleet Threshold Compliance Matrix
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time evaluation of all active cloud resources against configured limits
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Normal
              </span>
              <span className="flex items-center gap-1.5 text-rose-500">
                <AlertTriangle className="h-3.5 w-3.5" /> Exceeded
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/40 text-muted-foreground bg-muted/20">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Resource Name</th>
                  <th className="px-4 py-2.5 font-medium">CPU vs Limit ({cpu}%)</th>
                  <th className="px-4 py-2.5 font-medium">Storage vs Limit ({storage}%)</th>
                  <th className="px-4 py-2.5 font-medium">Network vs Limit ({network} MB/s)</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {resources.map((res) => {
                  const isRunning = res.status === "running";
                  const cpuVal = res.cpuUsage ?? 0;
                  const storageVal = res.storageUsage ?? 0;
                  const netVal = res.networkTraffic ?? 0;

                  const isCpuBreach = isRunning && cpuVal >= cpu;
                  const isStorageBreach = isRunning && storageVal >= storage;
                  const isNetBreach = isRunning && netVal >= network;
                  const hasAnyBreach = isCpuBreach || isStorageBreach || isNetBreach;

                  return (
                    <tr key={res.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {res.name}
                        <span className="block text-[10px] text-muted-foreground font-mono">
                          {res.type} · {res.region}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1 w-36">
                          <div className="flex justify-between text-[10px]">
                            <span className={isCpuBreach ? "font-bold text-rose-500" : ""}>
                              {isRunning ? `${cpuVal}%` : "—"}
                            </span>
                            <span className="text-muted-foreground">Limit: {cpu}%</span>
                          </div>
                          <Progress
                            value={isRunning ? Math.min(100, (cpuVal / cpu) * 100) : 0}
                            className={`h-1.5 ${isCpuBreach ? "[&>div]:bg-rose-500" : ""}`}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1 w-36">
                          <div className="flex justify-between text-[10px]">
                            <span className={isStorageBreach ? "font-bold text-rose-500" : ""}>
                              {isRunning ? `${storageVal}%` : "—"}
                            </span>
                            <span className="text-muted-foreground">Limit: {storage}%</span>
                          </div>
                          <Progress
                            value={isRunning ? Math.min(100, (storageVal / storage) * 100) : 0}
                            className={`h-1.5 ${isStorageBreach ? "[&>div]:bg-rose-500" : ""}`}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1 w-36">
                          <div className="flex justify-between text-[10px]">
                            <span className={isNetBreach ? "font-bold text-rose-500" : ""}>
                              {isRunning ? `${netVal} MB/s` : "—"}
                            </span>
                            <span className="text-muted-foreground">Limit: {network} MB/s</span>
                          </div>
                          <Progress
                            value={isRunning ? Math.min(100, (netVal / network) * 100) : 0}
                            className={`h-1.5 ${isNetBreach ? "[&>div]:bg-rose-500" : ""}`}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {hasAnyBreach ? (
                          <Badge variant="destructive" className="text-[10px] gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Breaching
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3" />
                            Compliant
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
