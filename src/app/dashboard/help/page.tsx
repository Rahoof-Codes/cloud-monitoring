"use client";

// ---------------------------------------------------------------------------
// Help Page — Metric Reference, Alarm Engine & Architectural Redesign Guide
// ---------------------------------------------------------------------------

import { useState } from "react";
import {
  BookOpen,
  Activity,
  ShieldAlert,
  Layers,
  Code2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HelpPage() {
  const [openSection, setOpenSection] = useState<string | null>("routes");

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Help & Architectural Redesign Guide
          </h1>
          <Badge variant="outline" className="text-xs">
            CloudWatch Pro Reference
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Comprehensive metric definitions, threshold evaluation algorithms, and an architectural blueprint for redesigning this system.
        </p>
      </div>

      {/* ── Section 1: Monitored Metric Definitions & Formulas ── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-sm font-semibold tracking-tight">
              1. Cloud Metric Definitions & Formulas
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Standard metrics collected across compute, storage, databases, and networking
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/40 text-muted-foreground bg-muted/20">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Metric</th>
                  <th className="px-4 py-2.5 font-medium">Unit</th>
                  <th className="px-4 py-2.5 font-medium">Default Threshold</th>
                  <th className="px-4 py-2.5 font-medium">Formula / Extraction Method</th>
                  <th className="px-4 py-2.5 font-medium">Operational Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                <tr>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    CPU Utilization
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">%</td>
                  <td className="px-4 py-3 font-mono text-rose-500 font-bold">&gt; 80%</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                    (User_Time + System_Time) / Total_Time × 100
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Identifies runaway loops, deadlocks, and CPU saturation on VMs.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    Memory Utilization
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">%</td>
                  <td className="px-4 py-3 font-mono text-rose-500 font-bold">&gt; 80%</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                    (Total_RAM - Available_RAM) / Total_RAM × 100
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Detects memory leaks and prevents Out-of-Memory (OOM) kernel panics.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    Storage Capacity
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">%</td>
                  <td className="px-4 py-3 font-mono text-rose-500 font-bold">&gt; 85%</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                    (Allocated_Bytes - Free_Bytes) / Volume_Quota × 100
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Alerts before disks become write-locked or S3 quotas are exceeded.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    Network Throughput
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">MB/s</td>
                  <td className="px-4 py-3 font-mono text-rose-500 font-bold">&gt; 60 MB/s</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                    (Bytes_In + Bytes_Out) / Interval_Seconds / 1,048,576
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Flags network interface bottlenecks, bandwidth surges, or DDoS spikes.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    Request Count
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">req/s</td>
                  <td className="px-4 py-3 font-mono text-rose-500 font-bold">&gt; 1,200 req/s</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                    Total_HTTP_Requests / Sample_Interval_Seconds
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Monitors ingress traffic spikes, concurrency loads, and load balancer limits.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: Threshold Alarm Evaluation & Anti-Flapping Engine ── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            <CardTitle className="text-sm font-semibold tracking-tight">
              2. Alarm Evaluation & Anti-Flapping Engine
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Mathematical logic governing anomaly detection and notification dispatch
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 text-xs text-muted-foreground">
          <p>
            Alarms are evaluated on each incoming telemetry sample using a <strong>rolling consecutive breach window</strong>. An alarm fires if and only if:
          </p>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 font-mono text-[11px] text-foreground">
            Consecutive_Samples(Value &gt; Threshold) &gt;= Configured_Evaluation_Window
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5 rounded-lg border border-border/40 p-3 bg-card">
              <h4 className="font-semibold text-foreground text-xs">Anti-Flapping Dampening</h4>
              <p>
                Spurious transient spikes lasting only 1 sample interval are ignored. Setting the window to 2–3 samples ensures alerts reflect true persistent degradation.
              </p>
            </div>
            <div className="space-y-1.5 rounded-lg border border-border/40 p-3 bg-card">
              <h4 className="font-semibold text-foreground text-xs">Automatic Severity Classification</h4>
              <p>
                Metrics exceeding threshold by &lt;15% are tagged as <strong>WARNING</strong>. Breaches &gt;=15% above threshold are escalated to <strong>CRITICAL</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 3: Redesign Blueprint & Multi-Page Architecture ── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-purple-500" />
            <CardTitle className="text-sm font-semibold tracking-tight">
              3. Blueprint for Redesigning this Project
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Step-by-step architectural breakdown for decoupling and extending the system
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3 text-xs">
          {/* Item 1 */}
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("routes")}
              className="w-full flex items-center justify-between p-3.5 bg-muted/20 hover:bg-muted/40 text-left font-semibold text-xs text-foreground transition-colors"
            >
              <span>Page Decomposition & URL Route Hierarchy</span>
              {openSection === "routes" ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {openSection === "routes" && (
              <div className="p-3.5 border-t border-border/40 text-muted-foreground space-y-2 bg-card">
                <p>
                  Instead of crowding all functionality into a single monolithic view, the application is decoupled into 9 specialized routes:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>/dashboard</strong>: Executive overview (Overall Summary, health score, primary CPU chart, quick monitored resources table matching CloudWatch Pro Figure B.2).</li>
                  <li><strong>/dashboard/resources</strong>: Full inventory lifecycle (VM, Storage, DB, Serverless, Network), provisioning modals, and S3 file bucket manager.</li>
                  <li><strong>/dashboard/metrics</strong>: Multi-metric telemetry graphs, time-range selectors (15m, 1h, 6h, 24h), and resource telemetry matrices.</li>
                  <li><strong>/dashboard/thresholds</strong>: Visual sliders for CPU, Memory, Disk, Network, and Requests, with consecutive breach dampening.</li>
                  <li><strong>/dashboard/alerts</strong>: Active and resolved incidents, AI copilot triage, and the 1-click Controlled Test suite.</li>
                  <li><strong>/dashboard/ai</strong>: Dedicated full-screen AI Copilot Studio with real-time telemetry-grounded diagnostics and runbooks.</li>
                  <li><strong>/dashboard/history</strong>: Immutable audit ledger of events, alarms, and resolutions with JSON export.</li>
                  <li><strong>/dashboard/settings</strong>: Monitoring provider selection (AWS, GCP, Azure, Prometheus), polling interval, and API keys.</li>
                  <li><strong>/dashboard/help</strong>: In-app documentation and metric engineering guide.</li>
                </ul>
              </div>
            )}
          </div>

          {/* Item 2 */}
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("state")}
              className="w-full flex items-center justify-between p-3.5 bg-muted/20 hover:bg-muted/40 text-left font-semibold text-xs text-foreground transition-colors"
            >
              <span>Global State Persistence via DashboardProvider</span>
              {openSection === "state" ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {openSection === "state" && (
              <div className="p-3.5 border-t border-border/40 text-muted-foreground space-y-2 bg-card">
                <p>
                  All pages share a persistent React Context (`DashboardProvider`) instantiated inside <code>src/app/dashboard/layout.tsx</code>. This ensures:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Navigating between pages preserves active alert notifications and metric history.</li>
                  <li>Polling intervals and manual refreshes update all components simultaneously.</li>
                  <li>Controlled tests triggered on the Alerts page immediately update the charts on Dashboard and Metrics pages.</li>
                </ul>
              </div>
            )}
          </div>

          {/* Item 3 */}
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("cloud")}
              className="w-full flex items-center justify-between p-3.5 bg-muted/20 hover:bg-muted/40 text-left font-semibold text-xs text-foreground transition-colors"
            >
              <span>Connecting Real Cloud Provider APIs</span>
              {openSection === "cloud" ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {openSection === "cloud" && (
              <div className="p-3.5 border-t border-border/40 text-muted-foreground space-y-2 bg-card">
                <p>
                  To replace synthetic drift with real cloud metrics, implement standard cloud SDK fetchers:
                </p>
                <div className="rounded border bg-muted/40 p-2.5 font-mono text-[11px] text-foreground">
                  // AWS CloudWatch API Integration<br />
                  import &#123; CloudWatchClient, GetMetricDataCommand &#125; from &quot;@aws-sdk/client-cloudwatch&quot;;<br />
                  const client = new CloudWatchClient(&#123; region: &quot;ap-south-1&quot; &#125;);<br />
                  const response = await client.send(new GetMetricDataCommand(&#123; ... &#125;));
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
