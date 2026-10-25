// ---------------------------------------------------------------------------
// Data helpers — telemetry snapshot generation, metrics history, and alerts
// ---------------------------------------------------------------------------

import type { ResourceType, ResourceSize, ResourceStatus, Resource } from "./useResources";

export type { ResourceType, ResourceSize, ResourceStatus, Resource };

export const REGIONS = [
  "ap-south-1",
  "us-east-1",
  "us-west-2",
  "eu-west-1",
  "ap-southeast-1",
] as const;
export type Region = (typeof REGIONS)[number];

// ── Threshold & Alert Configurations ───────────────────────────────────────

export interface ThresholdConfig {
  cpu: number; // % (default 80)
  memory: number; // % (default 80)
  storage: number; // % (default 85)
  network: number; // MB/s (default 60)
  requestCount: number; // req/s (default 1200)
  consecutiveSamples: number; // number of samples above threshold before firing (default 2)
  notificationsEnabled: boolean; // whether sonner/toast notifications are shown
}

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  cpu: 80,
  memory: 80,
  storage: 85,
  network: 60,
  requestCount: 1200,
  consecutiveSamples: 2,
  notificationsEnabled: true,
};

// ── Cloud Monitoring Service Configuration ─────────────────────────────────

export type CloudProvider =
  | "AWS CloudWatch"
  | "GCP Cloud Monitoring"
  | "Azure Monitor"
  | "Prometheus / OpenTelemetry";

export interface MonitoringConfig {
  provider: CloudProvider;
  intervalSeconds: number; // 5, 10, 30, 60
  enabledMetrics: {
    cpu: boolean;
    memory: boolean;
    storage: boolean;
    network: boolean;
    requestCount: boolean;
  };
  retentionWindow: string; // "1h", "6h", "24h", "7d"
  agentStatus: "active" | "paused" | "connecting";
  lastSyncTime: string;
}

export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  provider: "AWS CloudWatch",
  intervalSeconds: 5,
  enabledMetrics: {
    cpu: true,
    memory: true,
    storage: true,
    network: true,
    requestCount: true,
  },
  retentionWindow: "24h",
  agentStatus: "active",
  lastSyncTime: new Date().toISOString(),
};

// ── Time-series data (derived from live resources) ─────────────────────────

export interface TimeSeriesPoint {
  time: string;
  avgCpu: number;
  peakCpu: number;
  avgMemory: number;
  peakMemory: number;
  avgStorage: number;
  peakStorage: number;
  avgNetwork: number;
  peakNetwork: number;
  avgRequests: number;
  peakRequests: number;
  /** Whether any metric in this sample exceeds the anomaly threshold */
  anomaly: boolean;
}

/**
 * Build a single multi-metric time-series data point from current running resources.
 * Returns null when there are no running resources.
 */
export function buildSnapshotFromResources(
  resources: Resource[],
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS
): TimeSeriesPoint | null {
  const running = resources.filter((r) => r.status === "running");
  if (running.length === 0) return null;

  const count = running.length;

  const avgCpu = Math.round(running.reduce((sum, r) => sum + r.cpuUsage, 0) / count);
  const peakCpu = Math.max(...running.map((r) => r.cpuUsage));

  const avgMemory = Math.round(running.reduce((sum, r) => sum + r.memoryUsage, 0) / count);
  const peakMemory = Math.max(...running.map((r) => r.memoryUsage));

  const avgStorage = Math.round(
    running.reduce((sum, r) => sum + (r.storageUsage ?? 35), 0) / count
  );
  const peakStorage = Math.max(...running.map((r) => r.storageUsage ?? 35));

  const avgNetwork = Number(
    (running.reduce((sum, r) => sum + (r.networkTraffic ?? 5), 0) / count).toFixed(1)
  );
  const peakNetwork = Math.max(...running.map((r) => r.networkTraffic ?? 5));

  const avgRequests = Math.round(
    running.reduce((sum, r) => sum + (r.requestCount ?? 100), 0) / count
  );
  const peakRequests = Math.max(...running.map((r) => r.requestCount ?? 100));

  const anomaly =
    avgCpu > thresholds.cpu ||
    peakCpu > thresholds.cpu ||
    avgStorage > thresholds.storage ||
    avgNetwork > thresholds.network ||
    avgRequests > thresholds.requestCount;

  const now = new Date();
  return {
    time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    avgCpu,
    peakCpu,
    avgMemory,
    peakMemory,
    avgStorage,
    peakStorage,
    avgNetwork,
    peakNetwork,
    avgRequests,
    peakRequests,
    anomaly,
  };
}

