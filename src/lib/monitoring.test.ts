import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSnapshotFromResources,
  detectAnomalies,
  getAbnormalResources,
  DEFAULT_THRESHOLDS,
  type MetricHistory,
  type ThresholdConfig,
  type Resource,
} from "./data.ts";

function makeResource(overrides: Partial<Resource>): Resource {
  return {
    id: overrides.id || "test-res-1",
    name: overrides.name || "Test Resource",
    type: overrides.type || "VM",
    size: overrides.size || "small",
    status: overrides.status || "running",
    region: overrides.region || "ap-south-1",
    cpuUsage: overrides.cpuUsage ?? 40,
    memoryUsage: overrides.memoryUsage ?? 45,
    storageUsage: overrides.storageUsage ?? 30,
    networkTraffic: overrides.networkTraffic ?? 15,
    requestCount: overrides.requestCount ?? 200,
    hourlyRate: overrides.hourlyRate ?? 1.5,
    apiCredentials: overrides.apiCredentials || {
      accessKey: "AKIA_TEST",
      secretKey: "SK_TEST",
      createdAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };
}

test("1. buildSnapshotFromResources returns null when no running resources exist", () => {
  const stopped = [makeResource({ status: "stopped" })];
  const snap = buildSnapshotFromResources(stopped);
  assert.equal(snap, null);
});

test("2. buildSnapshotFromResources aggregates multi-metric telemetry correctly", () => {
  const r1 = makeResource({
    cpuUsage: 20,
    memoryUsage: 30,
    storageUsage: 40,
    networkTraffic: 10,
    requestCount: 100,
  });
  const r2 = makeResource({
    id: "r2",
    cpuUsage: 40,
    memoryUsage: 50,
    storageUsage: 60,
    networkTraffic: 20,
    requestCount: 300,
  });

  const snap = buildSnapshotFromResources([r1, r2]);
  assert.notEqual(snap, null);
  assert.equal(snap!.avgCpu, 30);
  assert.equal(snap!.peakCpu, 40);
  assert.equal(snap!.avgMemory, 40);
  assert.equal(snap!.peakMemory, 50);
  assert.equal(snap!.avgStorage, 50);
  assert.equal(snap!.peakStorage, 60);
  assert.equal(snap!.avgNetwork, 15);
  assert.equal(snap!.peakNetwork, 20);
  assert.equal(snap!.avgRequests, 200);
  assert.equal(snap!.peakRequests, 300);
  assert.equal(snap!.anomaly, false);
});

test("3. detectAnomalies fires alerts when metrics breach configured thresholds for consecutive samples", () => {
  const history: MetricHistory = new Map();
  const customThresholds: ThresholdConfig = {
    ...DEFAULT_THRESHOLDS,
    cpu: 75,
    network: 50,
    consecutiveSamples: 2,
  };

  const highLoadRes = makeResource({
    id: "res-spike",
    name: "Spike VM",
    cpuUsage: 92,
    networkTraffic: 80,
  });

  // Sample 1: not enough consecutive samples yet (requires 2)
  const alerts1 = detectAnomalies([highLoadRes], history, customThresholds);
  assert.equal(alerts1.length, 0);

  // Sample 2: 2nd consecutive sample above threshold -> alerts should fire!
  const alerts2 = detectAnomalies([highLoadRes], history, customThresholds);
  assert.equal(alerts2.length >= 2, true);

  const cpuAlert = alerts2.find((a) => a.metric === "CPU");
  assert.notEqual(cpuAlert, undefined);
  assert.equal(cpuAlert!.value, 92);
  assert.equal(cpuAlert!.threshold, 75);
  assert.equal(cpuAlert!.severity, "critical");

  const netAlert = alerts2.find((a) => a.metric === "Network");
  assert.notEqual(netAlert, undefined);
  assert.equal(netAlert!.value, 80);
  assert.equal(netAlert!.threshold, 50);
});

test("4. getAbnormalResources accurately flags resources violating thresholds or in error/warning", () => {
  const healthy = makeResource({ cpuUsage: 30, memoryUsage: 40 });
  const breach = makeResource({ id: "b1", cpuUsage: 95 });
  const inWarning = makeResource({ id: "w1", cpuUsage: 20, status: "warning" });

  const abnormal = getAbnormalResources([healthy, breach, inWarning], DEFAULT_THRESHOLDS);
  assert.equal(abnormal.length, 2);
  assert.equal(abnormal.some((r) => r.id === "b1"), true);
  assert.equal(abnormal.some((r) => r.id === "w1"), true);
});
