"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { useAuth } from "@/lib/useAuth";
import { useResources } from "@/lib/useResources";
import { useFiles } from "@/lib/useFiles";
import {
  DashboardProvider,
  TopBar,
  SummaryCards,
  AttentionPanel,
  ResourceGrid,
  ResourceDetailSheet,
  FileUploader,
  FileList,
  BillingTab,
  AskAIWidget,
  CpuChart,
  DistributionChart,
  MobileSections,
} from "@/components/dashboard";
import { DemoBanner } from "@/components/dashboard/demo-banner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Server, FolderOpen, Receipt } from "lucide-react";

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

export default function DashboardPage() {
  const auth = useAuth();
  const router = useRouter();
  const [isDemoMode, setIsDemoMode] = useState<boolean | null>(null);

  // Check demo mode from storage
  useEffect(() => {
    const isDemo =
      typeof window !== "undefined" &&
      (localStorage.getItem("crm_demo_mode") === "true" ||
        sessionStorage.getItem("crm_demo_mode") === "true");
    setIsDemoMode(isDemo);
  }, []);

  const effectiveUid = isDemoMode ? "demo-user" : auth.user?.uid;
  const resourcesHook = useResources(effectiveUid);
  const filesHook = useFiles(effectiveUid);

  const [activeTab, setActiveTab] = useState<"resources" | "files" | "billing">("resources");
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auth redirect only if NOT in demo mode and NOT authenticated
  useEffect(() => {
    if (isDemoMode === null) return;
    if (!isDemoMode && !auth.loading && !auth.user) {
      router.replace("/login");
    }
  }, [auth.user, auth.loading, isDemoMode, router]);

  if (isDemoMode === null || (!isDemoMode && (auth.loading || !auth.user))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const activeUser = isDemoMode ? DEMO_USER_STUB : auth.user!;

  return (
    <DashboardProvider
      user={activeUser}
      auth={auth}
      isDemoMode={Boolean(isDemoMode)}
      resourcesHook={resourcesHook}
      filesHook={filesHook}
    >
      <div className="flex min-h-screen flex-col bg-background">
        {/* Demo banner at top if in demo mode */}
        <DemoBanner />

        <TopBar />

        <main className="flex-1 px-4 py-4 pb-24 sm:px-6 sm:py-6 sm:pb-24 lg:px-8">
          {isMobile ? (
            /* ── MOBILE VIEW: 3 DEDICATED SECTIONS WITH COMMON ASK AI ── */
            <MobileSections
              activeSection={activeTab}
              onSectionChange={setActiveTab}
            />
          ) : (
            /* ── DESKTOP VIEW: MULTI-COLUMN OVERVIEW & TABS ── */
            <div className="space-y-6">
              {/* Needs Attention banner */}
              <AttentionPanel />

              {/* Summary row */}
              <SummaryCards />

              {/* Charts */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <CpuChart />
                <DistributionChart />
              </div>

              {/* Tabbed content */}
              <Tabs
                value={activeTab}
                onValueChange={(val) =>
                  setActiveTab(val as "resources" | "files" | "billing")
                }
                className="space-y-4"
              >
                <TabsList className="h-10">
                  <TabsTrigger value="resources" className="gap-1.5">
                    <Server className="h-3.5 w-3.5" />
                    Resources
                  </TabsTrigger>
                  <TabsTrigger value="files" className="gap-1.5">
                    <FolderOpen className="h-3.5 w-3.5" />
                    Files
                  </TabsTrigger>
                  <TabsTrigger value="billing" className="gap-1.5">
                    <Receipt className="h-3.5 w-3.5" />
                    Billing
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="resources">
                  <ResourceGrid />
                </TabsContent>

                <TabsContent value="files" className="space-y-4">
                  <FileUploader />
                  <FileList />
                </TabsContent>

                <TabsContent value="billing">
                  <BillingTab />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>

        {/* Detail drawer / Preview side sheet */}
        <ResourceDetailSheet />

        {/* Floating Ask AI button and chat drawer in bottom-right */}
        <AskAIWidget />
      </div>
    </DashboardProvider>
  );
}