// Backwards compatibility alias
export const buildCpuSnapshotFromResources = buildSnapshotFromResources;

// ── Anomaly / Alert detection ──────────────────────────────────────────────

export type AlertMetric = "CPU" | "Memory" | "Storage" | "Network" | "Requests";
export type AlertSeverity = "critical" | "warning" | "info";
export type AlertStatus = "active" | "acknowledged" | "resolved";

export interface Alert {
  id: string;
  resourceId?: string;
  resourceName: string;
  resourceType: ResourceType;
  metric: AlertMetric;
  value: number;
  threshold: number;
  unit: string;
  severity: AlertSeverity;
  status: AlertStatus;
  time: string;
  timestampMs?: number;
  reason: string;
}

/** Per-resource metric history: resourceId -> array of samples */
export interface MetricSample {
  cpu: number;
  mem: number;
  storage: number;
  network: number;
  requests: number;
}
export type MetricHistory = Map<string, MetricSample[]>;

/**
 * Push latest metrics into history map and detect threshold alerts against user-configured limits.
 */
export function detectAnomalies(
  resources: Resource[],
  history: MetricHistory,
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS
): Alert[] {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const timestampMs = now.getTime();

  const alerts: Alert[] = [];
  const reqSamples = Math.max(1, thresholds.consecutiveSamples);

  for (const r of resources) {
    if (r.status === "stopped" || r.status === "error") {
      history.delete(r.id);
      continue;
    }

    const samples = history.get(r.id) ?? [];
    samples.push({
      cpu: r.cpuUsage,
      mem: r.memoryUsage,
      storage: r.storageUsage ?? 35,
      network: r.networkTraffic ?? 10,
      requests: r.requestCount ?? 120,
    });
    // Retain only last 12 samples
    if (samples.length > 12) samples.shift();
    history.set(r.id, samples);

    if (samples.length >= reqSamples) {
      const tail = samples.slice(-reqSamples);

      // 1. CPU Threshold Check
      if (tail.every((s) => s.cpu > thresholds.cpu)) {
        const isCritical = r.cpuUsage >= 90;
        alerts.push({
          id: `${r.id}-cpu`,
          resourceId: r.id,
          resourceName: r.name,
          resourceType: r.type,
          metric: "CPU",
          value: r.cpuUsage,
          threshold: thresholds.cpu,
          unit: "%",
          severity: isCritical ? "critical" : "warning",
          status: "active",
          time: timeStr,
          timestampMs,
          reason: `CPU utilization sustained at ${r.cpuUsage}% (exceeds ${thresholds.cpu}% threshold for ${reqSamples}+ intervals)`,
        });
      }

      // 2. Memory Threshold Check
      if (tail.every((s) => s.mem > thresholds.memory)) {
        const isCritical = r.memoryUsage >= 90;
        alerts.push({
          id: `${r.id}-mem`,
          resourceId: r.id,
          resourceName: r.name,
          resourceType: r.type,
          metric: "Memory",
          value: r.memoryUsage,
          threshold: thresholds.memory,
          unit: "%",
          severity: isCritical ? "critical" : "warning",
          status: "active",
          time: timeStr,
          timestampMs,
          reason: `Memory consumption reached ${r.memoryUsage}% (exceeds ${thresholds.memory}% threshold for ${reqSamples}+ intervals)`,
        });
      }

      // 3. Storage Capacity Threshold Check
      const storageVal = r.storageUsage ?? 35;
      if (tail.every((s) => s.storage > thresholds.storage)) {
        alerts.push({
          id: `${r.id}-storage`,
          resourceId: r.id,
          resourceName: r.name,
          resourceType: r.type,
          metric: "Storage",
          value: storageVal,
          threshold: thresholds.storage,
          unit: "%",
          severity: storageVal >= 92 ? "critical" : "warning",
          status: "active",
          time: timeStr,
          timestampMs,
          reason: `Disk / volume storage capacity is at ${storageVal}% (exceeds ${thresholds.storage}% threshold)`,
        });
      }

      // 4. Network Bandwidth Threshold Check
      const netVal = r.networkTraffic ?? 10;
      if (tail.every((s) => s.network > thresholds.network)) {
        alerts.push({
          id: `${r.id}-network`,
          resourceId: r.id,
          resourceName: r.name,
          resourceType: r.type,
          metric: "Network",
          value: netVal,
          threshold: thresholds.network,
          unit: "MB/s",
          severity: netVal >= thresholds.network * 1.5 ? "critical" : "warning",
          status: "active",
          time: timeStr,
          timestampMs,
          reason: `Network traffic throughput surge at ${netVal} MB/s (exceeds ${thresholds.network} MB/s threshold)`,
        });
      }

      // 5. Request Count Threshold Check
      const reqVal = r.requestCount ?? 120;
      if (tail.every((s) => s.requests > thresholds.requestCount)) {
        alerts.push({
          id: `${r.id}-requests`,
          resourceId: r.id,
          resourceName: r.name,
          resourceType: r.type,
          metric: "Requests",
          value: reqVal,
          threshold: thresholds.requestCount,
          unit: "req/s",
          severity: reqVal >= thresholds.requestCount * 1.5 ? "critical" : "warning",
          status: "active",
          time: timeStr,
          timestampMs,
          reason: `Incoming request rate flood at ${reqVal} req/s (exceeds ${thresholds.requestCount} req/s threshold)`,
        });
      }
    }
  }

  // Clean up history for removed resources
  for (const id of history.keys()) {
    if (!resources.some((r) => r.id === id)) {
      history.delete(id);
    }
  }

  return alerts;
}

