"use client";

// ---------------------------------------------------------------------------
// DashboardProvider — Real-time telemetry, thresholds, alerts, and demo context
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
import { usePathname } from "next/navigation";
import type { User } from "firebase/auth";
import type { AuthState } from "@/lib/useAuth";
import type { Resource, ResourceType, ResourceStatus, ResourceSize } from "@/lib/useResources";
import type { UserFile } from "@/lib/useFiles";
import type { UsageRecord } from "@/lib/billing";
import type { DataMode, ConnectedProvider } from "@/lib/useAppMode";
import {
  TimeSeriesPoint,
  DistributionSlice,
  Alert,
  MetricHistory,
  ThresholdConfig,
  DEFAULT_THRESHOLDS,
  MonitoringConfig,
  DEFAULT_MONITORING_CONFIG,
  buildSnapshotFromResources,
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
import { CloudProviderEmptyState } from "./cloud-provider-empty-state";
import { CloudErrorBanner } from "./cloud-error-banner";
import { useCloudData } from "@/lib/useCloudData";
import { toast } from "sonner";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type { Resource, ResourceType, ResourceStatus, ResourceSize } from "@/lib/useResources";
export type { UserFile } from "@/lib/useFiles";
export type { UsageRecord } from "@/lib/billing";
export type { DataMode, ConnectedProvider } from "@/lib/useAppMode";
export type { ThresholdConfig, MonitoringConfig, CloudProvider, Alert, TimeSeriesPoint } from "@/lib/data";

interface DashboardState {
  // Auth & Demo
  user: User;
  auth: AuthState;
  isDemoMode: boolean;
  /**
   * Three-state resolved mode that drives which data source the dashboard uses:
   *  - "demo"            → demo datasets (Try Demo)
   *  - "real-no-creds"   → empty-state onboarding screen
   *  - "real-with-creds" → live cloud SDK API routes
   */
  dataMode: DataMode;
  /** List of cloud providers the user has connected (name + metadata only, no key material) */
  connectedProviders: ConnectedProvider[];
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

  // View Mode: Grid vs Rich Table
  viewMode: "grid" | "table";
  setViewMode: (mode: "grid" | "table") => void;

  // Thresholds & Alert Configuration
  thresholds: ThresholdConfig;
  updateThresholds: (cfg: Partial<ThresholdConfig>) => void;
  resetThresholds: () => void;

  // Cloud Platform Monitoring Service Config
  monitoringConfig: MonitoringConfig;
  updateMonitoringConfig: (cfg: Partial<MonitoringConfig>) => void;

  // Usage records
  usageRecords: UsageRecord[];
  usageLoading: boolean;

  // Alerts Center
  alerts: Alert[];
  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;

  // Controlled Test / Live Demonstration
  simulateStressTest: (type: "cpu" | "storage" | "network" | "requests" | "reset") => Promise<void>;

  // Refresh mechanism
  refreshMetrics: () => void;
  lastRefreshTime: Date;
  refreshCountdown: number;
  isRefreshing: boolean;

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
  clockTick: number;

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
  dataMode?: DataMode;
  connectedProviders?: ConnectedProvider[];
  resourcesHook: ReturnType<typeof import("@/lib/useResources").useResources>;
  filesHook: ReturnType<typeof import("@/lib/useFiles").useFiles>;
}

const MAX_SERIES_POINTS = 30;

function DashboardInternalProvider({
  children,
  user,
  auth,
  isDemoMode = false,
  dataMode = "demo",
  connectedProviders = [],
  resourcesHook,
  filesHook,
}: DashboardProviderProps) {
  const { requireAuth } = useDemoGuard();

  // Demo in-memory state
  const [demoResources, setDemoResources] = useState<Resource[]>(DEMO_RESOURCES);
  const [demoUsageRecords, setDemoUsageRecords] = useState<UsageRecord[]>(DEMO_USAGE_RECORDS);

  // View Mode: grid or table
  const [viewMode, setViewModeState] = useState<"grid" | "table">("grid");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("crm_view_mode");
      if (saved === "table" || saved === "grid") setViewModeState(saved);
    }
  }, []);
  const setViewMode = useCallback((mode: "grid" | "table") => {
    setViewModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("crm_view_mode", mode);
    }
  }, []);

  // Threshold Configuration
  const [thresholds, setThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("crm_threshold_config");
      if (saved) {
        try {
          setThresholds({ ...DEFAULT_THRESHOLDS, ...JSON.parse(saved) });
        } catch {}
      }
    }
  }, []);

  const updateThresholds = useCallback((cfg: Partial<ThresholdConfig>) => {
    setThresholds((prev) => {
      const updated = { ...prev, ...cfg };
      if (typeof window !== "undefined") {
        localStorage.setItem("crm_threshold_config", JSON.stringify(updated));
      }
      toast.success("Usage thresholds updated");
      return updated;
    });
  }, []);

  const resetThresholds = useCallback(() => {
    setThresholds(DEFAULT_THRESHOLDS);
    if (typeof window !== "undefined") {
      localStorage.removeItem("crm_threshold_config");
    }
    toast.info("Thresholds reset to defaults");
  }, []);

  // Cloud Monitoring Service Configuration
  const [monitoringConfig, setMonitoringConfig] = useState<MonitoringConfig>(
    DEFAULT_MONITORING_CONFIG
  );
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("crm_monitoring_config");
      if (saved) {
        try {
          setMonitoringConfig({ ...DEFAULT_MONITORING_CONFIG, ...JSON.parse(saved) });
        } catch {}
      }
    }
  }, []);

  const updateMonitoringConfig = useCallback((cfg: Partial<MonitoringConfig>) => {
    setMonitoringConfig((prev) => {
      const updated = { ...prev, ...cfg };
      if (typeof window !== "undefined") {
        localStorage.setItem("crm_monitoring_config", JSON.stringify(updated));
      }
      toast.success(`Monitoring service updated (${updated.provider})`);
      return updated;
    });
  }, []);

  // Live clock tick every 3s to smoothly update running cost timers
  const [clockTick, setClockTick] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTick(Date.now());
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Refresh mechanism
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [refreshCountdown, setRefreshCountdown] = useState<number>(
    monitoringConfig.intervalSeconds
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Time series & Alerts state
  const [cpuSeries, setCpuSeries] = useState<TimeSeriesPoint[]>(() =>
    isDemoMode ? generateDemoTelemetry() : []
  );
  const [alerts, setAlerts] = useState<Alert[]>(() =>
    isDemoMode ? DEMO_ALERTS : []
  );
  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = useState<Set<string>>(new Set());
  const [resolvedAlertIds, setResolvedAlertIds] = useState<Set<string>>(new Set());
  const notifiedAlertsRef = useRef<Set<string>>(new Set());

  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [pendingAiPrompt, setPendingAiPrompt] = useState<string | null>(null);

  const metricHistoryRef = useRef<MetricHistory>(new Map());

  // Live Cloud Data Hook for authenticated users with connected credentials
  const cloudData = useCloudData({
    user: isDemoMode ? null : user,
    enabled: dataMode === "real-with-creds",
    intervalSeconds: monitoringConfig.intervalSeconds,
  });

  // Sync cloud metrics into cpuSeries when live series is returned
  useEffect(() => {
    if (dataMode === "real-with-creds" && cloudData.timeSeries.length > 0) {
      setCpuSeries(cloudData.timeSeries);
    }
  }, [dataMode, cloudData.timeSeries]);

  // Active resources based on mode:
  // - "real-with-creds": STRICTLY use live cloud resources from connected providers (no fallback to mock)
  // - "demo": use demoResources
  // - fallback: resourcesHook.resources (empty or unauthenticated)
  const activeResources =
    dataMode === "real-with-creds"
      ? cloudData.resources
      : isDemoMode
      ? demoResources
      : resourcesHook.resources;

  const activeUsageRecords =
    dataMode === "real-with-creds"
      ? cloudData.usageRecords
      : isDemoMode
      ? demoUsageRecords
      : resourcesHook.usageRecords;

  const activeFiles = isDemoMode ? DEMO_FILES : filesHook.files;
  const activeTotalStorage = isDemoMode
    ? DEMO_FILES.reduce((sum, f) => sum + f.sizeBytes, 0)
    : filesHook.totalStorageUsedBytes;

  // In demo mode, simulate dynamic metric drift periodically
  useEffect(() => {
    if (!isDemoMode || monitoringConfig.agentStatus === "paused") return;

    const interval = setInterval(() => {
      setDemoResources((prev) =>
        prev.map((r) => {
          if (r.status === "stopped" || r.status === "error") return r;

          const cpuDelta = (Math.random() - 0.5) * 8;
          const memDelta = (Math.random() - 0.5) * 6;
          const storageDelta = (Math.random() - 0.5) * 1.5;
          const netDelta = (Math.random() - 0.5) * 3;
          const reqDelta = (Math.random() - 0.5) * 25;

          const cpuUsage = Math.max(0, Math.min(100, Math.round(r.cpuUsage + cpuDelta)));
          const memoryUsage = Math.max(0, Math.min(100, Math.round(r.memoryUsage + memDelta)));
          const storageUsage = Math.max(
            5,
            Math.min(99, Math.round((r.storageUsage ?? 40) + storageDelta))
          );
          const networkTraffic = Math.max(
            0.1,
            Number(((r.networkTraffic ?? 12) + netDelta).toFixed(1))
          );
          const requestCount = Math.max(
            0,
            Math.round((r.requestCount ?? 150) + reqDelta)
          );

          let status = r.status;
          if (cpuUsage > 90 || memoryUsage > 90 || storageUsage > 92) {
            status = "warning";
          } else if (r.status === "warning" && cpuUsage < 85 && memoryUsage < 85) {
            status = "running";
          }

          return {
            ...r,
            cpuUsage,
            memoryUsage,
            storageUsage,
            networkTraffic,
            requestCount,
            status,
            lastUpdated: new Date().toISOString(),
          };
        })
      );
    }, (monitoringConfig.intervalSeconds || 5) * 1000);

    return () => clearInterval(interval);
  }, [isDemoMode, monitoringConfig.intervalSeconds, monitoringConfig.agentStatus]);

  // Periodic Telemetry Evaluation and Countdown
  useEffect(() => {
    if (monitoringConfig.agentStatus === "paused") return;

    const targetSec = monitoringConfig.intervalSeconds || 5;

    const countdownTimer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          // Trigger snapshot update
          const point = buildSnapshotFromResources(activeResources, thresholds);
          if (point) {
            setCpuSeries((old) => {
              const next = [...old, point];
              if (next.length > MAX_SERIES_POINTS) next.shift();
              return next;
            });
          }
          setLastRefreshTime(new Date());
          return targetSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [activeResources, monitoringConfig.intervalSeconds, monitoringConfig.agentStatus, thresholds]);

  // Anomaly / Threshold Alert Detection
  useEffect(() => {
    const rawAlerts = detectAnomalies(activeResources, metricHistoryRef.current, thresholds);

    // Apply user acknowledgements / resolutions
    const processedAlerts = rawAlerts
      .map((a) => {
        if (resolvedAlertIds.has(a.id)) return null;
        if (acknowledgedAlertIds.has(a.id)) {
          return { ...a, status: "acknowledged" as const };
        }
        return a;
      })
      .filter((a): a is Alert => a !== null);

    setAlerts(processedAlerts);

    // Notify user if notifications enabled and alert is newly fired
    if (thresholds.notificationsEnabled) {
      for (const a of processedAlerts) {
        if (!notifiedAlertsRef.current.has(a.id) && a.status === "active") {
          notifiedAlertsRef.current.add(a.id);
          toast.warning(`Threshold Alert: ${a.resourceName}`, {
            description: a.reason,
            action: {
              label: "Inspect",
              onClick: () => {
                const target = activeResources.find((r) => r.id === a.resourceId || r.name === a.resourceName);
                if (target) setSelectedResource(target);
              },
            },
          });
        }
      }
    }
  }, [activeResources, thresholds, acknowledgedAlertIds, resolvedAlertIds]);

  // Alert management actions
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAcknowledgedAlertIds((prev) => new Set(prev).add(alertId));
    toast.info("Alert acknowledged");
  }, []);

  const resolveAlert = useCallback((alertId: string) => {
    setResolvedAlertIds((prev) => new Set(prev).add(alertId));
    toast.success("Alert marked as resolved");
  }, []);

  // Manual Refresh
  const refreshMetrics = useCallback(() => {
    setIsRefreshing(true);
    if (dataMode === "real-with-creds") {
      cloudData.refresh();
    }
    const point = buildSnapshotFromResources(activeResources, thresholds);
    if (point) {
      setCpuSeries((old) => {
        const next = [...old, point];
        if (next.length > MAX_SERIES_POINTS) next.shift();
        return next;
      });
    }
    setLastRefreshTime(new Date());
    setRefreshCountdown(monitoringConfig.intervalSeconds || 5);

    setTimeout(() => {
      setIsRefreshing(false);
      toast.success(
        dataMode === "real-with-creds"
          ? `Live cloud metrics synced from connected providers`
          : `Metrics refreshed from ${monitoringConfig.provider} (ap-south-1)`
      );
    }, 400);
  }, [activeResources, monitoringConfig, thresholds, dataMode, cloudData]);

  // Controlled Test / Live Demonstration (Only available in Demo Mode)
  const simulateStressTest = useCallback(
    async (type: "cpu" | "storage" | "network" | "requests" | "reset") => {
      if (!isDemoMode) {
        toast.info("Simulated stress tests are only available in Demo Mode.");
        return;
      }

      const runningRes = activeResources.find((r) => r.status === "running") || activeResources[0];
      if (!runningRes) {
        toast.error("No running resource available for test simulation");
        return;
      }

      let patch: Partial<Resource> = {};
      let message = "";

      switch (type) {
        case "cpu":
          patch = { cpuUsage: 95, status: "warning" };
          message = `Controlled Test: Injected CPU Spike (95% > ${thresholds.cpu}% threshold) on ${runningRes.name}`;
          break;
        case "storage":
          patch = { storageUsage: 94, status: "warning" };
          message = `Controlled Test: Injected Storage Warning (94% > ${thresholds.storage}% threshold) on ${runningRes.name}`;
          break;
        case "network":
          patch = { networkTraffic: 88.5, status: "warning" };
          message = `Controlled Test: Injected Network Surge (88.5 MB/s > ${thresholds.network} MB/s threshold) on ${runningRes.name}`;
          break;
        case "requests":
          patch = { requestCount: 2450, status: "warning" };
          message = `Controlled Test: Injected Traffic Flood (2450 req/s > ${thresholds.requestCount} req/s threshold) on ${runningRes.name}`;
          break;
        case "reset":
          patch = {
            cpuUsage: 35,
            memoryUsage: 42,
            storageUsage: 48,
            networkTraffic: 12.4,
            requestCount: 260,
            status: "running",
          };
          message = `Reset fleet metrics to healthy baseline (35% CPU, 12 MB/s network)`;
          break;
      }

      setDemoResources((prev) =>
        prev.map((r) => (r.id === runningRes.id ? { ...r, ...patch } : r))
      );

      // Immediately build snapshot & notify
      refreshMetrics();
      toast.info(message);
    },
    [activeResources, isDemoMode, thresholds, refreshMetrics]
  );

  // Guarded actions
  const handleAddResource = useCallback(
    async (data: {
      name: string;
      type: ResourceType;
      size?: ResourceSize;
      region: string;
      status?: ResourceStatus;
    }) => {
      if (dataMode === "real-with-creds") {
        toast.info("In Real Mode, resources are synchronized automatically from your connected cloud provider.");
        return;
      }

      if (isDemoMode) {
        const size = data.size || "small";
        const newRes: Resource = {
          id: `demo-res-${Date.now()}`,
          name: data.name,
          type: data.type,
          size,
          region: data.region,
          status: data.status || "running",
          cpuUsage: Math.round(Math.random() * 40 + 20),
          memoryUsage: Math.round(Math.random() * 40 + 20),
          storageUsage: Math.round(Math.random() * 30 + 20),
          networkTraffic: Number((Math.random() * 15 + 4).toFixed(1)),
          requestCount: Math.round(Math.random() * 250 + 50),
          hourlyRate: 1.5,
          apiCredentials: generateFakeCredentials(),
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        };
        setDemoResources((prev) => [newRes, ...prev]);
        toast.success(`Resource "${data.name}" (${size}) created (Demo Mode)`);
        return;
      }
      if (!requireAuth()) return;
      await resourcesHook.addResource(data);
    },
    [isDemoMode, dataMode, requireAuth, resourcesHook]
  );

  const handleToggleResourceStatus = useCallback(
    async (id: string, currentStatus: ResourceStatus) => {
      if (isDemoMode) {
        const newStatus: ResourceStatus = currentStatus === "running" ? "stopped" : "running";
        setDemoResources((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: newStatus,
                  cpuUsage: newStatus === "stopped" ? 0 : 35,
                  memoryUsage: newStatus === "stopped" ? 0 : 40,
                  networkTraffic: newStatus === "stopped" ? 0 : 12,
                  requestCount: newStatus === "stopped" ? 0 : 120,
                }
              : r
          )
        );
        toast.success(`Resource ${newStatus === "running" ? "started" : "stopped"}`);
        return;
      }
      if (!requireAuth()) return;
      await resourcesHook.toggleResourceStatus(id, currentStatus);
    },
    [isDemoMode, requireAuth, resourcesHook]
  );

  const handleDeleteResource = useCallback(
    async (id: string) => {
      if (isDemoMode) {
        setDemoResources((prev) => prev.filter((r) => r.id !== id));
        toast.success("Resource deleted (Demo Mode)");
        return;
      }
      if (!requireAuth()) return;
      await resourcesHook.deleteResource(id);
    },
    [isDemoMode, requireAuth, resourcesHook]
  );

  const handleRegenerateCredentials = useCallback(
    async (id: string) => {
      if (isDemoMode) {
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

  const openAiWithPrompt = useCallback((prompt?: string) => {
    if (prompt) setPendingAiPrompt(prompt);
    setIsAiOpen(true);
  }, []);

  const clearPendingAiPrompt = useCallback(() => {
    setPendingAiPrompt(null);
  }, []);

  const abnormal = isDemoMode
    ? demoResources.filter(
        (r) =>
          r.cpuUsage > thresholds.cpu ||
          r.memoryUsage > thresholds.memory ||
          r.status === "warning" ||
          r.status === "error"
      )
    : getAbnormalResources(activeResources, thresholds);

  const distribution = getResourceDistribution(activeResources);

  const syncedSelectedResource = selectedResource
    ? activeResources.find((r) => r.id === selectedResource.id) ?? null
    : null;

  const pathname = usePathname();
  const isAccessibleInNoCreds =
    pathname?.startsWith("/dashboard/integrations") ||
    pathname?.startsWith("/dashboard/settings") ||
    pathname?.startsWith("/dashboard/help");

  // When the user is authenticated but has not connected any cloud providers,
  // render the empty-state onboarding screen on data-dependent dashboard pages.
  const effectiveChildren =
    dataMode === "real-no-creds" && !isAccessibleInNoCreds ? (
      <CloudProviderEmptyState />
    ) : (
      <>
        {dataMode === "real-with-creds" && cloudData.errors.length > 0 && (
          <CloudErrorBanner
            errors={cloudData.errors}
            onDismiss={cloudData.dismissError}
            onRetry={cloudData.refresh}
          />
        )}
        {children}
      </>
    );

  return (
    <DashboardContext.Provider
      value={{
        user,
        auth,
        isDemoMode,
        dataMode,
        connectedProviders,
        requireAuth,
        resources: activeResources,
        abnormal,
        resourcesLoading:
          isDemoMode
            ? false
            : dataMode === "real-with-creds"
            ? cloudData.loading
            : resourcesHook.loading,
        addResource: handleAddResource,
        toggleResourceStatus: handleToggleResourceStatus,
        deleteResource: handleDeleteResource,
        regenerateCredentials: handleRegenerateCredentials,
        viewMode,
        setViewMode,
        thresholds,
        updateThresholds,
        resetThresholds,
        monitoringConfig,
        updateMonitoringConfig,
        usageRecords: activeUsageRecords,
        usageLoading:
          isDemoMode
            ? false
            : dataMode === "real-with-creds"
            ? cloudData.loading
            : resourcesHook.usageLoading,
        alerts,
        acknowledgeAlert,
        resolveAlert,
        simulateStressTest,
        refreshMetrics,
        lastRefreshTime,
        refreshCountdown,
        isRefreshing,
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
      {effectiveChildren}
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
