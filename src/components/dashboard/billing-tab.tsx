"use client";

// ---------------------------------------------------------------------------
// BillingTab — cost breakdown, donut chart, and cost info
// ---------------------------------------------------------------------------
// Pricing model (documented in tooltips):
//   STORAGE_RATE       = ₹2 per GB per month
//   RESOURCE_FLAT_FEE  = ₹50 per active ("running") resource per month
// ---------------------------------------------------------------------------

import {
  IndianRupee,
  HardDrive,
  Server,
  Info,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDashboard } from "./dashboard-provider";
import {
  getCostBreakdown,
  STORAGE_RATE,
  RESOURCE_FLAT_FEE,
  formatBytes,
} from "@/lib/cost";

const COLORS = {
  storage: "hsl(280, 60%, 55%)",
  resources: "hsl(210, 80%, 55%)",
};

export function BillingTab() {
  const { resources, totalStorageUsedBytes } = useDashboard();

  const runningCount = resources.filter((r) => r.status === "running").length;
  const breakdown = getCostBreakdown(totalStorageUsedBytes, runningCount);

  const chartData = [
    { name: "Storage", value: breakdown.storageCost, fill: COLORS.storage },
    { name: "Resources", value: breakdown.resourceCost, fill: COLORS.resources },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-4">
      {/* Cost summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Cost */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500/80 to-emerald-400/20" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Monthly Estimate
              </span>
              <UITooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs text-xs">
                  <p className="font-semibold">Pricing Model:</p>
                  <p>Storage: ₹{STORAGE_RATE}/GB/month</p>
                  <p>Resources: ₹{RESOURCE_FLAT_FEE}/running resource/month</p>
                  <p className="mt-1 text-muted-foreground">
                    Cost = (storage GB × ₹{STORAGE_RATE}) + (running resources × ₹{RESOURCE_FLAT_FEE})
                  </p>
                </TooltipContent>
              </UITooltip>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              ₹{breakdown.totalCost.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">per month</p>
          </CardContent>
        </Card>

        {/* Storage cost */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-violet-500" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Storage Cost
              </span>
            </div>
            <p className="mt-2 text-xl font-bold">
              ₹{breakdown.storageCost.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatBytes(totalStorageUsedBytes)} × ₹{STORAGE_RATE}/GB
            </p>
          </CardContent>
        </Card>

        {/* Resource cost */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Resource Cost
              </span>
            </div>
            <p className="mt-2 text-xl font-bold">
              ₹{breakdown.resourceCost.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {runningCount} running × ₹{RESOURCE_FLAT_FEE}/each
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Donut chart */}
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <IndianRupee className="h-4 w-4" />
            Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {breakdown.totalCost === 0 ? (
            <div className="py-12 text-center">
              <IndianRupee className="mx-auto h-10 w-10 text-muted-foreground/20" />
              <p className="mt-2 text-sm text-muted-foreground">
                No costs yet
              </p>
              <p className="text-xs text-muted-foreground/60">
                Add resources or upload files to see cost breakdown
              </p>
            </div>
          ) : (
            <div className="h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    label={({ name, value }) =>
                      `${name}: ₹${value.toLocaleString("en-IN")}`
                    }
                    labelLine={true}
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0 0% 10%)",
                      border: "1px solid hsl(0 0% 20%)",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "#fff",
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [
                      `₹${Number(value).toLocaleString("en-IN")}`,
                      undefined,
                    ]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future work note */}
      <Card className="border-dashed">
        <CardContent className="p-5">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">📊 Cost over time (coming soon):</span>{" "}
            A historical line chart showing daily cost snapshots will be added
            in a future update. This requires a scheduled Cloud Function to
            snapshot costs daily.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
