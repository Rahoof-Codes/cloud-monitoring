// ---------------------------------------------------------------------------
// In-Memory Sample Demo Dataset
// ---------------------------------------------------------------------------
// For users testing the app in "Demo Mode" without signing into Firebase.
// Demo users NEVER read or write Firestore.
// ---------------------------------------------------------------------------

import { Resource, ResourceType, ResourceStatus, ResourceSize } from "./useResources";
import { UsageRecord } from "./billing";
import { UserFile } from "./useFiles";
import { TimeSeriesPoint, Alert } from "./data";
import { generateFakeCredentials } from "./credentials";
import { getHourlyRate } from "./pricing";

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000);

export const DEMO_RESOURCES: Resource[] = [
  {
    id: "demo-res-vm-spike",
    name: "prod-web-cluster-01",
    type: "VM",
    size: "medium",
    status: "warning",
    region: "ap-south-1",
    cpuUsage: 92,
    memoryUsage: 88,
    storageUsage: 64,
    networkTraffic: 42.5,
    requestCount: 1420,
    hourlyRate: getHourlyRate("VM", "medium"), // ₹3.40/hr
    apiCredentials: generateFakeCredentials(),
    createdAt: hoursAgo(48).toISOString(),
    lastUpdated: now.toISOString(),
  },
  {
    id: "demo-res-db-primary",
    name: "main-postgres-cluster",
    type: "Database",
    size: "medium",
    status: "running",
    region: "ap-south-1",
    cpuUsage: 45,
    memoryUsage: 62,
    storageUsage: 78,
    networkTraffic: 18.2,
    requestCount: 680,
    hourlyRate: getHourlyRate("Database", "medium"), // ₹6.00/hr
    apiCredentials: generateFakeCredentials(),
    createdAt: hoursAgo(72).toISOString(),
    lastUpdated: now.toISOString(),
  },
  {
    id: "demo-res-net-alb",
    name: "api-ingress-gateway",
    type: "Network",
    size: "small",
    status: "running",
    region: "ap-south-1",
    cpuUsage: 22,
    memoryUsage: 35,
    storageUsage: 12,
    networkTraffic: 68.4,
    requestCount: 2150,
    hourlyRate: getHourlyRate("Network", "small"), // ₹2.00/hr
    apiCredentials: generateFakeCredentials(),
    createdAt: hoursAgo(96).toISOString(),
    lastUpdated: now.toISOString(),
  },
  {
    id: "demo-res-storage-s3",
    name: "assets-media-bucket",
    type: "Storage",
    size: "medium",
    status: "running",
    region: "ap-south-1",
    cpuUsage: 15,
    memoryUsage: 28,
    storageUsage: 82,
    networkTraffic: 34.0,
    requestCount: 950,
    hourlyRate: getHourlyRate("Storage", "medium"), // ₹1.50/hr
    apiCredentials: generateFakeCredentials(),
    createdAt: hoursAgo(110).toISOString(),
    lastUpdated: now.toISOString(),
  },
  {
    id: "demo-res-lambda-fn",
    name: "image-resizer-worker",
    type: "Serverless",
    size: "small",
    status: "running",
    region: "ap-south-1",
    cpuUsage: 38,
    memoryUsage: 45,
    storageUsage: 10,
    networkTraffic: 8.5,
    requestCount: 420,
    hourlyRate: getHourlyRate("Serverless", "small"), // ₹0.30/hr
    apiCredentials: generateFakeCredentials(),
    createdAt: hoursAgo(60).toISOString(),
    lastUpdated: now.toISOString(),
  },
  {
    id: "demo-res-vm-worker",
    name: "nightly-backup-vm",
    type: "VM",
    size: "small",
    status: "stopped",
    region: "ap-south-1",
    cpuUsage: 0,
    memoryUsage: 0,
    storageUsage: 40,
    networkTraffic: 0,
    requestCount: 0,
    hourlyRate: getHourlyRate("VM", "small"), // ₹0.85/hr
    apiCredentials: generateFakeCredentials(),
    createdAt: hoursAgo(120).toISOString(),
    lastUpdated: hoursAgo(4).toISOString(),
  },
  {
    id: "demo-res-db-cache",
    name: "session-redis-cache",
    type: "Database",
    size: "small",
    status: "running",
    region: "ap-south-1",
    cpuUsage: 28,
    memoryUsage: 41,
    storageUsage: 30,
    networkTraffic: 14.8,
    requestCount: 890,
    hourlyRate: getHourlyRate("Database", "small"), // ₹1.50/hr
    apiCredentials: generateFakeCredentials(),
    createdAt: hoursAgo(36).toISOString(),
    lastUpdated: now.toISOString(),
  },
];

