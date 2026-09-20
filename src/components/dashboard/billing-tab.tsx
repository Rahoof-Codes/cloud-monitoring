"use client";

// ---------------------------------------------------------------------------
// BillingTab — Usage-Based Billing Engine & Analytics
// ---------------------------------------------------------------------------

import { useState, useMemo } from "react";
import {
  IndianRupee,
  HardDrive,
  Server,
  Info,
  ChevronDown,
  ChevronUp,
  Clock,
  HelpCircle,
  Database,
  Wifi,
  BarChart3,
  Calendar,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDashboard } from "./dashboard-provider";
import {
  calculateMonthlyBill,
  computeRecordCost,
  computeRecordDurationSeconds,
  generateDailyCostPoints,
  formatDuration,
  toTimestampMs,
  type UsageRecord,
} from "@/lib/billing";
import {
  PRICING_TIERS,
  STORAGE_RATE_PER_GB_MONTH,
  formatINR,
  type ResourceType,
} from "@/lib/pricing";
import { formatBytes } from "@/lib/cost";

const TYPE_COLORS: Record<string, string> = {
  VM: "hsl(210, 80%, 55%)",
  Database: "hsl(280, 60%, 55%)",
  Network: "hsl(35, 85%, 55%)",
  Storage: "hsl(150, 70%, 40%)",
};