// ── Distribution data ──────────────────────────────────────────────────────

export interface DistributionSlice {
  name: ResourceType;
  value: number;
  fill: string;
}

export function getResourceDistribution(resources: Resource[]): DistributionSlice[] {
  const counts: Record<ResourceType, number> = {
    VM: 0,
    Database: 0,
    Network: 0,
    Storage: 0,
    Serverless: 0,
  };
  resources.forEach((r) => {
    if (counts[r.type] !== undefined) {
      counts[r.type]++;
    } else {
      counts.VM++;
    }
  });

  const fills: Record<ResourceType, string> = {
    VM: "hsl(210, 85%, 55%)",
    Database: "hsl(280, 65%, 55%)",
    Network: "hsl(35, 85%, 55%)",
    Storage: "hsl(160, 75%, 45%)",
    Serverless: "hsl(330, 80%, 55%)",
  };

  return (Object.keys(counts) as ResourceType[]).map((name) => ({
    name,
    value: counts[name],
    fill: fills[name],
  }));
}

// ── "Needs Attention" filter ───────────────────────────────────────────────

export function getAbnormalResources(
  resources: Resource[],
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS
): Resource[] {
  return resources.filter(
    (r) =>
      r.cpuUsage > thresholds.cpu ||
      r.memoryUsage > thresholds.memory ||
      (r.storageUsage ?? 0) > thresholds.storage ||
      (r.networkTraffic ?? 0) > thresholds.network ||
      (r.requestCount ?? 0) > thresholds.requestCount ||
      r.status === "warning" ||
      r.status === "error"
  );
}
