// ---------------------------------------------------------------------------
// Pure Billing Engine — Isolated & Testable (No React or Firebase Imports)
// ---------------------------------------------------------------------------

import type { ResourceType, ResourceSize } from "./pricing.ts";
import { STORAGE_RATE_PER_GB_MONTH } from "./pricing.ts";

export interface UsageRecord {
  id: string;
  resourceId: string;
  resourceName: string;
  type: ResourceType;
  size: ResourceSize;
  hourlyRate: number; // snapshotted at creation
  startedAt: string | number | Date | { seconds: number; nanoseconds?: number } | unknown;
  endedAt: string | number | Date | { seconds: number; nanoseconds?: number } | null | unknown;
}

/** Minimum charge window in seconds (60 seconds) */
export const MIN_BILLABLE_SECONDS = 60;

/**
 * Normalise any timestamp format into milliseconds epoch.
 */
export function toTimestampMs(val: unknown, fallback: number = Date.now()): number {
  if (!val) return fallback;
  if (typeof val === "number") {
    // If unix seconds (< 1e11), convert to ms
    return val < 1e11 ? val * 1000 : val;
  }
  if (typeof val === "string") {
    const parsed = new Date(val).getTime();
    return isNaN(parsed) ? fallback : parsed;
  }
  if (val instanceof Date) {
    return val.getTime();
  }
  if (typeof val === "object" && val !== null && "seconds" in (val as Record<string, unknown>)) {
    return (val as { seconds: number }).seconds * 1000;
  }
  return fallback;
}

/**
 * Get the beginning of the current calendar month (00:00:00.000).
 */
export function getMonthStartDate(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

/**
 * Compute billable duration in seconds for a usage record.
 * Clamps to clampStartDate if specified (e.g. calendar month boundary).
 * Enforces a 60-second minimum duration for any billable period.
 */
export function computeRecordDurationSeconds(
  record: UsageRecord,
  now: Date = new Date(),
  clampStartDate?: Date
): number {
  const startMs = toTimestampMs(record.startedAt, now.getTime());
  const endMs = record.endedAt ? toTimestampMs(record.endedAt, now.getTime()) : now.getTime();

  // If the record ended before clampStartDate, no duration in this window
  if (clampStartDate && endMs <= clampStartDate.getTime()) {
    return 0;
  }

  // Clamp start to clampStartDate if record started earlier
  const effectiveStartMs = clampStartDate
    ? Math.max(startMs, clampStartDate.getTime())
    : startMs;

  if (endMs <= effectiveStartMs) {
    return 0;
  }

  const rawSeconds = (endMs - effectiveStartMs) / 1000;

  // Minimum 60 seconds per record
  return Math.max(MIN_BILLABLE_SECONDS, rawSeconds);
}

/**
 * Compute the cost of an individual usage record.
 * Cost = seconds running × hourlyRate / 3600.
 */
export function computeRecordCost(
  record: UsageRecord,
  now: Date = new Date(),
  clampStartDate?: Date
): number {
  const durationSeconds = computeRecordDurationSeconds(record, now, clampStartDate);
  if (durationSeconds <= 0) return 0;

  const cost = (durationSeconds * record.hourlyRate) / 3600;
  return Math.round(cost * 100) / 100;
}

/**
 * Compute total lifetime cost accrued by a specific resource ID across all its usage records.
 */
export function computeResourceTotalCost(
  resourceId: string,
  records: UsageRecord[],
  now: Date = new Date()
): number {
  const resourceRecords = records.filter((r) => r.resourceId === resourceId);
  const total = resourceRecords.reduce(
    (sum, record) => sum + computeRecordCost(record, now),
    0
  );
  return Math.round(total * 100) / 100;
}

export interface MonthlyBillResult {
  computeCost: number;
  storageCost: number;
  totalCost: number;
  breakdownByType: Record<ResourceType, number>;
  recordCount: number;
}

/**
 * Compute monthly bill:
 * Sum of usage costs overlapping the current calendar month (records clamped to month start) + storage cost.
 * Deleted resources still count if their usage records overlap the month.
 */
export function calculateMonthlyBill(
  records: UsageRecord[],
  totalStorageBytes: number,
  now: Date = new Date()
): MonthlyBillResult {
  const monthStart = getMonthStartDate(now);

  const breakdownByType: Record<ResourceType, number> = {
    VM: 0,
    Database: 0,
    Network: 0,
  };

  let computeCostRaw = 0;
  let activeRecordCount = 0;

  for (const record of records) {
    const cost = computeRecordCost(record, now, monthStart);
    if (cost > 0) {
      computeCostRaw += cost;
      activeRecordCount++;
      if (breakdownByType[record.type] !== undefined) {
        breakdownByType[record.type] += cost;
      }
    }
  }

  // Storage cost = (GB) * STORAGE_RATE_PER_GB_MONTH
  const storageGb = totalStorageBytes / 1e9;
  const storageCostRaw = storageGb * STORAGE_RATE_PER_GB_MONTH;

  const computeCost = Math.round(computeCostRaw * 100) / 100;
  const storageCost = Math.round(storageCostRaw * 100) / 100;
  const totalCost = Math.round((computeCost + storageCost) * 100) / 100;

  for (const key of Object.keys(breakdownByType) as ResourceType[]) {
    breakdownByType[key] = Math.round(breakdownByType[key] * 100) / 100;
  }

  return {
    computeCost,
    storageCost,
    totalCost,
    breakdownByType,
    recordCount: activeRecordCount,
  };
}

export interface DailyCostPoint {
  date: string;
  dayLabel: string;
  computeCost: number;
  storageCost: number;
  totalCost: number;
}

/**
 * Generate daily cost chart points for the last N days based on usage records.
 */
export function generateDailyCostPoints(
  records: UsageRecord[],
  totalStorageBytes: number,
  days: number = 7,
  now: Date = new Date()
): DailyCostPoint[] {
  const points: DailyCostPoint[] = [];
  const dailyStorageCost = (totalStorageBytes / 1e9 * STORAGE_RATE_PER_GB_MONTH) / 30;

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0, 0);
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59, 999);
    const effectiveDayEnd = dayEnd.getTime() > now.getTime() ? now : dayEnd;

    let dayCompute = 0;

    for (const record of records) {
      const recStartMs = toTimestampMs(record.startedAt, now.getTime());
      const recEndMs = record.endedAt ? toTimestampMs(record.endedAt, now.getTime()) : now.getTime();

      // Check overlap
      const overlapStart = Math.max(recStartMs, dayStart.getTime());
      const overlapEnd = Math.min(recEndMs, effectiveDayEnd.getTime());

      if (overlapEnd > overlapStart) {
        const seconds = (overlapEnd - overlapStart) / 1000;
        dayCompute += (seconds * record.hourlyRate) / 3600;
      }
    }

    const computeCost = Math.round(dayCompute * 100) / 100;
    const storageCost = Math.round(dailyStorageCost * 100) / 100;

    points.push({
      date: dayStart.toISOString().slice(0, 10),
      dayLabel: dayStart.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      computeCost,
      storageCost,
      totalCost: Math.round((computeCost + storageCost) * 100) / 100,
    });
  }

  return points;
}

/**
 * Format duration in human-readable format (e.g. "3m 42s", "2h 15m").
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0s";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const d = Math.floor(seconds / 86400);

  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
