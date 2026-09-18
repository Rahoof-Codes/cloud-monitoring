// ---------------------------------------------------------------------------
// Data helpers — kept for chart generation and filtering logic
// ---------------------------------------------------------------------------
// The Resource type now lives in useResources.ts (backed by Firestore).
// This file provides chart-data generators and the "needs attention" filter.
// ---------------------------------------------------------------------------

import type { ResourceType, ResourceStatus, Resource } from "./useResources";

export type { ResourceType, ResourceStatus, Resource };
export { REGIONS, type Region } from "./useResources";

// ── Time-series mock data (CPU usage "last 24h") ───────────────────────────

export interface TimeSeriesPoint {
  time: string;
  avgCpu: number;
  peakCpu: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function generateCpuTimeSeries(): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const now = Date.now();
  for (let i = 24; i >= 0; i--) {
    const t = new Date(now - i * 60 * 60 * 1000);
    const hour = t.getHours();
    // Simulate a daily pattern: higher during "business hours"
    const base = hour >= 8 && hour <= 20 ? 55 : 25;
    const avgCpu = clamp(base + Math.round((Math.random() - 0.5) * 20), 5, 95);
    const peakCpu = clamp(avgCpu + Math.round(Math.random() * 20), avgCpu, 100);
    points.push({
      time: t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      avgCpu,
      peakCpu,
    });
  }
  return points;
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
