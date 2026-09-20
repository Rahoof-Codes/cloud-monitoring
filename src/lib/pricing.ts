// ---------------------------------------------------------------------------
// Single Source of Truth for Cloud Pricing
// ---------------------------------------------------------------------------
// Based on AWS Mumbai (ap-south-1) on-demand pricing:
//   - VM small (t3.micro class): ₹0.85/hr
//   - VM medium (t3.medium class): ₹3.40/hr
//   - VM large (m6i.large class): ₹8.00/hr
//   - Database small: ₹1.50/hr, medium: ₹6.00/hr, large: ₹12.00/hr
//   - Network service (load balancer/CDN): ₹2.00/hr
//   - Storage: ₹2.00/GB-month
// ---------------------------------------------------------------------------

export type ResourceType = "VM" | "Database" | "Network";
export type ResourceSize = "small" | "medium" | "large";

export interface PricingTierDetails {
  hourlyRate: number;
  label: string;
  specs: string;
}

export const PRICING_TIERS: Record<ResourceType, Record<ResourceSize, PricingTierDetails>> = {
  VM: {
    small: {
      hourlyRate: 0.85,
      label: "Small (t3.micro)",
      specs: "2 vCPU, 1 GiB RAM",
    },
    medium: {
      hourlyRate: 3.40,
      label: "Medium (t3.medium)",
      specs: "2 vCPU, 4 GiB RAM",
    },
    large: {
      hourlyRate: 8.00,
      label: "Large (m6i.large)",
      specs: "2 vCPU, 8 GiB RAM",
    },
  },
  Database: {
    small: {
      hourlyRate: 1.50,
      label: "Small (db.t3.micro)",
      specs: "1 vCPU, 1 GiB RAM, Managed DB",
    },
    medium: {
      hourlyRate: 6.00,
      label: "Medium (db.t3.medium)",
      specs: "2 vCPU, 4 GiB RAM, High Availability",
    },
    large: {
      hourlyRate: 12.00,
      label: "Large (db.m6i.large)",
      specs: "2 vCPU, 8 GiB RAM, Multi-AZ",
    },
  },
  Network: {
    small: {
      hourlyRate: 2.00,
      label: "Application Load Balancer",
      specs: "Standard L7 Ingress & SSL Termination",
    },
    medium: {
      hourlyRate: 2.00,
      label: "Network Load Balancer",
      specs: "Ultra-low latency L4 TCP/UDP routing",
    },
    large: {
      hourlyRate: 2.00,
      label: "Global Accelerator / CDN",
      specs: "Edge-accelerated regional routing",
    },
  },
};

/** Storage rate in ₹ per GB per month */
export const STORAGE_RATE_PER_GB_MONTH = 2.0;

/**
 * Get hourly rate for a specific resource type and size.
 */
export function getHourlyRate(type: ResourceType, size: ResourceSize = "small"): number {
  const tier = PRICING_TIERS[type]?.[size];
  if (tier) return tier.hourlyRate;
  return 0.85;
}

/**
 * Format currency in Indian Rupees.
 */
export function formatINR(amount: number, decimals: number = 2): string {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

