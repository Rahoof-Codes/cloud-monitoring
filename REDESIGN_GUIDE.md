# CloudWatch Pro — Architectural Redesign Guide & System Blueprint

> **Reference Document:** System Redesign Specifications for the Cloud Resource Monitoring Dashboard  
> **Target Standard:** Figure B.1 (Auth / Shell) & Figure B.2 (Executive Summary & Multi-Page Modular Functional Architecture)

---

## 1. Executive Summary & Architectural Overview

Modern cloud operations require infrastructure dashboards to deliver **high-density telemetry without cognitive overload**. The previous monolithic design placed all charts, provisioning forms, alerts, files, and threshold configurations on a single scrolling page. 

The **CloudWatch Pro redesign** decouples this into an **8-page modular architecture**, where each domain has a dedicated viewport while sharing global real-time telemetry state via a persistent React Context (`DashboardProvider`) inside `src/app/dashboard/layout.tsx`.

```
                        ┌────────────────────────────────────────┐
                        │      CloudWatch Pro Navigation Bar     │
                        │ (Dashboard · Resources · Metrics ·     │
                        │  Thresholds · Alerts · History ·       │
                        │  Settings · Help · Logout)             │
                        └───────────────────┬────────────────────┘
                                            │
        ┌───────────────┬───────────────────┼───────────────────┬───────────────┐
        ▼               ▼                   ▼                   ▼               ▼
  /dashboard     /dashboard/resources  /dashboard/metrics  /dashboard/alerts  /dashboard/settings
 (Figure B.2      (Fleet Inventory,     (5-Stream Graphs,  (Active Alarms,    (Cloud Providers,
  Executive        Provisioning,         Time Ranges,       Controlled Test    Polling Rates,
  Summary)         S3 Buckets)           Matrix)            Harness)           API Keys)
```

---

## 2. Page-by-Page Functional Decomposition

### Page 1: Dashboard (`/dashboard`) — Executive Overview (Figure B.2)
* **Design Goal:** Instant executive health check with zero clutter.
* **Layout Structure:**
  1. **Header Bar:** Page title `Overall Summary`, real-time sync timestamp (`Last updated 5:48:12 PM · auto-refresh 30s`), and interactive `[Refresh now]` button.
  2. **Active Alarm Notice Banner:** Displays only when alarms fire, with 1-click jump to `/dashboard/alerts`.
  3. **4 Key Summary Cards:**
     * **Total Resources:** Active count with `{N} healthy` subtitle and blue accent border.
     * **CPU Utilization:** Average compute load with `EC2 average` subtitle and blue accent border.
     * **Active Alarms:** Number of active incidents with `of 5 configured` subtitle and dynamic green/red accent border.
     * **Health Score:** Dynamic composite score (0–100) based on fleet availability and breach counts.
  4. **Two-Column Split Section:**
     * **Left Column:** `CPUUtilization` card with Recharts smooth area/line chart, timestamped X-axis, and 0–100 Y-axis.
     * **Right Column:** `Monitored Resources` card with compact table (`Name`, `Type`, `Status` with green/amber pills). Clicking any row opens the detailed inspection sheet.
  5. **Quick Jump Cards:** Direct navigation shortcuts to deep-dive pages.

---

### Page 2: Resources (`/dashboard/resources`) — Fleet Inventory, S3 Storage & API Keys
* **Design Goal:** Complete lifecycle management for all infrastructure assets and cryptographic API credentials.
* **Core Capabilities:**
  * **Provisioning Modal:** Wizard to deploy Compute Instances (`VM / EC2`), Cloud Buckets (`Storage / S3`), Relational Databases (`Database / RDS`), Serverless Functions (`Serverless / Lambda`), or Network Gateways (`Network / VPC`).
  * **Dual View Mode:** Toggle between rich responsive **Grid Cards** and high-density **Sortable Data Table** (`ResourceTable`).
  * **Telemetry Gauges:** Live per-instance progress bars for CPU, Storage, Network MB/s, and Request Volume.
  * **S3 Object Storage Manager:** Dedicated sub-tab for uploading binary files, tracking storage quota, and managing stored objects.
  * **API Keys & IAM Security Sub-Tab:** Dedicated fleet-wide credential management view:
    * KMS cryptographic posture cards (`AES-256 GCM`, 90-day rotation policy).
    * Masked/revealable Access Key ID and Secret Access Key per resource with copy action.
    * Regional Ingestion Endpoints and IAM permission scopes.
    * One-click Key Rotation for individual resources or batch rotation across all fleet assets.
    * Interactive **SDK Code Snippet Modal** generating ready-to-run integration code for **cURL**, **Python (boto3 / requests)**, **Node.js (AWS SDK v3)**, and `.env` format.
  * **Redesigned Resource Detail Sheet:** Overhauled API Credentials card with encryption status badges, endpoint copy buttons, and granular IAM tags.

