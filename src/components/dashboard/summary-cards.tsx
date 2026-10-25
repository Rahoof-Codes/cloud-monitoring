"use client";

import {
  Server,
  HardDrive,
  IndianRupee,
  AlertTriangle,
  TrendingUp,
  Wifi,
  Activity,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "./dashboard-provider";
import { formatBytes } from "@/lib/cost";
import { calculateMonthlyBill } from "@/lib/billing";

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
    usageRecords,
    totalStorageUsedBytes,
    alerts,
    clockTick,
  } = useDashboard();

  if (resourcesLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardContent className="p-4 sm:p-5">
              <Skeleton className="mb-3 h-4 w-24" />
              <Skeleton className="mb-2 h-7 w-16" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const runningResources = resources.filter((r) => r.status === "running");
  const runningCount = runningResources.length;

  const totalThroughput = Number(
    runningResources
      .reduce((sum, r) => sum + (r.networkTraffic ?? 0), 0)
      .toFixed(1)
  );

  const totalRequests = runningResources.reduce(
    (sum, r) => sum + (r.requestCount ?? 0),
    0
  );

  const bill = calculateMonthlyBill(usageRecords, totalStorageUsedBytes, new Date(clockTick));
  const totalCost = bill.totalCost;

  const items: SummaryItem[] = [
    {
      label: "Monitored Resources",
      value: resources.length,
      icon: <Server className="h-4 w-4" />,
      subtitle: `${runningCount} active running`,
      accent: "text-blue-500",
      gradient: "from-blue-500/80 to-blue-400/20",
    },
    {
      label: "Storage Used",
      value: formatBytes(totalStorageUsedBytes),
      icon: <HardDrive className="h-4 w-4" />,
      subtitle: "Files & provisioned pools",
      accent: "text-violet-500",
      gradient: "from-violet-500/80 to-violet-400/20",
    },
    {
      label: "Throughput & Traffic",
      value: `${totalThroughput} MB/s`,
      icon: <Wifi className="h-4 w-4" />,
      subtitle: `${totalRequests.toLocaleString()} req/s total load`,
      accent: "text-cyan-500",
      gradient: "from-cyan-500/80 to-cyan-400/20",
    },
    {
      label: "Active Alerts",
      value: alerts.length,
      icon: <AlertTriangle className="h-4 w-4" />,
      subtitle: alerts.length > 0 ? "Threshold breached" : "All within thresholds",
      accent: alerts.length > 0 ? "text-amber-500" : "text-emerald-500",
      gradient:
        alerts.length > 0
          ? "from-amber-500/80 to-amber-400/20"
          : "from-emerald-500/80 to-emerald-400/20",
    },
    {
      label: "Est. Monthly Cost",
      value: `₹${totalCost.toLocaleString("en-IN")}`,
      icon: <IndianRupee className="h-4 w-4" />,
      subtitle: "Storage + active compute",
      accent: "text-emerald-500",
      gradient: "from-emerald-500/80 to-emerald-400/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <Card
          key={item.label}
          className="group relative overflow-hidden transition-shadow hover:shadow-md"
        >
          {/* Accent bar */}
          <div
            className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${item.gradient}`}
          />
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate">
                {item.label}
              </span>
              <span className={item.accent}>{item.icon}</span>
            </div>
            <p className="mt-2 text-xl sm:text-2xl font-bold tracking-tight transition-all duration-500 truncate">
              {item.value}
            </p>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground truncate">
              <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0" />
              <span className="truncate">{item.subtitle}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