export function BillingTab() {
  const { resources, usageRecords, totalStorageUsedBytes, clockTick } = useDashboard();
  const [showFormulaPanel, setShowFormulaPanel] = useState(false);

  // Now timestamp updated live via clockTick from provider
  const now = useMemo(() => new Date(clockTick), [clockTick]);

  // Comprehensive monthly bill calculation
  const bill = useMemo(() => {
    return calculateMonthlyBill(usageRecords, totalStorageUsedBytes, now);
  }, [usageRecords, totalStorageUsedBytes, now]);

  // Donut breakdown by resource type (VM, Database, Network, Storage)
  const donutData = useMemo(() => {
    const list = [
      { name: "VMs", value: bill.breakdownByType.VM, fill: TYPE_COLORS.VM },
      { name: "Databases", value: bill.breakdownByType.Database, fill: TYPE_COLORS.Database },
      { name: "Network", value: bill.breakdownByType.Network, fill: TYPE_COLORS.Network },
      { name: "Storage", value: bill.storageCost, fill: TYPE_COLORS.Storage },
    ].filter((d) => d.value > 0);
    return list;
  }, [bill]);

  // Real daily cost trend chart points (last 7 days)
  const dailyPoints = useMemo(() => {
    return generateDailyCostPoints(usageRecords, totalStorageUsedBytes, 7, now);
  }, [usageRecords, totalStorageUsedBytes, now]);

  // Running vs ended count
  const runningRecordsCount = useMemo(() => {
    return usageRecords.filter((u) => u.endedAt === null).length;
  }, [usageRecords]);

  return (
    <div className="space-y-6">
      {/* ── Summary Cards Row ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Monthly Bill */}
        <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500/80 to-emerald-400/20" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Current Month Bill
              </span>
              <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                AWS Mumbai Tiers
              </Badge>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatINR(bill.totalCost)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Compute: {formatINR(bill.computeCost)} · Storage: {formatINR(bill.storageCost)}
            </p>
          </CardContent>
        </Card>

        {/* Compute Cost */}
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Compute Charges
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {runningRecordsCount} running
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {formatINR(bill.computeCost)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {usageRecords.length} total usage sessions tracked
            </p>
          </CardContent>
        </Card>

        {/* Storage Cost */}
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-violet-500" />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Storage Charges
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                ₹{STORAGE_RATE_PER_GB_MONTH}/GB-mo
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {formatINR(bill.storageCost)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatBytes(totalStorageUsedBytes)} stored
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row: Cost Breakdown & Real Daily Cost ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Cost Breakdown Donut */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <IndianRupee className="h-4 w-4 text-emerald-500" />
              Charges by Resource Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {donutData.length === 0 ? (
              <div className="flex h-[260px] flex-col items-center justify-center text-center">
                <IndianRupee className="h-10 w-10 text-muted-foreground/20" />
                <p className="mt-2 text-sm text-muted-foreground">No charges recorded yet</p>
                <p className="text-xs text-muted-foreground/60">
                  Start resources or upload files to begin tracking usage
                </p>
              </div>
            ) : (
              <div className="h-[260px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      label={({ name, value }) => `${name}: ₹${value.toFixed(2)}`}
                      labelLine={false}
                    >
                      {donutData.map((entry, i) => (
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
                      formatter={(val) => [`₹${Number(val).toFixed(2)}`, "Cost"]}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Real Daily Cost Trend Chart */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                Daily Cost History (Last 7 Days)
              </CardTitle>
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Actual Usage
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="billComputeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="billStorageGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(150, 70%, 40%)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(150, 70%, 40%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 50% / 0.1)" />
                  <XAxis dataKey="dayLabel" tick={{ fontSize: 10 }} stroke="hsl(0 0% 50% / 0.5)" />
                  <YAxis
                    domain={[0, "auto"]}
                    tick={{ fontSize: 10 }}
                    stroke="hsl(0 0% 50% / 0.5)"
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0 0% 10%)",
                      border: "1px solid hsl(0 0% 20%)",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "#fff",
                    }}
                    formatter={(val, name) => [`₹${Number(val).toFixed(2)}`, name === "computeCost" ? "Compute" : "Storage"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="computeCost"
                    stackId="1"
                    stroke="hsl(210, 80%, 55%)"
                    fill="url(#billComputeGrad)"
                    name="Compute"
                  />
                  <Area
                    type="monotone"
                    dataKey="storageCost"
                    stackId="1"
                    stroke="hsl(150, 70%, 40%)"
                    fill="url(#billStorageGrad)"
                    name="Storage"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── How is my bill calculated? Accordion Panel ── */}
      <Card className="border-border/70 overflow-hidden">
        <button
          onClick={() => setShowFormulaPanel(!showFormulaPanel)}
          className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-muted/30"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                How is my bill calculated?
              </p>
              <p className="text-xs text-muted-foreground">
                Transparent AWS Mumbai rate card, formula, and billing examples
              </p>
            </div>
          </div>
          {showFormulaPanel ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showFormulaPanel && (
          <CardContent className="border-t border-border/50 bg-muted/10 p-5 space-y-5 text-xs">
            {/* Rate Table */}
            <div>
              <p className="font-semibold text-foreground mb-2">
                1. AWS Mumbai (ap-south-1) On-Demand Rate Table
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* VMs */}
                <div className="rounded-lg border border-border/60 bg-background p-3 space-y-1">
                  <p className="font-semibold text-blue-500 flex items-center gap-1">
                    <Server className="h-3.5 w-3.5" /> Virtual Machines
                  </p>
                  <p className="text-muted-foreground">Small: ₹0.85/hr (t3.micro)</p>
                  <p className="text-muted-foreground">Medium: ₹3.40/hr (t3.medium)</p>
                  <p className="text-muted-foreground">Large: ₹8.00/hr (m6i.large)</p>
                </div>

                {/* Databases */}
                <div className="rounded-lg border border-border/60 bg-background p-3 space-y-1">
                  <p className="font-semibold text-violet-500 flex items-center gap-1">
                    <Database className="h-3.5 w-3.5" /> Databases
                  </p>
                  <p className="text-muted-foreground">Small: ₹1.50/hr (db.t3.micro)</p>
                  <p className="text-muted-foreground">Medium: ₹6.00/hr (db.t3.medium)</p>
                  <p className="text-muted-foreground">Large: ₹12.00/hr (db.m6i.large)</p>
                </div>

                {/* Network */}
                <div className="rounded-lg border border-border/60 bg-background p-3 space-y-1">
                  <p className="font-semibold text-amber-500 flex items-center gap-1">
                    <Wifi className="h-3.5 w-3.5" /> Network Ingress
                  </p>
                  <p className="text-muted-foreground">ALB / Gateway: ₹2.00/hr</p>
                  <p className="text-muted-foreground">NLB L4: ₹2.00/hr</p>
                  <p className="text-muted-foreground">CDN Accelerator: ₹2.00/hr</p>
                </div>

                {/* Storage */}
                <div className="rounded-lg border border-border/60 bg-background p-3 space-y-1">
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <HardDrive className="h-3.5 w-3.5" /> Object Storage
                  </p>
                  <p className="text-muted-foreground">Rate: ₹2.00 per GB / month</p>
                  <p className="text-muted-foreground">Stopped resources: ₹0.00 compute</p>
                  <p className="text-muted-foreground">Minimum charge: 60s per session</p>
                </div>
              </div>
            </div>

            {/* Formula */}
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3.5">
              <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                2. Exact Billing Formula
              </p>
              <p className="font-mono text-xs mt-1 text-foreground">
                Total Bill = Σ (Running Seconds × Hourly Rate / 3600) + (Storage Used in GB × ₹2.00)
              </p>
              <p className="text-muted-foreground text-[11px] mt-1">
                Usage records are clamped to calendar month boundaries. When resources are stopped or deleted, their accrued usage charges remain permanently captured in your billing history.
              </p>
            </div>

            {/* Worked Example */}
            <div className="rounded-lg border border-border/60 bg-background p-3.5 space-y-1.5">
              <p className="font-semibold text-foreground">
                3. Worked Example
              </p>
              <p className="text-muted-foreground">
                Suppose you run a <strong>Small VM (t3.micro @ ₹0.85/hr)</strong> for <strong>3 hours</strong>:
              </p>
              <p className="font-mono text-foreground font-medium pl-2">
                3 hours × ₹0.85/hr = ₹2.55 compute fee
              </p>
              <p className="text-muted-foreground pt-1">
                If you also store <strong>10 GB</strong> of log files:
              </p>
              <p className="font-mono text-foreground font-medium pl-2">
                10 GB × ₹2.00/GB = ₹20.00 storage fee
              </p>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 pt-1">
                Total Monthly Invoice = ₹2.55 + ₹20.00 = ₹22.55
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── Usage History Table ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4 text-blue-500" />
                Usage History
                <span className="text-xs font-normal text-muted-foreground">
                  ({usageRecords.length} sessions tracked)
                </span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete audit trail of compute usage. Deleted resources are permanently preserved.
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              Live updating every 3s
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {usageRecords.length === 0 ? (
            <div className="py-10 text-center">
              <Server className="mx-auto h-10 w-10 text-muted-foreground/20" />
              <p className="mt-2 text-sm text-muted-foreground">No usage sessions yet</p>
              <p className="text-xs text-muted-foreground/60">
                Created and running resources will automatically record usage sessions here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Ended</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-right">Hourly Rate</TableHead>
                    <TableHead className="text-right">Accrued Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageRecords.map((record) => {
                    const isRunning = record.endedAt === null;
                    const isDeleted = !resources.some((r) => r.id === record.resourceId);
                    const durationSec = computeRecordDurationSeconds(record, now);
                    const cost = computeRecordCost(record, now);
                    const startedMs = toTimestampMs(record.startedAt);
                    const endedMs = record.endedAt ? toTimestampMs(record.endedAt) : null;

                    return (
                      <TableRow key={record.id}>
                        {/* Resource Name + Badges */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground text-xs truncate max-w-[160px]">
                              {record.resourceName}
                            </span>
                            {isDeleted && (
                              <Badge
                                variant="destructive"
                                className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[9px] px-1 py-0"
                              >
                                Deleted
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Type */}
                        <TableCell className="text-xs text-muted-foreground">
                          {record.type}
                        </TableCell>

                        {/* Size */}
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {record.size}
                          </Badge>
                        </TableCell>

                        {/* Started */}
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(startedMs).toLocaleTimeString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>

                        {/* Ended */}
                        <TableCell>
                          {isRunning ? (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1 px-1.5 py-0 font-medium">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Running
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {endedMs
                                ? new Date(endedMs).toLocaleTimeString([], {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Ended"}
                            </span>
                          )}
                        </TableCell>

                        {/* Duration */}
                        <TableCell className="text-xs font-mono tabular-nums">
                          {formatDuration(durationSec)}
                        </TableCell>

                        {/* Hourly Rate */}
                        <TableCell className="text-right text-xs font-mono tabular-nums text-muted-foreground">
                          ₹{record.hourlyRate.toFixed(2)}/hr
                        </TableCell>

                        {/* Accrued Cost */}
                        <TableCell className="text-right text-xs font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          ₹{cost.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
