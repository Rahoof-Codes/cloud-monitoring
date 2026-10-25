# Cloud Resource Monitor — Cloud Infrastructure Observability Dashboard

> **Real-Time Cloud Observability, Multi-Metric Telemetry, Dynamic Threshold Alerting & Grounded Streaming AI Advisor**  
> Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **Firebase (Auth & Firestore)**, and **NVIDIA AI (Llama 3.2)**.

📖 **[Read the Comprehensive Technical Documentation (DOCUMENTATION.md)](./DOCUMENTATION.md)**

---

## 🚀 Key Highlights & Expected Features

- **Multi-Resource Cloud Observability**: Monitor Compute Instances (VMs), Managed Databases, Ingress Network Load Balancers, Cloud Storage Buckets, and Serverless Functions with live status badges and telemetry drift.
- **Configurable Cloud Platform Monitoring**: Select between **Amazon CloudWatch**, **Google Cloud Monitoring**, **Azure Monitor**, and **Prometheus/OpenTelemetry**, with configurable collection frequencies (5s Real-time, 10s, 30s, 60s, or Paused).
- **Comprehensive Multi-Metric Telemetry**: Continuous streaming observability for:
  - **CPU Utilization (%)**
  - **Memory Allocation (%)**
  - **Storage Capacity & Disk Utilization (%)**
  - **Network Bandwidth Throughput (MB/s)**
  - **Request Counts & Traffic Rates (req/s)**
- **Configurable Usage Thresholds**: Custom user-defined thresholds with slider controls for CPU, Memory, Storage, Network, and Request Rates, including anti-flapping consecutive sample requirements and instant toast alerts.
- **Alert Center & Incident Lifecycle**: Real-time alerts with severity classifications (**Warning** vs **Critical**), state tracking (**Active**, **Acknowledged**, **Resolved**), and 1-click **Ask AI Remediation**.
- **Interactive Multi-View Display**:
  - **Fleet Overview Banner**: Overall health score (e.g. 98% Healthy), resource tally, and combined cross-fleet throughput/requests.
  - **Interactive Telemetry Area Charts**: Tabbed metric selector with dynamic threshold reference lines and anomaly breach dots.
  - **Dual Display Modes**: Toggle seamlessly between rich **Card Grid View** and detailed, searchable, sortable **Tabular Monitoring Table View**.
- **Periodic Update & Refresh Mechanism**: TopBar countdown timer, real-time sync countdown, and 1-click **Manual Refresh** with live provider synchronization.
- **Controlled Threshold Alert Demonstration**: Dedicated test suite allowing users and hackathon judges to inject controlled spikes (CPU 95%, Network 88.5 MB/s, Storage 94%, Traffic 2450 req/s) or reset to baseline to observe live threshold alerts.
- **In-App Documentation & Metric Guide**: Direct in-app dialog providing complete metric formulas, threshold rules, and architectural standards.
- **Predictable Cost Model (FinOps)**: Real-time billing calculation based on AWS Mumbai (ap-south-1) on-demand pricing with transparent per-second tracking and zero-latency recalculation.
- **Integrated AI Cloud Copilot**: Word-by-word streaming AI advisor powered by Meta Llama 3.2 via Server-Sent Events (`text/event-stream`), grounded with live system metrics, anomaly alerts, and active bills.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling & UI**: Tailwind CSS v4, Lucide Icons, Sonner Notifications
- **Visualizations**: Recharts (Multi-Metric Area Time-Series, Donut Distribution, FinOps Breakdown)
- **Backend & Auth**: Firebase Authentication, Cloud Firestore (Real-Time `onSnapshot`), Browser IndexedDB
- **AI Infrastructure**: NVIDIA AI Foundation Endpoints (`meta/llama-3.2-11b-vision-instruct`) with streaming SSE
- **Test Suite**: Native Node.js test runner (`node --test`) covering billing math and threshold detection logic

---

## ⚡ Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Rahoof-Codes/Cloud-Resource-Monitoring-Dashboard.git
cd cloud-dashboard
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NVIDIA_API_KEY=nvapi-your_nvidia_api_key
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Automated Test Suite
```bash
npm test
```

---

## 📚 Complete Project Documentation

For in-depth architecture diagrams, data schemas, API routes, telemetry simulation logic, and pitch presentation scripts, see:  
👉 **[DOCUMENTATION.md](./DOCUMENTATION.md)**
