// ---------------------------------------------------------------------------
// Data helpers — kept for chart generation and filtering logic
// ---------------------------------------------------------------------------
// The Resource type now lives in useResources.ts (backed by Firestore).
// This file provides chart-data generators and the "needs attention" filter.
// ---------------------------------------------------------------------------

import type { ResourceType, ResourceStatus, Resource } from "./useResources";

export type { ResourceType, ResourceStatus, Resource };
export { REGIONS, type Region } from "./useResources";

// ── Time-series data (derived from live resources) ─────────────────────────

export interface TimeSeriesPoint {
  time: string;
  avgCpu: number;
  peakCpu: number;
  /** Whether any metric in this sample exceeds the anomaly threshold */
  anomaly: boolean;
}

/**
 * Build a single time-series data point from the current live resources.
 * Returns null when there are no running resources.
 */
export function buildCpuSnapshotFromResources(
  resources: Resource[]
): TimeSeriesPoint | null {
  const running = resources.filter((r) => r.status === "running");
  if (running.length === 0) return null;

  const avgCpu = Math.round(
    running.reduce((sum, r) => sum + r.cpuUsage, 0) / running.length
  );
  const peakCpu = Math.max(...running.map((r) => r.cpuUsage));
  const anomaly = avgCpu > 80 || peakCpu > 80;

  const now = new Date();
  return {
    time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    avgCpu,
    peakCpu,
    anomaly,
  };
}

// ── Anomaly / Alert detection ──────────────────────────────────────────────

export interface Alert {
  id: string;
  resourceName: string;
  resourceType: ResourceType;
  metric: "CPU" | "Memory";
  value: number;
  time: string;
  reason: string;
}

/** Per-resource metric history: resourceId -> array of { cpu, mem } samples */
export type MetricHistory = Map<string, { cpu: number; mem: number }[]>;

const ANOMALY_THRESHOLD = 80;
const CONSECUTIVE_SAMPLES_REQUIRED = 3;

/**
 * Push the latest resource metrics into the history map and detect anomalies.
 * An anomaly fires when a metric stays above 80 % for 3+ consecutive samples.
 */
export function detectAnomalies(
  resources: Resource[],
  history: MetricHistory
): Alert[] {
  const now = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const alerts: Alert[] = [];

  for (const r of resources) {
    if (r.status === "stopped" || r.status === "error") {
      // Clear history for non-active resources
      history.delete(r.id);
      continue;
    }

    const samples = history.get(r.id) ?? [];
    samples.push({ cpu: r.cpuUsage, mem: r.memoryUsage });
    // Keep only last 10 samples
    if (samples.length > 10) samples.shift();
    history.set(r.id, samples);

    // Check CPU
    if (samples.length >= CONSECUTIVE_SAMPLES_REQUIRED) {
      const tail = samples.slice(-CONSECUTIVE_SAMPLES_REQUIRED);
      if (tail.every((s) => s.cpu > ANOMALY_THRESHOLD)) {
        alerts.push({
          id: `${r.id}-cpu`,
          resourceName: r.name,
          resourceType: r.type,
          metric: "CPU",
          value: r.cpuUsage,
          time: now,
          reason: `CPU above ${ANOMALY_THRESHOLD}% for ${CONSECUTIVE_SAMPLES_REQUIRED}+ consecutive samples`,
        });
      }
    }

    // Check Memory
    if (samples.length >= CONSECUTIVE_SAMPLES_REQUIRED) {
      const tail = samples.slice(-CONSECUTIVE_SAMPLES_REQUIRED);
      if (tail.every((s) => s.mem > ANOMALY_THRESHOLD)) {
        alerts.push({
          id: `${r.id}-mem`,
          resourceName: r.name,
          resourceType: r.type,
          metric: "Memory",
          value: r.memoryUsage,
          time: now,
          reason: `Memory above ${ANOMALY_THRESHOLD}% for ${CONSECUTIVE_SAMPLES_REQUIRED}+ consecutive samples`,
        });
      }
    }
  }

  // Clean up history for resources that no longer exist
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

export function getResourceDistribution(
  resources: Resource[]
): DistributionSlice[] {
  const counts: Record<ResourceType, number> = { VM: 0, Database: 0, Network: 0 };
  resources.forEach((r) => counts[r.type]++);
  const fills: Record<ResourceType, string> = {
    VM: "hsl(210, 80%, 55%)",
    Database: "hsl(280, 60%, 55%)",
    Network: "hsl(35, 85%, 55%)",
  };
  return (Object.keys(counts) as ResourceType[]).map((name) => ({
    name,
    value: counts[name],
    fill: fills[name],
  }));
}

// ── "Needs Attention" filter ───────────────────────────────────────────────

export function getAbnormalResources(resources: Resource[]): Resource[] {
  return resources.filter(
    (r) =>
      r.cpuUsage > 85 ||
      r.memoryUsage > 85 ||
      r.status === "warning" ||
      r.status === "error"
  );
}
