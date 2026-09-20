// ---------------------------------------------------------------------------
// Unit tests for pure billing functions
// ---------------------------------------------------------------------------

import test from "node:test";
import assert from "node:assert/strict";
import {
  computeRecordCost,
  computeRecordDurationSeconds,
  calculateMonthlyBill,
  MIN_BILLABLE_SECONDS,
  type UsageRecord,
} from "./billing.ts";

test("1. Running record computes cost dynamically based on elapsed time", () => {
  const baseTime = new Date("2026-09-20T10:00:00Z");
  // Started 2 hours ago (7200 seconds), still running (endedAt is null)
  const startedAt = new Date("2026-09-20T08:00:00Z");

  const record: UsageRecord = {
    id: "rec-vm-1",
    resourceId: "res-vm-1",
    resourceName: "test-vm",
    type: "VM",
    size: "small",
    hourlyRate: 0.85, // ₹0.85/hr
    startedAt: startedAt.toISOString(),
    endedAt: null,
  };

  const duration = computeRecordDurationSeconds(record, baseTime);
  assert.equal(duration, 7200);

  const cost = computeRecordCost(record, baseTime);
  // 7200s = 2h * ₹0.85 = ₹1.70
  assert.equal(cost, 1.70);
});

test("2. Ended record computes cost based strictly on startedAt to endedAt", () => {
  const startedAt = new Date("2026-09-20T10:00:00Z");
  const endedAt = new Date("2026-09-20T11:30:00Z"); // 1.5 hours = 5400 seconds
  const laterTime = new Date("2026-09-20T15:00:00Z");

  const record: UsageRecord = {
    id: "rec-db-1",
    resourceId: "res-db-1",
    resourceName: "test-db",
    type: "Database",
    size: "medium",
    hourlyRate: 6.00, // ₹6.00/hr
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
  };

  const duration = computeRecordDurationSeconds(record, laterTime);
  assert.equal(duration, 5400);

  const cost = computeRecordCost(record, laterTime);
  // 1.5h * ₹6.00 = ₹9.00
  assert.equal(cost, 9.00);
});

test("3. Enforces 60-second minimum charge for very short runs", () => {
  const startedAt = new Date("2026-09-20T10:00:00Z");
  const endedAt = new Date("2026-09-20T10:00:15Z"); // Ran for only 15 seconds!

  const record: UsageRecord = {
    id: "rec-vm-short",
    resourceId: "res-vm-short",
    resourceName: "quick-worker",
    type: "VM",
    size: "large",
    hourlyRate: 8.00, // ₹8.00/hr
    startedAt,
    endedAt,
  };

  const duration = computeRecordDurationSeconds(record);
  // Must be clamped to MIN_BILLABLE_SECONDS (60 seconds)
  assert.equal(duration, MIN_BILLABLE_SECONDS);

  const cost = computeRecordCost(record);
  // 60 / 3600 * 8.00 = 8 / 60 = 0.1333... -> ₹0.13
  assert.equal(cost, 0.13);
});

test("4. Delete after 2 minutes still charges and persists in monthly bill", () => {
  const startedAt = new Date("2026-09-20T12:00:00Z");
  const deletedAt = new Date("2026-09-20T12:02:00Z"); // 2 minutes = 120 seconds
  const currentCheckTime = new Date("2026-09-20T14:00:00Z");

  // The resource document might be deleted, but the usage record remains in subcollection!
  const deletedVmRecord: UsageRecord = {
    id: "rec-deleted-vm",
    resourceId: "res-deleted-vm",
    resourceName: "temp-vm-batch",
    type: "VM",
    size: "small",
    hourlyRate: 0.85,
    startedAt,
    endedAt: deletedAt,
  };

  const cost = computeRecordCost(deletedVmRecord, currentCheckTime);
  // 120s / 3600 * 0.85 = 0.0283... -> ₹0.03
  assert.equal(cost, 0.03);

  const monthlyBill = calculateMonthlyBill([deletedVmRecord], 0, currentCheckTime);
  assert.equal(monthlyBill.computeCost, 0.03);
  assert.equal(monthlyBill.totalCost, 0.03);
  assert.equal(monthlyBill.recordCount, 1);
});

test("5. Record spanning month boundary is correctly clamped to calendar month start", () => {
  // Current time: Sep 2, 2026 12:00:00 UTC
  const now = new Date("2026-09-02T12:00:00Z");
  // Started in August: Aug 25, 2026 00:00:00 UTC
  const startedAt = new Date("2026-08-25T00:00:00Z");
  // Still running into September (endedAt: null)

  const record: UsageRecord = {
    id: "rec-long-vm",
    resourceId: "res-long-vm",
    resourceName: "long-running-vm",
    type: "VM",
    size: "small",
    hourlyRate: 1.00, // ₹1.00/hr for simple math
    startedAt,
    endedAt: null,
  };

  // Sep 1, 2026 00:00:00 local/UTC
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  // When computing for current month:
  const duration = computeRecordDurationSeconds(record, now, monthStart);
  // Exactly 2 days and 12 hours in September = 60 hours = 216,000 seconds
  const expectedSeconds = (now.getTime() - monthStart.getTime()) / 1000;
  assert.equal(duration, expectedSeconds);

  const costThisMonth = computeRecordCost(record, now, monthStart);
  // 60 hours * ₹1.00 = ₹60.00
  assert.equal(costThisMonth, Math.round((expectedSeconds * 1.00 / 3600) * 100) / 100);
});