---

### Page 3: Metrics (`/dashboard/metrics`) — Deep-Dive Telemetry Pipeline
* **Design Goal:** High-resolution time-series observability and metric cross-comparison.
* **Core Capabilities:**
  * **5 Metric Streams:** Tabbed switcher across:
    1. **CPU Utilization (%)**
    2. **Memory Allocation (%)**
    3. **Storage Capacity (%)**
    4. **Network Throughput (MB/s)**
    5. **Request Count (req/s)**
  * **Interactive Graph Canvas:** Recharts area graph with dynamic threshold reference lines, breach anomaly markers, and peak/average overlays.
  * **Fleet Distribution Breakdown:** Pie chart classifying fleet distribution by resource type.
  * **Per-Resource Telemetry Matrix:** Comprehensive live table comparing all running instances across every metric simultaneously.

---

### Page 4: Thresholds (`/dashboard/thresholds`) — Alarm Boundaries & Anti-Flapping
* **Design Goal:** Intuitive configuration of incident triggers and detection limits.
* **Core Capabilities:**
  * **Interactive Range Controls:**
    * CPU Ceiling (20% – 100%)
    * Memory Warning (30% – 100%)
    * Storage Capacity Quota (40% – 100%)
    * Network Bandwidth Surges (10 – 200 MB/s)
    * API Request Floods (100 – 5,000 req/s)
  * **Evaluation Window (Consecutive Samples):** 1 to 5 samples dampening filter to eliminate transient spikes and prevent alarm flapping.
  * **Live Compliance Matrix:** Table showing every provisioned instance's current measurement against the configured ceiling with visual headroom progress bars.

---

### Page 5: Alerts (`/dashboard/alerts`) — Incident Center & Controlled Test Suite
* **Design Goal:** Real-time incident triage and automated demonstration harness.
* **Core Capabilities:**
  * **Controlled Test Demonstration Harness:** 1-click test simulation suite to satisfy feature requirements:
    * ⚡ **CPU Spike Test (95%):** Forces primary instance into critical CPU saturation.
    * 💾 **Storage Warning Test (94%):** Fills cloud bucket to trigger warning alarm.
    * 🌐 **Network Surge Test (88.5 MB/s):** Simulates DDoS / bandwidth surge.
    * 🚀 **Traffic Flood Test (2,450 req/s):** Simulates viral concurrency.
    * 🔄 **Healthy Baseline Reset:** Restores all metrics to safe nominal levels.
  * **Incident Triage:** Active alarms display severity badge (`CRITICAL` vs `WARNING`), trigger value vs threshold limit, timestamp, and operator actions (`Acknowledge`, `Resolve`).
  * **AI Copilot Remediation:** Direct integration with `AskAIWidget` and the full AI Copilot Studio.

---

### Page 6: AI Copilot (`/dashboard/ai`) — DevOps Intelligence & Diagnostics Studio
* **Design Goal:** Full-screen conversational AI assistant streaming telemetry-grounded diagnostics.
* **Core Capabilities:**
  * **Live Injected Telemetry Sidebar:** Continuous operational telemetry overview including health score, active alarms, running resource count, and FinOps monthly cost.
  * **Diagnostic Runbooks:** 1-click diagnostic prompts for Root-Cause Anomaly Analysis, FinOps Cost Optimization, IAM & API Key Auditing, and Resource Capacity Forecasting.
  * **Streaming Chat Canvas:** Real-time SSE token streaming from NVIDIA Meta Llama 3.2 Vision Instruct (with intelligent local fallback), markdown rendering with copyable code blocks, and conversation export as Markdown.

---

### Page 7: History (`/dashboard/history`) — Operational Audit Trail
* **Design Goal:** Immutable operational log for compliance, retrospectives, and auditing.
* **Core Capabilities:**
  * Search by event name, resource ID, or error message.
  * Filter by category (`Threshold Breaches`, `Alarm Resolutions`, `Resource State Changes`).
  * Tabular timeline recording timestamps, event severity, target resource, and resolution notes.
  * **JSON Export:** Download full incident ledger with 1 click.

---

