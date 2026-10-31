# Cloud Resource Monitor — Comprehensive Project Documentation

> **Real-Time Cloud Infrastructure Observability, Transparent Billing & Streaming AI Advisor**  
> Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **Firebase (Auth & Firestore)**, and **NVIDIA AI (Llama 3.2 Streaming)**.

---

## Table of Contents

1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [Key Features & Innovations](#2-key-features--innovations)
3. [System Architecture & Data Flow](#3-system-architecture--data-flow)
4. [Component & Directory Structure](#4-component--directory-structure)
5. [Telemetry & Simulation Engine](#5-telemetry--simulation-engine)
6. [Hybrid Storage Architecture (Firestore + IndexedDB)](#6-hybrid-storage-architecture-firestore--indexeddb)
7. [Predictable Billing Engine & Mathematics](#7-predictable-billing-engine--mathematics)
8. [Real-Time Streaming AI Advisor Pipeline](#8-real-time-streaming-ai-advisor-pipeline)
9. [Authentication & Multiple Sign-In Options (Google, Email, Phone OTP)](#9-authentication--multiple-sign-in-options-google-email-phone-otp)
10. [Database Schema & Security Rules](#10-database-schema--security-rules)
11. [User Experience & Responsive Design](#11-user-experience--responsive-design)
12. [Environment Configuration & Setup Guide](#12-environment-configuration--setup-guide)
13. [Hackathon Demo & Pitch Presentation Script](#13-hackathon-demo--pitch-presentation-script)
14. [Monitored Resources, Metric Definitions & Threshold Alert Configuration](#14-monitored-resources-metric-definitions--threshold-alert-configuration)
15. [Cloud AI Copilot & IAM API Credentials Redesign](#15-cloud-ai-copilot--iam-api-credentials-redesign)
16. [Limitations & Simulation Details](#16-limitations--simulation-details)
17. [Dual-Mode Data Architecture & Zero-Trust Cloud Credential Vault](#17-dual-mode-data-architecture--zero-trust-cloud-credential-vault)

---

## 1. Executive Summary & Problem Statement

### The Problem
Modern cloud operations present major challenges for developers, startups, and DevOps engineers:
1. **Opaque & Shocking Cloud Bills**: Hyperscalers (AWS, Azure, GCP) utilize complex multidimensional pricing models (data transfer egress, IOPS, provisioned capacity) leading to unexpected billing spikes.
2. **Fragmented Tooling**: Telemetry, storage management, billing, and incident response are isolated across separate tools (Datadog, AWS S3 Console, AWS Cost Explorer, PagerDuty).
3. **Alert Fatigue & Disconnected AI**: Generic LLMs lack real-time infrastructure context; users must copy-paste logs, metrics, and instance names into separate chatbot interfaces to receive guidance.

### The Solution: Cloud Resource Monitor
**Cloud Resource Monitor** is a unified, single-pane-of-glass cloud management platform combining:
- **Instant Observability**: Real-time compute health metrics, CPU/memory telemetry, and instant anomaly alerting.
- **Predictable Cost Transparency**: Transparent, usage-based pricing grounded in AWS Mumbai (ap-south-1) on-demand rates (e.g. ₹0.85/hr for small VMs, ₹1.50/hr for databases, ₹2.00/hr for network ingress, and ₹2.00/GB per month for storage) with per-second billing and ₹0 for stopped instances.
- **Grounded Streaming AI Advisor**: An integrated AI copilot powered by Meta Llama 3.2 on NVIDIA's AI infrastructure, connected via Server-Sent Events (SSE) with live telemetry grounding and a fluid word-by-word typewriter interface.
- **Zero-Friction Hybrid Storage**: File management supporting files up to 200MB using a hybrid Firestore + browser IndexedDB architecture that eliminates cloud storage billing barriers for demos and prototypes.
- **Authentication & Account Security**: Multiple sign-in options (Google OAuth, Email/Password, and SMS OTP verification) with mobile phone linking via Invisible reCAPTCHA.

---

## 2. Key Features & Innovations

| Category | Capability | Technical Highlight |
| :--- | :--- | :--- |
| **Observability** | Live Compute Telemetry | Real-time tracking of VMs, Databases, and Networks with dynamic CPU/Memory status. |
| **Observability** | Anomaly Detection | Automated alerting banner for resources with >80% CPU utilization or error states. |
| **Observability** | Resource Controls | Instant Start/Stop and Delete actions with zero-latency Firestore synchronization. |
| **Storage** | Hybrid File Storage | Small files (≤ 700 KB) stored inline as base64; large files (> 700 KB up to 200 MB) stored in IndexedDB with Firestore metadata sync. |
| **FinOps** | Transparent Billing | Real-time bill calculations based on AWS Mumbai on-demand hourly rates + ₹2/GB storage, per-second tracking, and ₹0 for stopped instances. |
| **FinOps** | Cost Visualizations | Recharts donut breakdown, monthly estimate cards, and daily cost history chart. |
| **AI Advisor** | Grounded Telemetry | Injects live system metrics, anomaly lists, and active billing totals into every prompt context. |
| **AI Advisor** | Streaming SSE | Fluid word-by-word streaming using an adaptive typewriter buffer (18ms cadence, dynamic backlog acceleration). |
| **AI Advisor** | Multi-Turn Memory | Retains conversation history (up to 8 turns) and allows stopping generation on demand. |
| **Security** | Multiple Sign-In Options | Multiple sign-in options (Google, Email, Phone OTP) via Firebase & Invisible reCAPTCHA. |
| **Security** | User Isolation | Strict Firestore Security Rules ensuring users can only read and write their own data tree (`request.auth.uid == uid`). |
| **Design** | Responsive Layouts | Desktop multi-column dashboard + Mobile 3-section segmented navigation (Resources, Files, Billing) with floating AI assistant. |

---

## 3. System Architecture & Data Flow

### Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["Client Tier (Next.js 16 + React 19)"]
        UI["Dashboard UI (Tailwind CSS v4)"]
        Ctx["DashboardProvider Context"]
        AuthHook["useAuth()"]
        ResHook["useResources()"]
        FileHook["useFiles()"]
        SimLoop["5s Telemetry Simulation Loop"]
        IDB["Browser IndexedDB (Blobs <= 200MB)"]
        AICopilot["AI Copilot Studio (/dashboard/ai) & Drawer Widget"]
    end

    subgraph Server["Next.js Server Tier"]
        ApiRoute["API Route: /api/ai (NextRequest / ReadableStream)"]
    end

    subgraph Firebase["Firebase Cloud Infrastructure"]
        FBAuth["Firebase Authentication\n(Google, Email, Phone SMS)"]
        Firestore["Cloud Firestore\n(/users/{uid}/resources\n/users/{uid}/files)"]
    end

    subgraph External["External AI Provider"]
        NvidiaAPI["NVIDIA AI Foundation Endpoints\n(Meta Llama 3.2 11B Vision Instruct)"]
    end

    %% Auth & User
    UI --> Ctx
    Ctx --> AuthHook
    AuthHook <-->|Tokens / Auth State| FBAuth
    AuthHook -->|Upsert User Profile| Firestore

    %% Resources & Simulation
    Ctx --> ResHook
    ResHook <-->|onSnapshot (Real-Time CRUD)| Firestore
    SimLoop -->|Nudge CPU/Mem Every 5s| Firestore

    %% Files & Hybrid Storage
    Ctx --> FileHook
    FileHook -->|Binary Blobs > 700KB| IDB
    FileHook <-->|Metadata & Base64 <= 700KB| Firestore

    %% AI Streaming Flow
    AIWidget -->|POST /api/ai with Telemetry Context| ApiRoute
    ApiRoute -->|Bearer Auth / Streaming POST| NvidiaAPI
    NvidiaAPI -->|Upstream SSE Stream| ApiRoute
    ApiRoute -->|text/event-stream (SSE)| AIWidget
    AIWidget -->|Adaptive Typewriter Engine| UI
```

### Data Flow Lifecycle

1. **User Sign-In**: User logs in with Google, Email/Password, or Phone. `useAuth` listens to `onAuthStateChanged`, creates/updates `/users/{uid}`, and initializes context.
2. **Real-Time Resource Sync**: `useResources` initializes an `onSnapshot` listener on `/users/{uid}/resources`. Every change in the database immediately updates the React state.
3. **Continuous Simulation**: A 5-second interval nudges CPU and memory by small deltas for active instances. Spikes over 90% auto-flag the resource as `warning`.
4. **Instant Cost Recalculation**: Any change in resource state (start/stop/add/delete) or file upload immediately calculates the new cost and updates `/users/{uid}.estimatedMonthlyCost`.
5. **AI Telemetry Injection**: When the user asks a question, `AskAIWidget` snapshots the user profile, running count, stopped count, anomaly list, file storage footprint, and live bill, passing it to `/api/ai`.
6. **Streaming Response**: `/api/ai` calls NVIDIA's Llama 3.2 model with streaming enabled, returning an SSE stream. The frontend adaptive typewriter reveals words smoothly with auto-scroll and markdown parsing.

---

## 4. Component & Directory Structure

```
d:/Hackathon/cloud-dashboard/
├── .env.local                          # Environment secrets (Firebase & NVIDIA API keys)
├── firestore.rules                     # Cloud Firestore security rules
├── storage.rules                       # Firebase Storage security rules
├── package.json                        # Dependencies (Next 16, React 19, Recharts, Firebase)
├── DOCUMENTATION.md                    # Complete project documentation (this document)
├── README.md                           # Quickstart guide & repository overview
├── public/                             # Static assets & icons
└── src/
    ├── app/
    │   ├── api/
    │   │   └── ai/
    │   │       └── route.ts            # SSE streaming endpoint with NVIDIA Llama 3.2
    │   ├── dashboard/
    │   │   └── page.tsx                # Main authenticated dashboard page
    │   ├── login/
    │   │   └── page.tsx                # Multi-channel login page (Google, Email, Phone)
    │   ├── globals.css                 # Tailwind CSS v4 tokens, design variables & animations
    │   ├── layout.tsx                  # Root layout with Toaster & theme provider
    │   └── page.tsx                    # Root redirection to /dashboard
    ├── components/
    │   ├── dashboard/
    │   │   ├── ask-ai-widget.tsx       # AI assistant drawer, typewriter, quick prompts
    │   │   ├── attention-panel.tsx     # High-priority alert banner for abnormal resources
    │   │   ├── billing-tab.tsx         # Cost breakdown, rate tooltips, donut chart
    │   │   ├── charts.tsx              # Recharts CPU time-series area & distribution pie
    │   │   ├── dashboard-provider.tsx  # Central React context connecting hooks to UI
    │   │   ├── file-list.tsx           # File management table with download & delete
    │   │   ├── file-uploader.tsx       # Drag-and-drop file upload with progress bar
    │   │   ├── mobile-sections.tsx     # Segmented 3-section mobile layout (Resources, Files, Billing)
    │   │   ├── profile-dialog.tsx      # User profile view and phone number linking dialog
    │   │   ├── resource-detail-sheet.tsx # Slide-out drawer for inspecting resource details
    │   │   ├── resource-grid.tsx       # Resource card grid with Add, Start/Stop, and Delete
    │   │   ├── summary-cards.tsx       # KPI overview cards (Resources, Anomalies, Storage, Cost)
    │   │   ├── theme-toggle.tsx        # Dark/light mode switcher
    │   │   └── top-bar.tsx             # Header navigation, brand logo, avatar dropdown
    │   └── ui/                         # Reusable UI primitives (dialog, button, card, tabs, etc.)
    └── lib/
        ├── cost.ts                     # Transparent cost calculation functions & formatters
        ├── data.ts                     # Mock CPU time series generator & distribution utilities
        ├── fileStorage.ts              # Browser IndexedDB wrapper for large blobs (up to 200MB)
        ├── firebase.ts                 # Firebase app initialization, Auth & Firestore clients
        ├── useAuth.ts                  # Authentication state, login methods & phone linking
        ├── useFiles.ts                 # File storage hook with hybrid IndexedDB/Firestore sync
        ├── useResources.ts             # Live Firestore resource subscription & CRUD helpers
        └── utils.ts                    # Classname merging utility (cn)
```

---

## 5. Telemetry & Simulation Engine

Located in [`src/lib/useResources.ts`](file:///d:/Hackathon/cloud-dashboard/src/lib/useResources.ts) and [`src/lib/data.ts`](file:///d:/Hackathon/cloud-dashboard/src/lib/data.ts).

### 1. Real-Time Data Synchronization
- Uses Firestore's `onSnapshot` listener on `/users/{uid}/resources` ordered by `createdAt desc`.
- Client UI responds with zero refresh lag when resources are created, edited, or deleted.

### 2. Client-Side Telemetry Drift Simulation
To mimic a production cloud environment without requiring real cloud provider credentials:
- Every 5 seconds, an interval selects all non-stopped instances.
- Applies jitter:
  `Delta CPU = (rand() - 0.5) * 8`
  `Delta Mem = (rand() - 0.5) * 6`
- Metrics are clamped within `[0, 100]%`.
- **Automated State Transitions**:
  - If CPU or Memory > 90%, instance status transitions to `warning`.
  - When metrics stabilize below 85%, status reverts to `running`.
  - If stopped, CPU and Memory drop to 0%.

### 3. Anomaly Auditing
- `getAbnormalResources(resources)` evaluates:
  - CPU Usage > 85% OR
  - Memory Usage > 85% OR
  - Status is "warning" or "error"
- Detected resources immediately render into the [`AttentionPanel`](file:///d:/Hackathon/cloud-dashboard/src/components/dashboard/attention-panel.tsx) with a red pinging indicator and direct-drill action buttons.

---

## 6. Hybrid Storage Architecture (Firestore + IndexedDB)

Located in [`src/lib/fileStorage.ts`](file:///d:/Hackathon/cloud-dashboard/src/lib/fileStorage.ts) and [`src/lib/useFiles.ts`](file:///d:/Hackathon/cloud-dashboard/src/lib/useFiles.ts).

### The Challenge
Firestore has a strict **1MB document size limit**, and Firebase Cloud Storage requires a paid Blaze Plan credit card for production uploads.

### The Hybrid Storage Solution
To enable seamless hackathon evaluations and demonstrations with real files up to **200MB**:

1. **Small Files (≤ 700 KB)**:
   - Binary converted to Base64 Data URL via `FileReader`.
   - Stored directly inside the Firestore document at `/users/{uid}/files/{fileId}`.
   - Synchronized across devices.

2. **Large Files (> 700 KB up to 200 MB)**:
   - Binary stored safely in the browser's local **IndexedDB** (`CloudMonitorStore` / `blobs` object store).
   - Full metadata (filename, size in bytes, MIME type, upload timestamp, `isLocalBlob: true`) is stored in Cloud Firestore.
   - User document `totalStorageUsedBytes` is recalculated and stored in Firestore.
   - Enables full telemetry, cost calculations, and file lists while staying completely free of external cloud storage billing.

---

## 7. Predictable Billing Engine & Mathematics

Located in [`src/lib/pricing.ts`](file:///d:/Hackathon/cloud-dashboard/src/lib/pricing.ts), [`src/lib/billing.ts`](file:///d:/Hackathon/cloud-dashboard/src/lib/billing.ts), and [`src/components/dashboard/billing-tab.tsx`](file:///d:/Hackathon/cloud-dashboard/src/components/dashboard/billing-tab.tsx).

### Transparent Pricing Formula

```
Total Monthly Bill (₹) = Σ (Running Seconds × Hourly Rate / 3600) + (Storage Used in GB × ₹2.00)
```

### AWS Mumbai (ap-south-1) Rate Card
1. **Compute Instances (VM)**: Small (t3.micro) ₹0.85/hr, Medium (t3.medium) ₹3.40/hr, Large (m6i.large) ₹8.00/hr.
2. **Managed Databases**: Small (db.t3.micro) ₹1.50/hr, Medium (db.t3.medium) ₹6.00/hr, Large (db.m6i.large) ₹12.00/hr.
3. **Network Services**: Application Load Balancer / NLB / CDN ₹2.00/hr.
4. **Cloud Storage Buckets**: Standard Bucket ₹0.50/hr, SSD Pool ₹1.50/hr, Multi-Region ₹3.50/hr.
5. **Serverless Functions**: Micro ₹0.30/hr, Standard ₹1.00/hr, Container ₹2.50/hr.
6. **Object Storage**: ₹2.00 per GB per month (calculated down to fractional bytes and rounded to paisa).

### Key Financial Rules
1. **Per-Second Granularity**: Compute charges accrue strictly by running duration in seconds, with a 60-second minimum charge window (`MIN_BILLABLE_SECONDS = 60`).
2. **Zero-Cost Inactivity**: Stopped resources incur **₹0.00/hr** compute cost. This provides immediate incentive to shut down idle resources.
3. **Persistent Usage Audit Trail**: When a resource is stopped or deleted, its accrued usage sessions remain captured in Firestore and the monthly bill.
4. **Soft Free Tier Cap**: 1 GB (1,073,741,824 bytes). The system warns users when storage usage exceeds 80% of this threshold.

### Worked Example Calculation
- Run a **Small VM (t3.micro @ ₹0.85/hr)** for **3 hours**: 3 hours × ₹0.85/hr = ₹2.55 compute fee.
- Store **10 GB** of log files: 10 GB × ₹2.00/GB = ₹20.00 storage fee.
- **Total Monthly Invoice**: ₹2.55 + ₹20.00 = **₹22.55**.

Whenever a resource is stopped, started, or a file is deleted, `calculateMonthlyBill()` recalculates this value and updates the user's Firestore profile document.

---

## 8. Real-Time Streaming AI Advisor Pipeline

Located in [`src/app/api/ai/route.ts`](file:///d:/Hackathon/cloud-dashboard/src/app/api/ai/route.ts) and [`src/components/dashboard/ask-ai-widget.tsx`](file:///d:/Hackathon/cloud-dashboard/src/components/dashboard/ask-ai-widget.tsx).

### 1. The Streaming Pipeline
```
[User Input + Telemetry Snapshot]
           │
           ▼
[POST /api/ai] ── Server-side NVIDIA API Key
           │
           ▼
[NVIDIA API: meta/llama-3.2-11b-vision-instruct]
           │
   SSE upstream chunks
           │
           ▼
[ReadableStream Transform & Filtering]
           │
   Client SSE: data: {"text": "..."}
           │
           ▼
[AskAIWidget Adaptive Typewriter Buffer]
           │
   Smooth 18ms word-by-word reveal (55 words/sec)
           │
           ▼
[Live Rendered Markdown in Chat Drawer]
```

### 2. Telemetry Grounding Context
The AI advisor does not guess. Every request bundles the user's real-time infrastructure state into the system prompt:
```json
{
  "user": { "displayName": "John Doe", "email": "john@example.com" },
  "summary": {
    "totalResources": 5,
    "runningResources": 3,
    "stoppedResources": 2,
    "abnormalCount": 1,
    "totalStorageUsed": "2.1 GB",
    "estimatedMonthlyCost": "₹154.20",
    "computeCost": "₹150.00",
    "storageCost": "₹4.20"
  },
  "resources": [
    { "name": "prod-db-primary", "type": "Database", "status": "running", "cpuPercent": "94%", "isAbnormal": true }
  ]
}
```

### 3. Strict Guardrails & Behavior Rules
- **No Repeated Introductions**: Greets on the first interaction; answers subsequent questions directly.
- **Conversational Memory**: Retains the last 8 turns of context for seamless follow-ups (e.g. "what about billing?", "tell me more").
- **Financial Precision**: Provides exact figures immediately based on the transparent pricing formula, without asking vague questions about instance types.
- **Stop Generation**: Users can cancel long responses mid-stream using an `AbortController`.
- **Adaptive Typewriter Cadence**: Employs an 18ms loop revealing 1 to 4 words per tick depending on backlog size to prevent model lag while preserving human-readable cadence.

---

## 9. Authentication & Multiple Sign-In Options (Google, Email, Phone OTP)

Located in [`src/lib/useAuth.ts`](file:///d:/Hackathon/cloud-dashboard/src/lib/useAuth.ts), [`src/app/login/page.tsx`](file:///d:/Hackathon/cloud-dashboard/src/app/login/page.tsx), and [`src/components/dashboard/profile-dialog.tsx`](file:///d:/Hackathon/cloud-dashboard/src/components/dashboard/profile-dialog.tsx).

### 1. Authentication Channels
1. **Google OAuth 2.0**: Single-click sign-in via Firebase `signInWithPopup`.
2. **Email & Password**: Includes input validation, minimum 6-character passwords, and registration with display names.
3. **Phone Number (SMS OTP)**: Phone number sign-in and verification using Firebase `signInWithPhoneNumber` and `RecaptchaVerifier` (Invisible reCAPTCHA).

### 2. Mobile Number Linking
- Users who sign in with Google or Email can link their mobile phone number to their account.
- Handled through `linkWithPhoneNumber` and OTP confirmation in the Profile Dialog.
- Users can unlink their phone number anytime with automatic Firestore updates.

---

## 10. Database Schema & Security Rules

### Firestore Document Structure

```
/users/{uid}                                    [User Profile Document]
  ├── displayName: string
  ├── email: string
  ├── photoURL: string
  ├── phoneNumber: string
  ├── totalStorageUsedBytes: number
  ├── estimatedMonthlyCost: number
  ├── createdAt: timestamp
  │
  ├── /resources/{resourceId}                   [Sub-collection: Resources]
  │     ├── name: string                        # e.g., "prod-api-server"
  │     ├── type: "VM" | "Database" | "Network"
  │     ├── status: "running" | "stopped" | "warning" | "error"
  │     ├── region: string                      # "us-east-1", "eu-west-1", etc.
  │     ├── cpuUsage: number                    # 0 - 100
  │     ├── memoryUsage: number                 # 0 - 100
  │     ├── createdAt: timestamp
  │     └── lastUpdated: timestamp
  │
  └── /files/{fileId}                           [Sub-collection: Files]
        ├── fileName: string                    # e.g., "database-backup.sql"
        ├── sizeBytes: number                   # File size in bytes
        ├── mimeType: string                    # e.g., "application/sql"
        ├── dataUrl: string                     # Base64 string if <= 700KB
        ├── isLocalBlob: boolean                # true if stored in IndexedDB
        └── uploadedAt: timestamp
```

### Firestore Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Strict multi-tenant isolation: Users can only read/write their own document tree
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

---

## 11. User Experience & Responsive Design

### Desktop Layout (≥ 768px)
- **Sticky Top Bar**: Brand logo, theme toggle (light/dark), user avatar, and profile dropdown.
- **Attention Panel**: Alert banner automatically rendering active anomalies (>80% CPU).
- **Summary KPI Cards**: Quick overview of Total Resources, Active Anomalies, Storage Footprint, and Estimated Monthly Bill.
- **Charts Row**:
  - 24-Hour CPU Time-Series Area Chart (`Recharts`).
  - Resource Type Distribution Donut Chart (`VM`, `Database`, `Network`).
- **Tabbed Workspace**:
  - **Resources**: Card grid with live health bars, status badges, Start/Stop toggle, Add Resource modal, and detail slide-over sheet.
  - **Files**: Drag-and-drop file uploader, live progress bar, and file list table with download/delete.
  - **Billing**: Cost summary cards, pricing formula breakdown, and storage vs. compute donut chart.
- **Docked AI Assistant**: Floating bottom-right action button expanding into a full chat drawer with quick prompt pills, copy-to-clipboard, stop generation, and auto-scroll.

### Mobile Layout (< 768px)
- **Segmented Top Bar**: Dedicated 3-section switch (Resources, Files, Billing) with badge counts.
- **Optimized Touch Targets**: Cards adapted for single-column touch interaction.
- **Compact Floating AI**: Ergonomic round floating button with badge counter that opens an optimized modal dialog.

---

## 12. Environment Configuration & Setup Guide

### Prerequisites
- Node.js 18+ or 20+
- npm, pnpm, or yarn
- A Firebase project with Authentication and Firestore enabled
- An NVIDIA AI Foundation API key (for Meta Llama 3.2)

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/Rahoof-Codes/Cloud-Resource-Monitoring-Dashboard.git
cd Cloud-Resource-Monitoring-Dashboard

# Install dependencies
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the `cloud-dashboard/` root:

```env
# Firebase Configuration (from Firebase Console > Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# NVIDIA AI Foundation Endpoints Key (Server-Side Only)
NVIDIA_API_KEY=nvapi-your_nvidia_api_key
```

### 3. Firebase Console Configuration
1. **Authentication**: Enable Google, Email/Password, and Phone providers under Authentication > Sign-in method.
2. **Firestore Database**: Create a Firestore database in production mode and deploy `firestore.rules`.

### 4. Running Locally
```bash
# Start the Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 13. Hackathon Demo & Pitch Presentation Script

### 2-Minute Elevator Pitch
> *"Judges, cloud infrastructure management today is broken. Small teams and developers are blindsided by unexpected AWS or GCP bills, forced to juggle multiple dashboards, and disconnected from actionable AI.  
> We built **Cloud Resource Monitor** — a next-generation observability dashboard that brings sanity back to the cloud.  
> It features a 100% predictable pricing model grounded in AWS Mumbai (ap-south-1) on-demand hourly pricing (e.g. ₹0.85 to ₹8.00/hr compute, ₹2.00/GB per month storage) with per-second billing and ₹0 for idle instances. With live Firestore reactivity, users see metrics update in real time.  
> When a spike occurs, our integrated **AI Cloud Advisor**, powered by Llama 3.2 and streaming over Server-Sent Events, doesn't just give generic answers — it inspects real-time telemetry and diagnoses the bottleneck on the spot.  
> Paired with hybrid client-side storage supporting files up to 200MB and multiple sign-in options (Google, Email, Phone OTP), Cloud Resource Monitor is the observability platform developers actually want to use."*

### 3-Minute Live Demo Walkthrough

1. **Sign-In & Profile (30s)**:
   - Demonstrate Google OAuth or Email sign-in.
   - Open Profile Dialog and showcase the SMS Phone Linking flow with invisible reCAPTCHA.
2. **Observability & Anomaly Detection (45s)**:
   - Show the live CPU/Memory drift simulation updating cards in real time.
   - Point out an instance spiking over 85% and how it automatically triggers the **Needs Attention** alert banner.
   - Click the instance to open the **Resource Detail Sheet**, then toggle its status from "Running" to "Stopped".
3. **Predictable Billing in Action (45s)**:
   - Navigate to the **Billing** tab.
   - Highlight how stopping the instance immediately halts compute charges in real time.
   - Upload a test file (document or image) and show the storage bill recalculating live down to the paisa.
4. **Grounded AI Advisor (60s)**:
   - Click the floating **Ask AI** button in the bottom right.
   - Click the quick prompt **"Audit Anomalies"** or ask: *"What is my current monthly bill and what should I do about high CPU?"*
   - Showcase the fluid typewriter streaming, Markdown formatting, live telemetry citation, and instant actionable recommendations.

---

## 14. Monitored Resources, Metric Definitions & Threshold Alert Configuration

### 14.1 Monitored Cloud Resources

| Resource Type | Provider Mapping | Monitored Telemetry | On-Demand Rate (ap-south-1) |
| :--- | :--- | :--- | :--- |
| **VM (Compute)** | AWS EC2 / GCP Compute Engine | CPU Utilization, Memory, Disk IOPS | ₹0.85/hr (Small), ₹3.40/hr (Medium), ₹8.00/hr (Large) |
| **Database** | Amazon RDS / Managed PostgreSQL / Redis | Query Load, Memory Buffer, Connections | ₹1.50/hr (Small), ₹6.00/hr (Medium), ₹12.00/hr (Large) |
| **Network** | Application Load Balancer / Ingress ALB | Bandwidth Throughput (MB/s), Request Rate | ₹2.00/hr (Standard ALB / L4 / CDN) |
| **Storage Service** | AWS S3 Bucket / GCS Object Pool | Storage Capacity (%), Object Count, Egress | ₹0.50/hr (Standard), ₹1.50/hr (SSD), ₹3.50/hr (Multi-Region) |
| **Serverless** | AWS Lambda / Cloud Functions | Invocations/sec, Execution Duration, Concurrency | ₹0.30/hr (Micro), ₹1.00/hr (Standard), ₹2.50/hr (Container) |

### 14.2 Metric Definitions & Formulas

1. **CPU Utilization (%)**:
   `CPU Usage (%) = (Active vCPU Execution Cycles / Total Available Clock Cycles) * 100`  
   Sampled continuously every 5 seconds. Triggers Warning at > 80% and Critical at ≥ 90%.

2. **Memory Utilization (%)**:
   `RAM Consumption (%) = (Allocated Physical RAM in MB / Total Provisioned RAM in MB) * 100`  
   Monitored to prevent out-of-memory kernel kills on container hosts and database instances.

3. **Storage Capacity (%)**:
   `Storage Usage (%) = (Used Disk or Partition Blocks / Total Provisioned Volume Quota) * 100`  
   Encompasses local compute block storage volumes as well as cloud-uploaded object storage files.

4. **Network Bandwidth Throughput (MB/s)**:
   `Network Bandwidth (MB/s) = (Inbound Bytes + Outbound Bytes) / (Sample Duration in Seconds * 1024 * 1024)`  
   Measures ingress and egress data transfer velocity across virtual network interfaces.

5. **Request Count Rate (req/s)**:
   `Request Rate (req/s) = Ingress Requests / Sample Duration in Seconds`  
   Monitors application throughput and detects sudden denial-of-service or bot traffic surges.

### 14.3 Usage Thresholds & Alert Configuration

The alerting engine monitors telemetry against custom, user-configurable thresholds:
- **CPU Threshold**: Default 80% (configurable between 40% and 95%).
- **Memory Threshold**: Default 80% (configurable between 40% and 95%).
- **Storage Threshold**: Default 85% (configurable between 50% and 98%).
- **Network Threshold**: Default 60 MB/s (configurable between 20 MB/s and 150 MB/s).
- **Request Rate Threshold**: Default 1200 req/s (configurable between 400 req/s and 3000 req/s).
- **Anti-Flapping Window**: Requires N consecutive samples (default: 2 consecutive samples) exceeding the threshold before an alert is dispatched, eliminating false positives caused by momentary spikes.
- **Incident Lifecycle**: Supports alert acknowledgement (`ACK`) and resolution (`RESOLVED`) tracking.

### 14.4 Cloud Platform Monitoring Service Configuration

Users can connect to or simulate real cloud platforms:
- **Amazon CloudWatch**: Direct integration with AWS Mumbai (`ap-south-1`) CloudWatch metrics and alarms (simulated integration).
- **Google Cloud Monitoring**: Telemetry collection for GCP projects (simulated integration).
- **Azure Monitor**: Virtual machine and application telemetry (simulated integration).
- **Prometheus / OpenTelemetry**: Standard multi-cloud metric scraping (simulated integration).
- **Configurable Frequencies**: 5s (Real-Time), 10s (Fast), 30s (Standard), 60s (Eco Mode), or Paused.

### 14.5 Controlled Threshold Alert Demonstration Suite

To demonstrate alerting mechanisms during presentations or tests, the dashboard provides a **Controlled Test Dialog**:
1. **CPU Spike**: Injects 95% CPU on an active instance; immediately triggers the threshold alert banner, fires a toast notification with an **Inspect** action, and adds red threshold breach markers on the time-series chart.
2. **Network Bandwidth Surge**: Injects 88.5 MB/s to demonstrate ingress bandwidth alerting.
3. **Storage Warning**: Injects 94% volume utilization to demonstrate disk capacity exhaustion alerts.
4. **Traffic Flood**: Injects 2450 req/s to simulate DDoS or high-concurrency alert escalation.
5. **Restore Baseline**: Restores fleet metrics to healthy baseline (35% CPU, 12 MB/s).

### 14.6 Dual Display Modes: Grid & Tabular Monitoring View

Users can toggle seamlessly between:
- **Card Grid View**: Visual summary cards showcasing real-time progress bars, status dots, and live prices.
- **Tabular Monitoring View**: Interactive, sortable, filterable table featuring live metric bars, region indicators, search by name/ID, and inline resource actions (Inspect, Start/Stop, Delete).

---

## 15. Cloud AI Copilot & IAM API Credentials Redesign

### 15.1 Dedicated AI Copilot Studio (`/dashboard/ai`)
The conversational AI engine has been expanded from a corner popover into a dedicated full-screen DevOps Intelligence Studio:
- **Navigation Placement**: Prominently accessible via **AI Copilot** in the top navigation bar.
- **Live Injected Context**: Streams real-time operational context (active alarms, abnormal resources, health scores, and FinOps monthly run-rate) directly into the model's system prompt.
- **Pre-Engineered Diagnostic Runbooks**:
  1. *Active Alarms Root-Cause Diagnosis*: Automated triage of active threshold violations with recommended remediation commands.
  2. *FinOps Cost Optimization*: Granular breakdown of idle resources and right-sizing recommendations.
  3. *IAM & API Key Health Check*: Cryptographic posture audit and key rotation planning.
  4. *Capacity & Scaling Forecast*: Sizing recommendations across compute, memory, and disk tiers.
- **Streaming & Export**: Real-time token streaming with syntax-highlighted code blocks, one-click copy, and Markdown session export.

### 15.2 Fleet API Credentials & IAM Security (`/dashboard/resources` & Inspection Drawer)
Resource credentials have been redesigned with enterprise-grade security posture controls:
- **API Keys & IAM Tab**: A dedicated sub-view in the Resources page providing fleet-wide key visibility.
- **KMS Security Posture**: Highlights simulated KMS-style credentials with visible sample disclaimer (`Sample credentials, not valid for any real service`) and 90-day rotation compliance.
- **Fleet Key Inventory Table**:
  - Masked / Revealable Access Key ID and Secret Access Key.
  - IAM Permission Scopes (`telemetry:push`, `metrics:read`, `s3:read-write`, `compute:manage`).
  - Regional Ingestion Endpoint URLs.
  - One-click Key Rotation with instant cryptographic regeneration and toast feedback.
- **Interactive SDK Quickstart Generator**: Generates executable, copy-pasteable snippets for **cURL**, **Python (boto3 / requests)**, **Node.js (AWS SDK v3)**, and `.env` format.
- **Redesigned Resource Detail Sheet**: Overhauled API Credentials card with status badges, regional endpoint copy, and granular permission tags.

---

## 16. Limitations & Simulation Details

### Client-Side Telemetry Drift Simulation
- **Simulated Metrics**: The real-time telemetry updates for compute instances (CPU utilization, memory allocation, network traffic, storage capacity, and request rates) are generated using a client-side synthetic drift engine with realistic jitter. This enables complete demonstration of alerting, threshold detection, and AI diagnostics without requiring live AWS/GCP cloud provider credentials.
- **Simulated Provider Integrations**: The provider selector (AWS CloudWatch, Google Cloud Monitoring, Azure Monitor, Prometheus) demonstrates architectural interchangeability and telemetry ingestion config. In a production deployment, this is replaced by server-side CloudWatch SDK clients (`@aws-sdk/client-cloudwatch`) fetching `GetMetricData`.
- **Sample API Credentials**: The Access Key IDs and Secret Access Keys displayed under the API Keys tab and Resource Detail Sheet are simulated sample credentials formatted to illustrate KMS security posture and SDK automation snippets. They are not active keys on any real cloud provider.

---

## 17. Dual-Mode Data Architecture & Zero-Trust Cloud Credential Vault

### 17.1 Dual-Mode Operation Overview

Cloud Resource Monitor operates on a **Dual-Mode Data Architecture** that seamlessly bridges simulated hackathon demonstrations with production hyperscaler environments:

| Mode | Trigger Condition | Data Ingestion Source | Behavior |
| :--- | :--- | :--- | :--- |
| **Demo Mode** | User clicks "Try Demo" (`crm_demo_mode = true`) | Simulated generator (`demoData.ts`) + client-side synthetic drift | Instant evaluation without cloud bills or configuration; stress-testable |
| **Real Mode (No Creds)** | Authenticated user (`user != null`), 0 providers connected | Empty-state onboarding (`<CloudProviderEmptyState />`) | Prompts user to connect AWS, GCP, or Azure via the Credential Vault |
| **Real Mode (With Creds)** | Authenticated user (`user != null`), ≥1 provider connected | Live cloud SDK endpoints (`/api/cloud/*`) with normalized telemetry | Fetches live compute instances, CloudWatch/Monitor metrics, and billing |

### 17.2 Zero-Trust Credential Vault (`/dashboard/integrations`)

The credential management engine enforces strict zero-trust standards:
- **AES-256-GCM Cryptographic Security**: Credentials are encrypted on the server using an authenticated 256-bit symmetric cipher (`aes-256-gcm`) with unique 96-bit initialization vectors (IV) and authentication tags.
- **Key Isolation**: The encryption key is derived server-side from `CREDENTIAL_ENCRYPTION_KEY` in `.env.local` and is never exposed to the client bundle.
- **Zero Browser Storage Leakage**: API secrets and private keys are never written to `localStorage`, `sessionStorage`, or client-side cookies.
- **Database Partitioning**: Encrypted payloads are stored in Firestore under `/users/{uid}/cloudCredentials/{provider}` protected by Firestore security rules.
- **Live Connection Testing**: Before saving, users can trigger `/api/vault/test` to validate IAM syntax, STS identity, and permissions.

### 17.3 Multi-Cloud Normalization Layer (`src/lib/server/normalizers/`)

The backend normalizers convert heterogeneous cloud SDK responses into identical canonical TypeScript schemas:
- **AWS (`aws.ts`)**:
  - EC2 `DescribeInstancesCommand` &rarr; `Resource[]` (`id`, `name`, `type: "VM"`, `size`, `status`, `hourlyRate`, `cpuUsage`)
  - CloudWatch `GetMetricDataCommand` &rarr; `TimeSeriesPoint[]` (aggregated 24h CPU, memory, network, requests)
  - Cost Explorer `GetCostAndUsageCommand` &rarr; `UsageRecord[]`
- **GCP (`gcp.ts`)**:
  - Compute Engine `InstancesClient.list` &rarr; `Resource[]`
  - Cloud Monitoring `MetricServiceClient.listTimeSeries` &rarr; `TimeSeriesPoint[]`
- **Azure (`azure.ts`)**:
  - ARM Compute `ComputeManagementClient.virtualMachines` &rarr; `Resource[]`
  - Azure Monitor `MetricsQueryClient` &rarr; `TimeSeriesPoint[]`

### 17.4 High-Performance Caching & Fault Tolerance
- **In-Memory Server Cache (`cache.ts`)**: Implements an in-process LRU-style cache with a 60-second TTL for metrics and resources, and a 300-second TTL for billing queries to prevent hyperscaler rate limiting and unexpected API charges.
- **Non-Blocking Error Resilience (`<CloudErrorBanner />`)**: If an IAM permission is missing (e.g. `ec2:DescribeInstances` unauthorized), the dashboard does not crash; instead, an unobtrusive banner explains the exact permission issue with a direct link to reconfigure the vault.



