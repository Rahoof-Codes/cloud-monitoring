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
9. [Authentication & Multi-Factor Security Suite](#9-authentication--multi-factor-security-suite)
10. [Database Schema & Security Rules](#10-database-schema--security-rules)
11. [User Experience & Responsive Design](#11-user-experience--responsive-design)
12. [Environment Configuration & Setup Guide](#12-environment-configuration--setup-guide)
13. [Hackathon Demo & Pitch Presentation Script](#13-hackathon-demo--pitch-presentation-script)

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
- **Predictable Cost Transparency**: Transparent, flat-rate pricing (₹50/month per active compute instance, ₹2/GB storage, ₹0 for stopped instances) with automatic real-time billing recalculation.
- **Grounded Streaming AI Advisor**: An integrated AI copilot powered by Meta Llama 3.2 on NVIDIA's AI infrastructure, connected via Server-Sent Events (SSE) with live telemetry grounding and a fluid word-by-word typewriter interface.
- **Zero-Friction Hybrid Storage**: File management supporting files up to 200MB using a hybrid Firestore + browser IndexedDB architecture that eliminates cloud storage billing barriers for demos and prototypes.
- **Enterprise-Grade Authentication**: Full multi-factor auth supporting Google OAuth, Email/Password, and SMS OTP verification with phone linking via Invisible reCAPTCHA.

---

## 2. Key Features & Innovations

| Category | Capability | Technical Highlight |
| :--- | :--- | :--- |
| **Observability** | Live Compute Telemetry | Real-time tracking of VMs, Databases, and Networks with dynamic CPU/Memory status. |
| **Observability** | Anomaly Detection | Automated alerting banner for resources with >80% CPU utilization or error states. |
| **Observability** | Resource Controls | Instant Start/Stop and Delete actions with zero-latency Firestore synchronization. |
| **Storage** | Hybrid File Storage | Small files (≤700KB) stored inline as base64; large files (>700KB up to 200MB) stored in IndexedDB with Firestore metadata sync. |
| **FinOps** | Transparent Billing | Real-time bill calculations (₹50/active instance + ₹2/GB storage). Instant recalculation on status change. |
| **FinOps** | Cost Visualizations | Recharts donut breakdown, monthly estimate cards, and capacity warnings. |
| **AI Advisor** | Grounded Telemetry | Injects live system metrics, anomaly lists, and active billing totals into every prompt context. |
| **AI Advisor** | Streaming SSE | Fluid word-by-word streaming using an adaptive typewriter buffer (18ms cadence, dynamic backlog acceleration). |
| **AI Advisor** | Multi-Turn Memory | Retains conversation history (up to 8 turns) and allows stopping generation on demand. |
| **Security** | Multi-Factor Auth | Google OAuth + Email/Password + SMS OTP Phone verification via Firebase & Invisible reCAPTCHA. |
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
        AIWidget["Ask AI Streaming Widget"]
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
  $$\Delta \text{CPU} = (\text{rand}() - 0.5) \times 8$$
  $$\Delta \text{Mem} = (\text{rand}() - 0.5) \times 6$$
- Metrics are clamped within $[0, 100]\%$.
- **Automated State Transitions**:
  - If CPU or Memory $> 90\%$, instance status transitions to `warning`.
  - When metrics stabilize below $85\%$, status reverts to `running`.
  - If stopped, CPU and Memory drop to $0\%$.

### 3. Anomaly Auditing
- `getAbnormalResources(resources)` evaluates:
  - $\text{CPU Usage} > 85\%$ OR
  - $\text{Memory Usage} > 85\%$ OR
  - $\text{Status} \in \{\text{"warning"}, \text{"error"}\}$
- Detected resources immediately render into the [`AttentionPanel`](file:///d:/Hackathon/cloud-dashboard/src/components/dashboard/attention-panel.tsx) with a red pinging indicator and direct-drill action buttons.

---

## 6. Hybrid Storage Architecture (Firestore + IndexedDB)

Located in [`src/lib/fileStorage.ts`](file:///d:/Hackathon/cloud-dashboard/src/lib/fileStorage.ts) and [`src/lib/useFiles.ts`](file:///d:/Hackathon/cloud-dashboard/src/lib/useFiles.ts).

### The Challenge
Firestore has a strict **1MB document size limit**, and Firebase Cloud Storage requires a paid Blaze Plan credit card for production uploads.

### The Hybrid Storage Solution
To enable seamless hackathon evaluations and demonstrations with real files up to **200MB**:

1. **Small Files ($\le 700\text{ KB}$)**:
   - Binary converted to Base64 Data URL via `FileReader`.
   - Stored directly inside the Firestore document at `/users/{uid}/files/{fileId}`.
   - Synchronized across devices.

2. **Large Files ($> 700\text{ KB}$ up to $200\text{ MB}$)**:
   - Binary stored safely in the browser's local **IndexedDB** (`CloudMonitorStore` / `blobs` object store).
   - Full metadata (filename, size in bytes, MIME type, upload timestamp, `isLocalBlob: true`) is stored in Cloud Firestore.
   - User document `totalStorageUsedBytes` is recalculated and stored in Firestore.
   - Enables full telemetry, cost calculations, and file lists while staying completely free of external cloud storage billing.

---

## 7. Predictable Billing Engine & Mathematics

Located in [`src/lib/cost.ts`](file:///d:/Hackathon/cloud-dashboard/src/lib/cost.ts) and [`src/components/dashboard/billing-tab.tsx`](file:///d:/Hackathon/cloud-dashboard/src/components/dashboard/billing-tab.tsx).

### Transparent Pricing Formula

$$\text{Estimated Monthly Cost (₹)} = (\text{Running Instances} \times ₹50) + \left(\frac{\text{Total Storage Bytes}}{10^9} \times ₹2\right)$$

### Key Financial Rules
1. **Flat Compute Rate**: ₹50/month per active (`running`) instance.
2. **Zero-Cost Inactivity**: Stopped resources incur **₹0/month** compute cost. This gives users immediate incentive to shut down idle resources.
3. **Storage Rate**: ₹2 per GB per month (calculated down to fractional bytes and rounded to paisa).
4. **Soft Free Tier Cap**: 1 GB ($1 \times 1024^3$ bytes). The system warns users when storage usage exceeds 80% of this threshold.

### Example Cost Calculation
- 3 Running Instances: $3 \times ₹50 = ₹150$
- 2 Stopped Instances: $2 \times ₹0 = ₹0$
- 2.5 GB Uploaded Files: $2.5 \times ₹2 = ₹5.00$
- **Total Monthly Bill**: **₹155.00**

Whenever a resource is stopped, started, or a file is deleted, `recalcCost()` recalculates this value and updates the user's Firestore profile document.

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

## 9. Authentication & Multi-Factor Security Suite

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

### Desktop Layout ($\ge 768\text{px}$)
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

### Mobile Layout ($< 768\text{px}$)
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
cd cloud-dashboard

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
> It features a 100% predictable pricing model: ₹50 per running instance, ₹2 per GB of storage, and ₹0 for idle instances. With live Firestore reactivity, users see metrics update in real time.  
> When a spike occurs, our integrated **AI Cloud Advisor**, powered by Llama 3.2 and streaming over Server-Sent Events, doesn't just give generic answers — it inspects real-time telemetry and diagnoses the bottleneck on the spot.  
> Paired with hybrid client-side storage supporting files up to 200MB and complete multi-factor authentication, Cloud Resource Monitor is the observability platform developers actually want to use."*

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
   - Highlight how stopping the instance immediately dropped compute charges by ₹50 in real time.
   - Upload a test file (document or image) and show the storage bill recalculating live down to the paisa.
4. **Grounded AI Advisor (60s)**:
   - Click the floating **Ask AI** button in the bottom right.
   - Click the quick prompt **"Audit Anomalies"** or ask: *"What is my current monthly bill and what should I do about high CPU?"*
   - Showcase the fluid typewriter streaming, Markdown formatting, live telemetry citation, and instant actionable recommendations.
