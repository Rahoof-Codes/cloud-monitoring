// ---------------------------------------------------------------------------
// Cost helpers — re-exports from pricing.ts & billing.ts
// ---------------------------------------------------------------------------

import { STORAGE_RATE_PER_GB_MONTH } from "./pricing";

/** Cost per GB of file storage per month (₹) */
export const STORAGE_RATE = STORAGE_RATE_PER_GB_MONTH;

/** Soft free-tier storage cap in bytes (1 GB) */
export const FREE_TIER_CAP_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB

/** Format bytes into a human-readable string (KB / MB / GB) */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
