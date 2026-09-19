# Cloud Resource Monitor — Cloud Infrastructure Observability Dashboard

> **Real-Time Cloud Observability, Transparent FinOps & Grounded Streaming AI Advisor**  
> Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **Firebase (Auth & Firestore)**, and **NVIDIA AI (Llama 3.2)**.

📖 **[Read the Full Comprehensive Technical Documentation (DOCUMENTATION.md)](./DOCUMENTATION.md)**

---

## 🚀 Key Highlights

- **Live Compute & Health Observability**: Real-time tracking of VMs, Databases, and Networks with dynamic 5s CPU/Memory drift simulation, anomaly detection (>80% utilization), and instant Start/Stop/Delete lifecycle controls.
- **Predictable Cost Model (FinOps)**: Real-time monthly bill calculation with transparent pricing (₹50/month per active compute instance, ₹2/GB storage, ₹0 for stopped resources). Automatically recalculates across database events.
- **Integrated AI Cloud Advisor**: Real-time word-by-word streaming AI advisor powered by Meta Llama 3.2 via Server-Sent Events (`text/event-stream`), grounded with live infrastructure telemetry and conversational memory.
- **Hybrid Storage Architecture**: File manager supporting uploads up to 200MB without paid storage tier restrictions (small files $\le 700$KB in Firestore, large files in local IndexedDB with live metadata sync).
- **Multiple Sign-In Methods & Phone Linking**: Secure sign-in with Google OAuth, Email/Password, and SMS OTP verification via Invisible reCAPTCHA.
- **Ergonomic Responsive Layouts**: Desktop multi-column dashboard with charts, and a tailored 3-section mobile layout (Resources, Files, Billing) with an accessible bottom-right AI assistant.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling & UI**: Tailwind CSS v4, Lucide Icons, Sonner Notifications
- **Visualizations**: Recharts (Area Time-Series, Donut Distribution, FinOps Charts)
- **Backend & Auth**: Firebase Authentication, Cloud Firestore (Real-Time `onSnapshot`), Browser IndexedDB
- **AI Infrastructure**: NVIDIA AI Foundation Endpoints (`meta/llama-3.2-11b-vision-instruct`) with streaming SSE

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

---

## 📚 Complete Project Documentation

For in-depth architecture diagrams, data schemas, API routes, telemetry simulation logic, and pitch presentation scripts, see:  
👉 **[DOCUMENTATION.md](./DOCUMENTATION.md)**

