"use client";

// ---------------------------------------------------------------------------
// DashboardProvider — Firebase or In-Memory Demo Data Context
// ---------------------------------------------------------------------------

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import type { User } from "firebase/auth";
import type { AuthState } from "@/lib/useAuth";
import type { Resource, ResourceType, ResourceStatus, ResourceSize } from "@/lib/useResources";
import type { UserFile } from "@/lib/useFiles";
import type { UsageRecord } from "@/lib/billing";
import {
  TimeSeriesPoint,
  DistributionSlice,
  Alert,
  MetricHistory,
  buildCpuSnapshotFromResources,
  getResourceDistribution,
  getAbnormalResources,
  detectAnomalies,
} from "@/lib/data";
import {
  DEMO_RESOURCES,
  DEMO_USAGE_RECORDS,
  DEMO_FILES,
  DEMO_ALERTS,
  generateDemoTelemetry,
} from "@/lib/demoData";
import { generateFakeCredentials } from "@/lib/credentials";
import { DemoGuardProvider, useDemoGuard } from "./demo-guard";
import { toast } from "sonner";

export type { Resource, ResourceType, ResourceStatus, ResourceSize } from "@/lib/useResources";
export type { UserFile } from "@/lib/useFiles";
export type { UsageRecord } from "@/lib/billing";

interface DashboardState {
  // Auth & Demo
  user: User;
  auth: AuthState;
  isDemoMode: boolean;
  requireAuth: (action?: () => void | Promise<void>) => boolean;

  // Resources
  resources: Resource[];
  abnormal: Resource[];
  resourcesLoading: boolean;
  addResource: (data: {
    name: string;
    type: ResourceType;
    size?: ResourceSize;
    region: string;
    status?: ResourceStatus;
  }) => Promise<void>;
  toggleResourceStatus: (id: string, currentStatus: ResourceStatus) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  regenerateCredentials: (id: string) => Promise<void>;

  // Usage records
  usageRecords: UsageRecord[];
  usageLoading: boolean;

  // Alerts
  alerts: Alert[];

  // Files
  files: UserFile[];
  filesLoading: boolean;
  uploadFile: (file: File) => Promise<void>;
  deleteFile: (id: string, storagePath: string, sizeBytes: number) => Promise<void>;
  uploadProgress: number | null;
  totalStorageUsedBytes: number;

  // Charts & Live ticking
  cpuSeries: TimeSeriesPoint[];
  distribution: DistributionSlice[];
  clockTick: number; // Ticks every 3s to live-update running costs

  // Selected resource
  selectedResource: Resource | null;
  setSelectedResource: (r: Resource | null) => void;

  // AI Assistant drawer
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
  isDemoMode?: boolean;
  resourcesHook: ReturnType<typeof import("@/lib/useResources").useResources>;
  filesHook: ReturnType<typeof import("@/lib/useFiles").useFiles>;
}

const MAX_SERIES_POINTS = 25;

