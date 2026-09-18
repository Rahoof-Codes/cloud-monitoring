"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Server, FolderOpen, Receipt } from "lucide-react";

export default function DashboardPage() {
  const auth = useAuth();
  const router = useRouter();
  const resourcesHook = useResources(auth.user?.uid);
  const filesHook = useFiles(auth.user?.uid);
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

  useEffect(() => {
    if (!auth.loading && !auth.user) {
      router.replace("/login");
    }
  }, [auth.user, auth.loading, router]);

  if (auth.loading || !auth.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardProvider
      user={auth.user}
      auth={auth}
      resourcesHook={resourcesHook}
      filesHook={filesHook}
    >
      <div className="flex min-h-screen flex-col bg-background">
        <TopBar />

        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
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

        {/* Detail drawer */}
        <ResourceDetailSheet />

        {/* Floating Ask AI button and chat drawer in bottom-right */}
        <AskAIWidget />
      </div>
    </DashboardProvider>
  );
}
