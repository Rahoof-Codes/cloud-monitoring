# Cloud Resource Monitor — Cloud Infrastructure Observability Dashboard

A real-time cloud resource monitoring and observability dashboard built with **Next.js 16**, **Firebase**, and **Real-Time Streaming AI**.

## Key Features

- **Compute & Health Monitoring**: Live tracking of cloud instances, CPU and memory utilization, anomaly detection (CPU spikes > 80%), and instance lifecycle controls.
- **Cloud Storage Management**: Object storage utilization tracking, file type breakdown charts, and secure drag-and-drop uploads via Firebase Storage.
- **Predictable Cost Model**: Real-time monthly bill calculation based on transparent pricing (₹50/month per active compute instance, ₹2/GB per month for storage).
- **Integrated AI Cloud Advisor**: Real-time word-by-word streaming AI advisor grounded in live infrastructure telemetry, diagnosing performance bottlenecks and suggesting cost optimizations.
- **Multi-Factor Authentication**: Secure sign-in with Google OAuth, Email/Password, and SMS OTP Phone Number Verification.
- **Responsive Architecture**: Comprehensive desktop multi-column dashboard and a tailored 3-section mobile layout (Resources, Files, Billing) with an ergonomic right-docked AI assistant.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Backend & Auth**: Firebase Authentication, Cloud Firestore, Firebase Storage
- **AI Engine**: NVIDIA AI / Llama 3.2 via Server-Sent Events (`text/event-stream`) streaming pipeline

## Getting Started

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NVIDIA_API_KEY=...
```

3. Run the local development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.