export const DEMO_USAGE_RECORDS: UsageRecord[] = [
  // 1. Currently running VM (medium, started 48h ago)
  {
    id: "demo-usage-1",
    resourceId: "demo-res-vm-spike",
    resourceName: "prod-web-cluster-01",
    type: "VM",
    size: "medium",
    hourlyRate: 3.40,
    startedAt: hoursAgo(48).toISOString(),
    endedAt: null,
  },
  // 2. Currently running Database (medium, started 72h ago)
  {
    id: "demo-usage-2",
    resourceId: "demo-res-db-primary",
    resourceName: "main-postgres-cluster",
    type: "Database",
    size: "medium",
    hourlyRate: 6.00,
    startedAt: hoursAgo(72).toISOString(),
    endedAt: null,
  },
  // 3. Currently running Network Ingress (small, started 96h ago)
  {
    id: "demo-usage-3",
    resourceId: "demo-res-net-alb",
    resourceName: "api-ingress-gateway",
    type: "Network",
    size: "small",
    hourlyRate: 2.00,
    startedAt: hoursAgo(96).toISOString(),
    endedAt: null,
  },
  // 4. Currently running Storage bucket (medium, started 110h ago)
  {
    id: "demo-usage-storage",
    resourceId: "demo-res-storage-s3",
    resourceName: "assets-media-bucket",
    type: "Storage",
    size: "medium",
    hourlyRate: 1.50,
    startedAt: hoursAgo(110).toISOString(),
    endedAt: null,
  },
  // 5. Currently running Serverless Function (small, started 60h ago)
  {
    id: "demo-usage-serverless",
    resourceId: "demo-res-lambda-fn",
    resourceName: "image-resizer-worker",
    type: "Serverless",
    size: "small",
    hourlyRate: 0.30,
    startedAt: hoursAgo(60).toISOString(),
    endedAt: null,
  },
  // 6. Stopped worker VM (ran for 6 hours, then stopped)
  {
    id: "demo-usage-4",
    resourceId: "demo-res-vm-worker",
    resourceName: "nightly-backup-vm",
    type: "VM",
    size: "small",
    hourlyRate: 0.85,
    startedAt: hoursAgo(10).toISOString(),
    endedAt: hoursAgo(4).toISOString(),
  },
  // 7. Currently running Redis cache (small, started 36h ago)
  {
    id: "demo-usage-5",
    resourceId: "demo-res-db-cache",
    resourceName: "session-redis-cache",
    type: "Database",
    size: "small",
    hourlyRate: 1.50,
    startedAt: hoursAgo(36).toISOString(),
    endedAt: null,
  },
  // 8. DELETED RESOURCE: VM that ran for 5.5 hours earlier this month, then was deleted
  {
    id: "demo-usage-deleted-vm",
    resourceId: "demo-deleted-etl-pipeline",
    resourceName: "etl-pipeline-worker (deleted)",
    type: "VM",
    size: "large",
    hourlyRate: 8.00, // ₹8.00/hr
    startedAt: hoursAgo(16).toISOString(),
    endedAt: hoursAgo(10.5).toISOString(),
  },
];

