"use client";

// ---------------------------------------------------------------------------
// Dashboard Layout — Global Provider & CloudWatch Pro App Shell
// ---------------------------------------------------------------------------
// Uses the useAppMode hook to centralise demo/auth mode resolution.
// Passes the resolved `dataMode` and `connectedProviders` down to
// DashboardProvider, which decides whether to render the normal
// dashboard, the empty-state onboarding screen, or (Phase 3) live data.
// ---------------------------------------------------------------------------

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { useAuth } from "@/lib/useAuth";
import { useAppMode } from "@/lib/useAppMode";
import { useResources } from "@/lib/useResources";
import { useFiles } from "@/lib/useFiles";
import {
  DashboardProvider,
  TopBar,
  ResourceDetailSheet,
  AskAIWidget,
} from "@/components/dashboard";
import { DemoBanner } from "@/components/dashboard/demo-banner";

const DEMO_USER_STUB: User = {
  uid: "demo-user",
  displayName: "Demo Mode Visitor",
  email: "demo@cloudmonitor.io",
  photoURL: null,
  emailVerified: true,
  isAnonymous: true,
  metadata: {},
  providerData: [],
  refreshToken: "",
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => "",
  getIdTokenResult: async () => ({} as any),
  reload: async () => {},
  toJSON: () => ({}),
  phoneNumber: null,
  providerId: "demo",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const router = useRouter();

  // Centralised mode resolver — replaces the inline localStorage reads
  const appMode = useAppMode(auth.user, auth.loading);

  const effectiveUid = appMode.isDemoMode ? "demo-user" : auth.user?.uid;
  const resourcesHook = useResources(effectiveUid);
  const filesHook = useFiles(effectiveUid);

  // Auth redirect only if NOT in demo mode and NOT authenticated
  useEffect(() => {
    // Wait for storage to hydrate before making redirect decisions
    if (!appMode.isDemoMode && !auth.loading && !auth.user) {
      router.replace("/login");
    }
  }, [auth.user, auth.loading, appMode.isDemoMode, router]);

  // Show loading spinner while auth or mode is hydrating
  if (auth.loading || (!appMode.isDemoMode && !auth.user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading CloudMonitor…</p>
        </div>
      </div>
    );
  }

  const activeUser = appMode.isDemoMode ? DEMO_USER_STUB : auth.user!;

  return (
    <DashboardProvider
      user={activeUser}
      auth={auth}
      isDemoMode={appMode.isDemoMode}
      dataMode={appMode.dataMode}
      connectedProviders={appMode.connectedProviders}
      resourcesHook={resourcesHook}
      filesHook={filesHook}
    >
      <div className="flex min-h-screen flex-col bg-background selection:bg-blue-500/20">
        {/* Demo banner at top if in demo mode */}
        <DemoBanner />

        {/* Floating Capsule Navigation Bar */}
        <TopBar />

        {/* Sub-page content */}
        <main className="flex-1 px-3 py-5 sm:px-6 sm:py-6 lg:px-8 max-w-7xl mx-auto w-full">
          {children}
        </main>

        {/* Detail drawer / Preview side sheet */}
        <ResourceDetailSheet />

        {/* Floating Ask AI button and chat drawer in bottom-right */}
        <AskAIWidget />
      </div>
    </DashboardProvider>
  );
}
