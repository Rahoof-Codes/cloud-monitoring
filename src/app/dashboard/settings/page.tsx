"use client";

// ---------------------------------------------------------------------------
// Settings Page — Cloud Monitoring Service & Ingestion Engine Configuration
// ---------------------------------------------------------------------------

import { useState } from "react";
import {
  Settings,
  Activity,
  Cloud,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Key,
  Globe,
  Save,
  RotateCcw,
} from "lucide-react";
import { useDashboard } from "@/components/dashboard";
import type { CloudProvider } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function SettingsPage() {
  const { monitoringConfig, updateMonitoringConfig, dataMode, connectedProviders } = useDashboard();

  // Local settings state
  const [provider, setProvider] = useState<CloudProvider>(monitoringConfig.provider);
  const [interval, setInterval] = useState<number>(monitoringConfig.intervalSeconds);
  const [collectCpu, setCollectCpu] = useState<boolean>(
    monitoringConfig.enabledMetrics?.cpu ?? true
  );
  const [collectMemory, setCollectMemory] = useState<boolean>(
    monitoringConfig.enabledMetrics?.memory ?? true
  );
  const [collectStorage, setCollectStorage] = useState<boolean>(
    monitoringConfig.enabledMetrics?.storage ?? true
  );
  const [collectNetwork, setCollectNetwork] = useState<boolean>(
    monitoringConfig.enabledMetrics?.network ?? true
  );
  const [collectRequests, setCollectRequests] = useState<boolean>(
    monitoringConfig.enabledMetrics?.requestCount ?? true
  );

  const [region, setRegion] = useState<string>("ap-south-1");
  const [accessKey, setAccessKey] = useState<string>("AKIA" + "PROD" + "DEMO" + "7891");

  const handleSave = () => {
    updateMonitoringConfig({
      provider,
      intervalSeconds: interval,
      enabledMetrics: {
        cpu: collectCpu,
        memory: collectMemory,
        storage: collectStorage,
        network: collectNetwork,
        requestCount: collectRequests,
      },
    });
    toast.success("Monitoring settings saved", {
      description: `Telemetry stream synced with ${provider} at ${interval}s interval.`,
    });
  };

  const handleReset = () => {
    setProvider("AWS CloudWatch");
    setInterval(30);
    setCollectCpu(true);
    setCollectMemory(true);
    setCollectStorage(true);
    setCollectNetwork(true);
    setCollectRequests(true);
    toast.info("Reset monitoring settings to default configuration");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Monitoring Service Settings
            </h1>
            <Badge variant="outline" className="text-xs">
              {provider}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure telemetry source ingestion, polling intervals, enabled metric streams, and cloud credentials.
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
            <span>Save Configuration</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Cloud Provider Selection */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold tracking-tight">
                    Cloud Monitoring Provider
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Select the telemetry ingestion engine used to gather fleet metrics
                  </CardDescription>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-[10px] ${
                    dataMode === "real-with-creds"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {dataMode === "real-with-creds"
                    ? `Active (${connectedProviders.map((p) => p.label || p.provider.toUpperCase()).join(", ") || "Cloud Connected"})`
                    : "simulated integration"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {[
                {
                  id: "AWS CloudWatch" as CloudProvider,
                  name: "Amazon CloudWatch",
                  desc: "Native AWS metrics, GetMetricData batch API, and CloudWatch Alarms",
                  badge: "AWS Native",
                },
                {
                  id: "GCP Cloud Monitoring" as CloudProvider,
                  name: "Google Cloud Monitoring",
                  desc: "GCP Stackdriver telemetry, Compute Engine time-series metrics",
                  badge: "GCP",
                },
                {
                  id: "Azure Monitor" as CloudProvider,
                  name: "Microsoft Azure Monitor",
                  desc: "Azure Virtual Machines & storage account telemetry sink",
                  badge: "Azure",
                },
                {
                  id: "Prometheus / OpenTelemetry" as CloudProvider,
                  name: "Prometheus & OpenTelemetry",
                  desc: "Self-hosted high-resolution scrape targets and pull telemetry",
                  badge: "Open Source",
                },
              ].map((p) => {
                const isSelected = provider === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setProvider(p.id)}
                    className={`flex items-start justify-between p-3.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/10 shadow-sm"
                        : "border-border/60 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-md shrink-0 ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Cloud className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {p.name}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {p.badge}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.desc}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0" />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Metric Telemetry Toggles */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold tracking-tight">
                Active Telemetry Streams
              </CardTitle>
              <CardDescription className="text-xs">
                Toggle individual metrics to ingest from the cloud monitoring service
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 divide-y divide-border/30">
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-xs font-semibold text-foreground">CPU Utilization (%)</p>
                  <p className="text-[11px] text-muted-foreground">Processor execution time across instances</p>
                </div>
                <input
                  type="checkbox"
                  checked={collectCpu}
                  onChange={(e) => setCollectCpu(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-xs font-semibold text-foreground">Memory Utilization (%)</p>
                  <p className="text-[11px] text-muted-foreground">RAM allocation and cache residency</p>
                </div>
                <input
                  type="checkbox"
                  checked={collectMemory}
                  onChange={(e) => setCollectMemory(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-xs font-semibold text-foreground">Storage Capacity (%)</p>
                  <p className="text-[11px] text-muted-foreground">Disk volume and S3 bucket capacity utilization</p>
                </div>
                <input
                  type="checkbox"
                  checked={collectStorage}
                  onChange={(e) => setCollectStorage(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-xs font-semibold text-foreground">Network Throughput (MB/s)</p>
                  <p className="text-[11px] text-muted-foreground">Combined ingress and egress network bandwidth</p>
                </div>
                <input
                  type="checkbox"
                  checked={collectNetwork}
                  onChange={(e) => setCollectNetwork(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-xs font-semibold text-foreground">Request Count (req/s)</p>
                  <p className="text-[11px] text-muted-foreground">HTTP request volume delivered to endpoints</p>
                </div>
                <input
                  type="checkbox"
                  checked={collectRequests}
                  onChange={(e) => setCollectRequests(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-blue-600 cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Polling & Credentials */}
        <div className="space-y-5">
          {/* Polling Interval */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold tracking-tight">
                Collection Interval
              </CardTitle>
              <CardDescription className="text-xs">
                Frequency at which telemetry is pulled from the provider
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <Select
                value={String(interval)}
                onValueChange={(val) => {
                  if (val) setInterval(Number(val));
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5" className="text-xs">
                    5 seconds (High-Resolution Streaming)
                  </SelectItem>
                  <SelectItem value="10" className="text-xs">
                    10 seconds (Active Diagnostic)
                  </SelectItem>
                  <SelectItem value="30" className="text-xs">
                    30 seconds (Default · Standard)
                  </SelectItem>
                  <SelectItem value="60" className="text-xs">
                    60 seconds (Cost Optimized)
                  </SelectItem>
                  <SelectItem value="0" className="text-xs">
                    Paused (Manual Refresh Only)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Higher frequencies provide lower-latency alert triggers.
              </p>
            </CardContent>
          </Card>

          {/* Cloud Region & IAM Credentials */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold tracking-tight">
                Provider Connection
              </CardTitle>
              <CardDescription className="text-xs">
                {dataMode === "real-with-creds"
                  ? "Live cloud credentials and regional endpoint"
                  : "API credentials and regional endpoint"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-xs flex items-center gap-1.5 font-medium text-foreground">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  Primary Region
                </label>
                <Select
                  value={region}
                  onValueChange={(val) => {
                    if (val) setRegion(val);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ap-south-1" className="text-xs">
                      ap-south-1 (Mumbai)
                    </SelectItem>
                    <SelectItem value="us-east-1" className="text-xs">
                      us-east-1 (N. Virginia)
                    </SelectItem>
                    <SelectItem value="eu-west-1" className="text-xs">
                      eu-west-1 (Ireland)
                    </SelectItem>
                    <SelectItem value="ap-southeast-1" className="text-xs">
                      ap-southeast-1 (Singapore)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs flex items-center gap-1.5 font-medium text-foreground">
                  <Key className="h-3 w-3 text-muted-foreground" />
                  Access Key ID
                </label>
                <input
                  type="text"
                  value={accessKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAccessKey(e.target.value)
                  }
                  className="w-full px-3 h-9 text-xs font-mono rounded-md border border-input bg-background text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs flex items-center gap-1.5 font-medium text-foreground">
                  <ShieldCheck className="h-3 w-3 text-muted-foreground" />
                  Telemetry Permission Scope
                </label>
                <div className="rounded-md border border-border/60 bg-muted/30 p-2 text-[11px] font-mono text-muted-foreground">
                  cloudwatch:GetMetricData<br />
                  cloudwatch:ListMetrics<br />
                  cloudwatch:PutMetricAlarm
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
