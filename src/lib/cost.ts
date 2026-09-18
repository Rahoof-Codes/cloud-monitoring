// ---------------------------------------------------------------------------
// Cost calculation — isolated & testable
// ---------------------------------------------------------------------------
// Pricing model (transparent / demo-friendly):
//   STORAGE_RATE       = ₹2 per GB per month
//   RESOURCE_FLAT_FEE  = ₹50 per active ("running") resource per month
//
//   estimatedMonthlyCost =
//       (totalStorageUsedBytes / 1e9) * STORAGE_RATE
//     + (count of running resources)  * RESOURCE_FLAT_FEE
// ---------------------------------------------------------------------------

/** Cost per GB of file storage per month (₹) */
export const STORAGE_RATE = 2;

/** Flat fee per running compute resource per month (₹) */
export const RESOURCE_FLAT_FEE = 50;

/** Soft free-tier storage cap in bytes (1 GB) */
export const FREE_TIER_CAP_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB

/**
 * Calculate the estimated monthly cost for a user.
 *
 * @param totalStorageBytes - total bytes stored across all uploaded files
 * @param runningResourceCount - number of resources with status === "running"
 * @returns estimated monthly cost in ₹
 */
export function calculateMonthlyCost(
  totalStorageBytes: number,
  runningResourceCount: number
): number {
  const storageCost = (totalStorageBytes / 1e9) * STORAGE_RATE;
  const resourceCost = runningResourceCount * RESOURCE_FLAT_FEE;
  return Math.round((storageCost + resourceCost) * 100) / 100; // round to paisa
}

/**
 * Break the cost into its component parts for the billing tab.
 */
export function getCostBreakdown(
  totalStorageBytes: number,
  runningResourceCount: number
) {
  const storageCost =
    Math.round((totalStorageBytes / 1e9) * STORAGE_RATE * 100) / 100;
  const resourceCost = runningResourceCount * RESOURCE_FLAT_FEE;
  return {
    storageCost,
    resourceCost,
    totalCost: Math.round((storageCost + resourceCost) * 100) / 100,
  };
}

/** Format bytes into a human-readable string (KB / MB / GB) */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