function DashboardInternalProvider({
  children,
  user,
  auth,
  isDemoMode = false,
  resourcesHook,
  filesHook,
}: DashboardProviderProps) {
  const { requireAuth } = useDemoGuard();

  // Demo in-memory state
  const [demoResources, setDemoResources] = useState<Resource[]>(DEMO_RESOURCES);
  const [demoUsageRecords, setDemoUsageRecords] = useState<UsageRecord[]>(DEMO_USAGE_RECORDS);

  // Live clock tick every 3s to smoothly update running cost timers
  const [clockTick, setClockTick] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTick(Date.now());
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // CPU Time series & Alerts
  const [cpuSeries, setCpuSeries] = useState<TimeSeriesPoint[]>(() =>
    isDemoMode ? generateDemoTelemetry() : []
  );
  const [alerts, setAlerts] = useState<Alert[]>(() =>
    isDemoMode ? DEMO_ALERTS : []
  );
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [pendingAiPrompt, setPendingAiPrompt] = useState<string | null>(null);

  const metricHistoryRef = useRef<MetricHistory>(new Map());

  // Active data source based on mode
  const activeResources = isDemoMode ? demoResources : resourcesHook.resources;
  const activeUsageRecords = isDemoMode ? demoUsageRecords : resourcesHook.usageRecords;
  const activeFiles = isDemoMode ? DEMO_FILES : filesHook.files;
  const activeTotalStorage = isDemoMode
    ? DEMO_FILES.reduce((sum, f) => sum + f.sizeBytes, 0)
    : filesHook.totalStorageUsedBytes;

  // Real-time CPU snapshots and anomaly detection for authenticated mode
  useEffect(() => {
    if (isDemoMode) return;

    const resources = resourcesHook.resources;
    const point = buildCpuSnapshotFromResources(resources);
    if (point) {
      setCpuSeries((prev) => {
        const next = [...prev, point];
        if (next.length > MAX_SERIES_POINTS) next.shift();
        return next;
      });
    }

    const newAlerts = detectAnomalies(resources, metricHistoryRef.current);
    setAlerts(newAlerts);
  }, [isDemoMode, resourcesHook.resources]);

  // Guarded actions
  const handleAddResource = useCallback(
    async (data: {
      name: string;
      type: ResourceType;
      size?: ResourceSize;
      region: string;
      status?: ResourceStatus;
    }) => {
      if (!requireAuth()) return;
      await resourcesHook.addResource(data);
    },
    [requireAuth, resourcesHook]
  );

  const handleToggleResourceStatus = useCallback(
    async (id: string, currentStatus: ResourceStatus) => {
      if (!requireAuth()) return;
      await resourcesHook.toggleResourceStatus(id, currentStatus);
    },
    [requireAuth, resourcesHook]
  );

  const handleDeleteResource = useCallback(
    async (id: string) => {
      if (!requireAuth()) return;
      await resourcesHook.deleteResource(id);
    },
    [requireAuth, resourcesHook]
  );

  const handleRegenerateCredentials = useCallback(
    async (id: string) => {
      if (isDemoMode) {
        // In demo mode, regenerate in-memory key
        setDemoResources((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, apiCredentials: generateFakeCredentials() } : r
          )
        );
        toast.success("Sample API Credentials regenerated (in-memory)");
        return;
      }
      await resourcesHook.regenerateCredentials(id);
    },
    [isDemoMode, resourcesHook]
  );

  const handleUploadFile = useCallback(
    async (file: File) => {
      if (!requireAuth()) return;
      await filesHook.uploadFile(file);
    },
    [requireAuth, filesHook]
  );

  const handleDeleteFile = useCallback(
    async (id: string, storagePath: string, sizeBytes: number) => {
      if (!requireAuth()) return;
      await filesHook.deleteFile(id, storagePath, sizeBytes);
    },
    [requireAuth, filesHook]
  );

  const openAiWithPrompt = useCallback(
    (prompt?: string) => {
      if (prompt) {
        setPendingAiPrompt(prompt);
      }
      setIsAiOpen(true);
    },
    []
  );

  const clearPendingAiPrompt = useCallback(() => {
    setPendingAiPrompt(null);
  }, []);

  const abnormal = isDemoMode
    ? demoResources.filter((r) => r.cpuUsage > 85 || r.status === "warning")
    : getAbnormalResources(resourcesHook.resources);

  const distribution = getResourceDistribution(activeResources);

  const syncedSelectedResource = selectedResource
    ? activeResources.find((r) => r.id === selectedResource.id) ?? null
    : null;

  return (
    <DashboardContext.Provider
      value={{
        user,
        auth,
        isDemoMode,
        requireAuth,
        resources: activeResources,
        abnormal,
        resourcesLoading: isDemoMode ? false : resourcesHook.loading,
        addResource: handleAddResource,
        toggleResourceStatus: handleToggleResourceStatus,
        deleteResource: handleDeleteResource,
        regenerateCredentials: handleRegenerateCredentials,
        usageRecords: activeUsageRecords,
        usageLoading: isDemoMode ? false : resourcesHook.usageLoading,
        alerts,
        files: activeFiles,
        filesLoading: isDemoMode ? false : filesHook.loading,
        uploadFile: handleUploadFile,
        deleteFile: handleDeleteFile,
        uploadProgress: isDemoMode ? null : filesHook.uploadProgress,
        totalStorageUsedBytes: activeTotalStorage,
        cpuSeries,
        distribution,
        clockTick,
        selectedResource: syncedSelectedResource,
        setSelectedResource,
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

export function DashboardProvider(props: DashboardProviderProps) {
  return (
    <DemoGuardProvider isDemoMode={Boolean(props.isDemoMode)}>
      <DashboardInternalProvider {...props} />
    </DemoGuardProvider>
  );
}
