"use client";

// ---------------------------------------------------------------------------
// Resources Page — Fleet Inventory, S3 Storage, API Keys & IAM, and Costs
// ---------------------------------------------------------------------------

import { useState } from "react";
import {
  Server,
  HardDrive,
  Receipt,
  Key,
  ShieldCheck,
  Layers,
} from "lucide-react";
import {
  ResourceGrid,
  FileUploader,
  FileList,
  BillingTab,
  ApiKeysTab,
  useDashboard,
} from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";

export default function ResourcesPage() {
  const { resources, files } = useDashboard();
  const [activeTab, setActiveTab] = useState<"fleet" | "storage" | "api-keys" | "billing">(
    "fleet"
  );

  const runningCount = resources.filter((r) => r.status === "running").length;

  const tabs = [
    {
      id: "fleet" as const,
      label: "Infrastructure Fleet",
      badge: `${resources.length}`,
      icon: Server,
      activeBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      activeIconBg: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/30",
      indicatorColor: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.85)]",
    },
    {
      id: "storage" as const,
      label: "S3 Object Storage",
      badge: `${files.length} items`,
      icon: HardDrive,
      activeBg: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
      activeIconBg: "bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-purple-500/30",
      indicatorColor: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.85)]",
    },
    {
      id: "api-keys" as const,
      label: "API Keys & IAM",
      badge: `${resources.length} keys`,
      icon: Key,
      activeBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      activeIconBg: "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/30",
      indicatorColor: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.85)]",
    },
    {
      id: "billing" as const,
      label: "Cost & Usage Rates",
      badge: "Live",
      icon: Receipt,
      activeBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      activeIconBg: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/30",
      indicatorColor: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.85)]",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Cloud Resources
            </h1>
            <Badge variant="outline" className="text-xs font-mono rounded-full px-2.5 py-0.5 border-border/80 bg-muted/40">
              {resources.length} Total · {runningCount} Active
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Provision, observe status, manage API keys, and inspect cloud resources across compute, storage, databases, and serverless.
          </p>
        </div>
      </div>

      {/* Redesigned Marked Navigation: Modern Floating Segmented Dock */}
      <div className="space-y-3.5">
        <div className="inline-flex max-w-full items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-muted/30 dark:bg-zinc-900/50 border border-border/70 backdrop-blur-xl shadow-xs overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition-all shrink-0 ${
                  isActive
                    ? "bg-background dark:bg-zinc-800 text-foreground shadow-sm border border-border/80 dark:border-white/10 ring-1 ring-white/5 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-lg transition-all duration-200 ${
                    isActive
                      ? tab.activeIconBg + " shadow-xs"
                      : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/15 group-hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="tracking-tight">{tab.label}</span>
                <span
                  className={`ml-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold font-mono transition-colors border ${
                    isActive
                      ? tab.activeBg
                      : "bg-muted/60 text-muted-foreground border-transparent group-hover:border-border/40"
                  }`}
                >
                  {tab.badge}
                </span>

                {/* Colored active glow indicator underneath */}
                {isActive && (
                  <span
                    className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full ${tab.indicatorColor}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Polished Section Divider that anchors the marked area */}
        <div className="h-[1px] w-full bg-gradient-to-r from-border/90 via-primary/20 to-transparent" />
      </div>

      {/* Tab 1: Fleet Grid & Table */}
      {activeTab === "fleet" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <ResourceGrid />
        </div>
      )}

      {/* Tab 2: S3 Object Storage */}
      {activeTab === "storage" && (
        <div className="space-y-5 animate-in fade-in-50 duration-200">
          <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-5 shadow-xs">
            <h2 className="text-sm font-semibold text-foreground mb-1">
              Cloud Storage Service (S3 Buckets)
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Upload, monitor capacity, and manage binary objects stored in cloud storage.
            </p>
            <FileUploader />
          </div>
          <FileList />
        </div>
      )}

      {/* Tab 3: API Credentials & IAM Security */}
      {activeTab === "api-keys" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <ApiKeysTab />
        </div>
      )}

      {/* Tab 4: Resource Billing */}
      {activeTab === "billing" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <BillingTab />
        </div>
      )}
    </div>
  );
}