### Page 8: Settings (`/dashboard/settings`) — Cloud Monitoring Service Config
* **Design Goal:** Telemetry ingestion engine selection and cloud credentials setup.
* **Core Capabilities:**
  * **Provider Engine Selector:**
    * Amazon Web Services (`AWS CloudWatch`)
    * Google Cloud Platform (`GCP Cloud Monitoring`)
    * Microsoft Azure (`Azure Monitor`)
    * Self-Hosted (`Prometheus / OpenTelemetry`)
  * **Collection Polling Frequency:** 5s (Real-time), 10s, 30s (Default), 60s, or Paused.
  * **Active Telemetry Streams:** Individual checkboxes to toggle CPU, RAM, Disk, Network, or Request collection.
  * **Cloud Credentials & Region:** Simulated AWS IAM Access Keys and regional endpoints (`ap-south-1`, `us-east-1`, `eu-west-1`).

---

### Page 8: Help (`/dashboard/help`) — Engineering & Redesign Reference
* **Design Goal:** In-app operational reference and architecture guide.
* **Core Capabilities:**
  * Metric mathematical formulas and sampling rates.
  * Alarm evaluation logic and hysteresis formulas.
  * Interactive architectural guide detailing page decomposition, state flow, and SDK integration.

---

## 3. Data Architecture & Telemetry Pipeline

### Telemetry State Engine (`src/components/dashboard/dashboard-provider.tsx`)
All 8 pages inherit global state from `<DashboardProvider>`:
1. **Resources Store:** Synchronized in real-time with Firestore collection `/users/{uid}/resources`.
2. **Telemetry History Map:** Ring buffer preserving the last 30 samples per resource.
3. **Simulation Drift:** Every interval (5s – 30s), running instances simulate slight metric variation within healthy boundaries.
4. **Anomaly Evaluator:** Computes rolling averages against user-configured `thresholds`. If `consecutiveSamples >= N`, an alarm is generated and toasted via `sonner`.

### Data Models (`src/lib/data.ts`)
```typescript
export interface Resource {
  id: string;
  name: string;
  type: "VM" | "Storage" | "Database" | "Serverless" | "Network";
  size?: "small" | "medium" | "large";
  region: string;
  status: "running" | "stopped" | "warning" | "error";
  cpuUsage: number;       // % (0-100)
  memoryUsage: number;    // % (0-100)
  storageUsage: number;   // % (0-100)
  networkTraffic: number; // MB/s
  requestCount: number;   // req/s
}

export interface Alert {
  id: string;
  resourceId?: string;
  resourceName: string;
  resourceType: ResourceType;
  metric: "CPU" | "Memory" | "Storage" | "Network" | "Requests";
  value: number;
  threshold: number;
  unit: string;
  severity: "critical" | "warning" | "info";
  status: "active" | "acknowledged" | "resolved";
  time: string;
  timestampMs?: number;
  reason: string;
}
```

---

## 4. Connecting Real Cloud Provider APIs

To transition from the demo simulation engine to real cloud telemetry, replace the simulation hook in `useResources.ts` with server-side API routes calling official SDKs:

### 1. Amazon CloudWatch (`@aws-sdk/client-cloudwatch`)
```typescript
import { CloudWatchClient, GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";

export async function fetchAwsMetrics(instanceId: string) {
  const client = new CloudWatchClient({ region: "ap-south-1" });
  const command = new GetMetricDataCommand({
    StartTime: new Date(Date.now() - 3600 * 1000),
    EndTime: new Date(),
    MetricDataQueries: [
      {
        Id: "cpu",
        MetricStat: {
          Metric: {
            Namespace: "AWS/EC2",
            MetricName: "CPUUtilization",
            Dimensions: [{ Name: "InstanceId", Value: instanceId }],
          },
          Period: 300,
          Stat: "Average",
        },
      },
    ],
  });
  return await client.send(command);
}
```

### 2. Google Cloud Monitoring (`@google-cloud/monitoring`)
```typescript
import { MetricServiceClient } from "@google-cloud/monitoring";

export async function fetchGcpMetrics(projectId: string) {
  const client = new MetricServiceClient();
  const [timeSeries] = await client.listTimeSeries({
    name: `projects/${projectId}`,
    filter: 'metric.type="compute.googleapis.com/instance/cpu/utilization"',
    interval: {
      startTime: { seconds: Date.now() / 1000 - 3600 },
      endTime: { seconds: Date.now() / 1000 },
    },
  });
  return timeSeries;
}
```

---

## 5. Summary of Redesign Verification

| Verification Dimension | Result | Notes |
|---|---|---|
| **TypeScript Compilation** | **Clean (0 errors)** | `npx tsc --noEmit` exits with code 0 across all 8 sub-pages. |
| **Unit Test Suite** | **9/9 Passing** | `npm test` validates telemetry snapshots, anomaly detection, abnormal flags, and billing. |
| **Production Build** | **Success** | `npm run build` compiled 16/16 static & dynamic routes with Next.js Turbopack. |
| **Attendence Directory** | **Strictly Untouched** | 100% compliant with isolation constraint. |
