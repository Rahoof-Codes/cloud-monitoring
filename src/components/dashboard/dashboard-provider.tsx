"use client";

// ---------------------------------------------------------------------------
// DashboardProvider — Firebase-backed context
// ---------------------------------------------------------------------------
// Receives auth, resources, and files hooks from the dashboard page and
// exposes them through context to all child components.
// ---------------------------------------------------------------------------

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { User } from "firebase/auth";
import type { AuthState } from "@/lib/useAuth";
import type { Resource, ResourceType, ResourceStatus } from "@/lib/useResources";
import type { UserFile } from "@/lib/useFiles";
import {
  TimeSeriesPoint,
  DistributionSlice,
  generateCpuTimeSeries,
  getResourceDistribution,
  getAbnormalResources,
} from "@/lib/data";

// Re-export types hooks return
export type { Resource, ResourceType, ResourceStatus } from "@/lib/useResources";
export type { UserFile } from "@/lib/useFiles";

interface DashboardState {
  // Auth
  user: User;
  auth: AuthState;

  // Resources
  resources: Resource[];
  abnormal: Resource[];
  resourcesLoading: boolean;
  addResource: (data: {
    name: string;
    type: ResourceType;
    region: string;
    status?: ResourceStatus;
  }) => Promise<void>;
  toggleResourceStatus: (id: string, currentStatus: ResourceStatus) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  recalcResourceCost: (res?: Resource[]) => Promise<void>;

  // Files
  files: UserFile[];
  filesLoading: boolean;
  uploadFile: (file: File) => Promise<void>;
  deleteFile: (id: string, storagePath: string, sizeBytes: number) => Promise<void>;
  uploadProgress: number | null;
  totalStorageUsedBytes: number;

  // Charts
  cpuSeries: TimeSeriesPoint[];
  distribution: DistributionSlice[];

  // Selected resource (for detail sheet)
  selectedResource: Resource | null;
  setSelectedResource: (r: Resource | null) => void;

  // AI Assistant drawer state
  isAiOpen: boolean;
  setIsAiOpen: (open: boolean) => void;
  pendingAiPrompt: string | null;
  openAiWithPrompt: (prompt?: string) => void;
  clearPendingAiPrompt: () => void;
}

const DashboardContext = createContext<DashboardState | null>(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}

interface DashboardProviderProps {
  children: ReactNode;
  user: User;
  auth: AuthState;
  resourcesHook: ReturnType<typeof import("@/lib/useResources").useResources>;
  filesHook: ReturnType<typeof import("@/lib/useFiles").useFiles>;
}

export function DashboardProvider({
  children,
  user,
  auth,
  resourcesHook,
  filesHook,
}: DashboardProviderProps) {
  const [cpuSeries] = useState<TimeSeriesPoint[]>(() => generateCpuTimeSeries());
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [pendingAiPrompt, setPendingAiPrompt] = useState<string | null>(null);

  const handleSetSelectedResource = useCallback((r: Resource | null) => {
    setSelectedResource(r);
  }, []);

  const openAiWithPrompt = useCallback((prompt?: string) => {
    if (prompt) {
      setPendingAiPrompt(prompt);
    }
    setIsAiOpen(true);
  }, []);

  const clearPendingAiPrompt = useCallback(() => {
    setPendingAiPrompt(null);
  }, []);

  const abnormal = getAbnormalResources(resourcesHook.resources);
  const distribution = getResourceDistribution(resourcesHook.resources);

  // Keep selected resource in sync with live data
  const syncedSelectedResource = selectedResource
    ? resourcesHook.resources.find((r) => r.id === selectedResource.id) ?? null
    : null;

  return (
    <DashboardContext.Provider
      value={{
        user,
        auth,
        resources: resourcesHook.resources,
        abnormal,
        resourcesLoading: resourcesHook.loading,
        addResource: resourcesHook.addResource,
        toggleResourceStatus: resourcesHook.toggleResourceStatus,
        deleteResource: resourcesHook.deleteResource,
        recalcResourceCost: resourcesHook.recalcCost,
        files: filesHook.files,
        filesLoading: filesHook.loading,
        uploadFile: filesHook.uploadFile,
        deleteFile: filesHook.deleteFile,
        uploadProgress: filesHook.uploadProgress,
        totalStorageUsedBytes: filesHook.totalStorageUsedBytes,
        cpuSeries,
        distribution,
        selectedResource: syncedSelectedResource,
        setSelectedResource: handleSetSelectedResource,
        isAiOpen,
        setIsAiOpen,
        pendingAiPrompt,
        openAiWithPrompt,
        clearPendingAiPrompt,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}
