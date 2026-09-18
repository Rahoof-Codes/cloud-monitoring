"use client";

import { useState } from "react";
import {
  Server,
  FolderOpen,
  Receipt,
  Sparkles,
  AlertTriangle,
  HardDrive,
  Cpu,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useDashboard } from "./dashboard-provider";
import { formatBytes, calculateMonthlyCost, getCostBreakdown } from "@/lib/cost";
import { AttentionPanel } from "./attention-panel";
import { ResourceGrid } from "./resource-grid";
import { FileUploader } from "./file-uploader";
import { FileList } from "./file-list";
import { BillingTab } from "./billing-tab";
import { CpuChart, DistributionChart } from "./charts";
import { Badge } from "@/components/ui/badge";

export type MobileSection = "resources" | "files" | "billing";

interface MobileSectionsProps {
  activeSection: MobileSection;
  onSectionChange: (section: MobileSection) => void;
}

export function MobileSections({
  activeSection,
  onSectionChange,
}: MobileSectionsProps) {
  const {
    resources,
    abnormal,
    files,
    totalStorageUsedBytes,
    setIsAiOpen,
    openAiWithPrompt,
  } = useDashboard();

  const runningCount = resources.filter((r) => r.status === "running").length;
  const stoppedCount = resources.filter((r) => r.status === "stopped").length;
  const monthlyCost = calculateMonthlyCost(totalStorageUsedBytes, runningCount);
  const breakdown = getCostBreakdown(totalStorageUsedBytes, runningCount);

  return (
    <div className="block md:hidden space-y-4 pb-28">
      {/* ── Top Segmented Section Selector ── */}
      <div className="sticky top-[57px] z-20 -mx-4 px-4 py-2 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/60">
          {/* Section 1: Resources */}
          <button
            onClick={() => onSectionChange("resources")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
              activeSection === "resources"
                ? "bg-background text-foreground shadow-sm border border-border/70"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Server className="h-3.5 w-3.5 text-blue-500" />
            <span>Resources</span>
            <span
              className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                abnormal.length > 0
                  ? "bg-rose-500/15 text-rose-500"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {resources.length}
            </span>
          </button>

          {/* Section 2: Files */}
          <button
            onClick={() => onSectionChange("files")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
              activeSection === "files"
                ? "bg-background text-foreground shadow-sm border border-border/70"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderOpen className="h-3.5 w-3.5 text-violet-500" />
            <span>Files</span>
            <span className="ml-0.5 rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-bold text-muted-foreground">
              {files.length}
            </span>
          </button>

          {/* Section 3: Billing */}
          <button
            onClick={() => onSectionChange("billing")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
              activeSection === "billing"
                ? "bg-background text-foreground shadow-sm border border-border/70"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Receipt className="h-3.5 w-3.5 text-emerald-500" />
            <span>Billing</span>
            <span className="ml-0.5 rounded-full bg-emerald-500/10 px-1 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              ₹{monthlyCost}
            </span>
          </button>
        </div>
      </div>

      {/* ── SECTION 1: RESOURCES & COMPUTE ── */}
      {activeSection === "resources" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Attention Alerts if any */}
          <AttentionPanel />

          {/* Section Mini Metrics */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-border/70 bg-card p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Running Instances
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="mt-1 text-xl font-bold tracking-tight text-foreground">
                {runningCount}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  / {resources.length} total
                </span>
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                ₹{breakdown.resourceCost}/mo compute fee
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Anomaly Alerts
                </span>
                <AlertTriangle
                  className={`h-3.5 w-3.5 ${
                    abnormal.length > 0 ? "text-amber-500" : "text-emerald-500"
                  }`}
                />
              </div>
              <p className="mt-1 text-xl font-bold tracking-tight text-foreground">
                {abnormal.length}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  {abnormal.length > 0 ? "high CPU" : "healthy"}
                </span>
              </p>
              <p className="text-[10px] text-muted-foreground">
                {stoppedCount} instance{stoppedCount === 1 ? "" : "s"} stopped
              </p>
            </div>
          </div>

          {/* Contextual Ask AI Banner for Resources */}
          <button
            onClick={() =>
              openAiWithPrompt(
                "Analyze my currently running cloud resources, inspect CPU metrics, and alert me about any performance or regional anomalies."
              )
            }
            className="w-full flex items-center justify-between rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 p-3 text-left transition-all hover:border-emerald-500/50"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Ask AI about Compute & Health
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Get real-time CPU diagnosis and scaling advice
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </button>

          {/* Live CPU Area Chart */}
          <CpuChart />

          {/* Server Resources Grid */}
          <ResourceGrid />
        </div>
      )}

      {/* ── SECTION 2: STORAGE & FILES ── */}
      {activeSection === "files" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Section Mini Metrics */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-border/70 bg-card p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Storage Used
                </span>
                <HardDrive className="h-3.5 w-3.5 text-violet-500" />
              </div>
              <p className="mt-1 text-xl font-bold tracking-tight text-foreground">
                {formatBytes(totalStorageUsedBytes)}
              </p>
              <p className="text-[10px] text-violet-600 dark:text-violet-400 font-medium">
                ₹{breakdown.storageCost}/mo storage fee
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Total Files
                </span>
                <FolderOpen className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <p className="mt-1 text-xl font-bold tracking-tight text-foreground">
                {files.length}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  objects
                </span>
              </p>
              <p className="text-[10px] text-muted-foreground">
                Transparent rate @ ₹2/GB
              </p>
            </div>
          </div>

          {/* Contextual Ask AI Banner for Storage */}
          <button
            onClick={() =>
              openAiWithPrompt(
                "Analyze my cloud storage usage, file footprints, and give recommendations on storage tiering and cleanup."
              )
            }
            className="w-full flex items-center justify-between rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 p-3 text-left transition-all hover:border-emerald-500/50"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Ask AI about Storage & Files
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Analyze object distribution and storage efficiency
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </button>

          {/* Storage Distribution Chart */}
          <DistributionChart />

          {/* File Upload Zone */}
          <FileUploader />

          {/* Files List */}
          <FileList />
        </div>
      )}

      {/* ── SECTION 3: BILLING & COSTS ── */}
      {activeSection === "billing" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Contextual Ask AI Banner for Billing */}
          <button
            onClick={() =>
              openAiWithPrompt(
                "Explain my monthly cloud bill breakdown (Compute ₹50/resource vs Storage ₹2/GB) and suggest actionable ways to optimize it."
              )
            }
            className="w-full flex items-center justify-between rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 p-3 text-left transition-all hover:border-emerald-500/50"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Ask AI about Cost Optimization
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Estimate future expenses and prevent cloud bill shocks
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </button>

          {/* Full Billing Tab */}
          <BillingTab />
        </div>
      )}

      {/* ── MOBILE BOTTOM NAVIGATION DOCK (3 SECTIONS) ── */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-xl px-4 py-2 shadow-2xl">
        <div className="grid grid-cols-3 items-center">
          {/* Tab 1: Resources */}
          <button
            onClick={() => onSectionChange("resources")}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeSection === "resources"
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="relative">
              <Server className="h-5 w-5" />
              {abnormal.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 font-medium">Resources</span>
          </button>

          {/* Tab 2: Files */}
          <button
            onClick={() => onSectionChange("files")}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeSection === "files"
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderOpen className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">Files</span>
          </button>

          {/* Tab 3: Billing */}
          <button
            onClick={() => onSectionChange("billing")}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeSection === "billing"
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Receipt className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">Billing</span>
          </button>
        </div>
      </div>
    </div>
  );
}