export const DEMO_FILES: UserFile[] = [
  {
    id: "demo-file-1",
    fileName: "analytics-dataset-q3.parquet",
    sizeBytes: 850 * 1024 * 1024, // 850 MB
    mimeType: "application/octet-stream",
    uploadedAt: hoursAgo(30),
  },
  {
    id: "demo-file-2",
    fileName: "nginx-access-logs-archive.tar.gz",
    sizeBytes: 350 * 1024 * 1024, // 350 MB
    mimeType: "application/gzip",
    uploadedAt: hoursAgo(18),
  },
  {
    id: "demo-file-3",
    fileName: "schema-migrations.sql",
    sizeBytes: 42 * 1024, // 42 KB
    mimeType: "text/plain",
    uploadedAt: hoursAgo(6),
  },
];

export const DEMO_ALERTS: Alert[] = [
  {
    id: "demo-alert-cpu-spike",
    resourceId: "demo-res-vm-spike",
    resourceName: "prod-web-cluster-01",
    resourceType: "VM",
    metric: "CPU",
    value: 92,
    threshold: 80,
    unit: "%",
    severity: "critical",
    status: "active",
    time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    timestampMs: now.getTime(),
    reason: "CPU sustained above 80% (92%) for 4 consecutive sample intervals",
  },
];

/**
 * Generate 24 hours of realistic multi-metric time-series telemetry points.
 */
export function generateDemoTelemetry(): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const totalPoints = 24;

  for (let i = totalPoints - 1; i >= 0; i--) {
    const pointTime = new Date(now.getTime() - i * 60 * 60 * 1000);
    const timeStr = pointTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Normal baseline around 35-50% CPU, with an anomaly spike in recent 3 hours
    let avgCpu = Math.round(38 + Math.sin(i / 2) * 12 + (Math.random() - 0.5) * 6);
    let peakCpu = Math.round(avgCpu + 15 + Math.random() * 8);

    let avgMemory = Math.round(48 + Math.cos(i / 3) * 10 + (Math.random() - 0.5) * 4);
    let peakMemory = Math.round(avgMemory + 14);

    let avgStorage = Math.round(55 + (24 - i) * 0.4);
    let peakStorage = Math.round(avgStorage + 8);

    let avgNetwork = Number((14 + Math.sin(i / 2) * 6 + (Math.random() - 0.5) * 2).toFixed(1));
    let peakNetwork = Number((avgNetwork + 12 + Math.random() * 5).toFixed(1));

    let avgRequests = Math.round(320 + Math.sin(i / 2) * 140 + (Math.random() - 0.5) * 40);
    let peakRequests = Math.round(avgRequests + 250);

    if (i <= 2) {
      // Recent spike
      avgCpu = 84 + (2 - i) * 3;
      peakCpu = 94 + (2 - i) * 2;
      avgMemory = 82 + (2 - i) * 2;
      peakMemory = 89 + (2 - i) * 2;
      avgNetwork = Number((48 + (2 - i) * 6).toFixed(1));
      peakNetwork = Number((68 + (2 - i) * 8).toFixed(1));
      avgRequests = 1350 + (2 - i) * 180;
      peakRequests = 1850 + (2 - i) * 220;
    }

    points.push({
      time: timeStr,
      avgCpu: Math.min(100, Math.max(10, avgCpu)),
      peakCpu: Math.min(100, Math.max(20, peakCpu)),
      avgMemory: Math.min(100, Math.max(15, avgMemory)),
      peakMemory: Math.min(100, Math.max(25, peakMemory)),
      avgStorage: Math.min(100, Math.max(10, avgStorage)),
      peakStorage: Math.min(100, Math.max(20, peakStorage)),
      avgNetwork: Math.max(0.5, avgNetwork),
      peakNetwork: Math.max(1.0, peakNetwork),
      avgRequests: Math.max(10, avgRequests),
      peakRequests: Math.max(20, peakRequests),
      anomaly: avgCpu > 80 || peakCpu > 80 || avgNetwork > 60 || avgRequests > 1200,
    });
  }

  return points;
}
