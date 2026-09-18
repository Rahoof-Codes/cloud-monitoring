"use client";

import {
  Server,
  HardDrive,
  IndianRupee,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "./dashboard-provider";
import { formatBytes } from "@/lib/cost";

interface SummaryItem {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle: string;
  accent: string;
  gradient: string;
}

export function SummaryCards() {
  const {
    resources,
    resourcesLoading,
    totalStorageUsedBytes,
    abnormal,
  } = useDashboard();

  if (resourcesLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardContent className="p-5">
              <Skeleton className="mb-3 h-4 w-24" />
              <Skeleton className="mb-2 h-8 w-16" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Compute estimated monthly cost from context
  const runningCount = resources.filter((r) => r.status === "running").length;
  const storageCostRaw = (totalStorageUsedBytes / 1e9) * 2;
  const resourceCostRaw = runningCount * 50;
  const totalCost = Math.round((storageCostRaw + resourceCostRaw) * 100) / 100;

  const items: SummaryItem[] = [
    {
      label: "Total Resources",
      value: resources.length,
      icon: <Server className="h-4 w-4" />,
      subtitle: `${runningCount} running`,
      accent: "text-blue-500",
      gradient: "from-blue-500/80 to-blue-400/20",
    },
    {
      label: "Storage Used",
      value: formatBytes(totalStorageUsedBytes),
      icon: <HardDrive className="h-4 w-4" />,
      subtitle: "From uploaded files",
      accent: "text-violet-500",
      gradient: "from-violet-500/80 to-violet-400/20",
    },
    {
      label: "Est. Monthly Cost",
      value: `₹${totalCost.toLocaleString("en-IN")}`,
      icon: <IndianRupee className="h-4 w-4" />,
      subtitle: "Storage + resources",
      accent: "text-emerald-500",
      gradient: "from-emerald-500/80 to-emerald-400/20",
    },
    {
      label: "Active Alerts",
      value: abnormal.length,
      icon: <AlertTriangle className="h-4 w-4" />,
      subtitle: abnormal.length > 0 ? "Needs review" : "All clear",
      accent: abnormal.length > 0 ? "text-amber-500" : "text-emerald-500",
      gradient:
        abnormal.length > 0
          ? "from-amber-500/80 to-amber-400/20"
          : "from-emerald-500/80 to-emerald-400/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card
          key={item.label}
          className="group relative overflow-hidden transition-shadow hover:shadow-md"
        >
          {/* Accent bar */}
          <div
            className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${item.gradient}`}
          />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {item.label}
              </span>
              <span className={item.accent}>{item.icon}</span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight transition-all duration-500">
              {item.value}
            </p>
            <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span>{item.subtitle}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
