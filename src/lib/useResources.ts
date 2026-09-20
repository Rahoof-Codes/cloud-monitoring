"use client";

// ---------------------------------------------------------------------------
// useResources — live Firestore resources & usage subcollection via onSnapshot
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback, useRef } from "react";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";
import { ResourceType, ResourceSize, getHourlyRate } from "./pricing";
import { generateFakeCredentials, type ApiCredentials } from "./credentials";
import type { UsageRecord } from "./billing";
import { toast } from "sonner";

export type { ResourceType, ResourceSize };
export type ResourceStatus = "running" | "stopped" | "warning" | "error";

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  size: ResourceSize;
  status: ResourceStatus;
  region: string;
  cpuUsage: number;
  memoryUsage: number;
  hourlyRate: number;
  apiCredentials: ApiCredentials;
  createdAt: unknown;
  lastUpdated: unknown;
}

export const REGIONS = [
  "ap-south-1",
  "us-east-1",
  "us-west-2",
  "eu-west-1",
  "ap-southeast-1",
] as const;
export type Region = (typeof REGIONS)[number];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function useResources(uid: string | undefined) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageLoading, setUsageLoading] = useState(true);
  const resourcesRef = useRef<Resource[]>([]);
  const migrationRanRef = useRef(false);

  useEffect(() => {
    resourcesRef.current = resources;
  }, [resources]);

  // Real-time listener for Resources
  useEffect(() => {
    if (!uid || uid === "demo-user") {
      setResources([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users", uid, "resources"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: Resource[] = snap.docs.map((d) => {
          const data = d.data();
          const type = (data.type || "VM") as ResourceType;
          const size = (data.size || "small") as ResourceSize;
          return {
            id: d.id,
            name: data.name || "Resource",
            type,
            size,
            status: (data.status || "running") as ResourceStatus,
            region: data.region || "ap-south-1",
            cpuUsage: data.cpuUsage ?? 0,
            memoryUsage: data.memoryUsage ?? 0,
            hourlyRate: data.hourlyRate ?? getHourlyRate(type, size),
            apiCredentials: data.apiCredentials || generateFakeCredentials(),
            createdAt: data.createdAt,
            lastUpdated: data.lastUpdated,
          };
        });
        setResources(items);
        setLoading(false);
      },
      (err) => {
        console.error("Resources listener error:", err);
        toast.error("Failed to load resources");
        setLoading(false);
      }
    );

    return unsub;
  }, [uid]);

  // Real-time listener for Usage Records subcollection
  useEffect(() => {
    if (!uid || uid === "demo-user") {
      setUsageRecords([]);
      setUsageLoading(false);
      return;
    }

    const q = query(
      collection(db, "users", uid, "usage"),
      orderBy("startedAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const records: UsageRecord[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            resourceId: data.resourceId,
            resourceName: data.resourceName,
            type: data.type || "VM",
            size: data.size || "small",
            hourlyRate: data.hourlyRate ?? getHourlyRate(data.type || "VM", data.size || "small"),
            startedAt: data.startedAt,
            endedAt: data.endedAt ?? null,
          };
        });
        setUsageRecords(records);
        setUsageLoading(false);
      },
      (err) => {
        console.error("Usage records listener error:", err);
        setUsageLoading(false);
      }
    );

    return unsub;
  }, [uid]);

  // Migration: Check for existing resources without open usage records or credentials
  useEffect(() => {
    if (!uid || uid === "demo-user" || loading || usageLoading || migrationRanRef.current) {
      return;
    }

    const runMigration = async () => {
      migrationRanRef.current = true;
      try {
        for (const r of resources) {
          // 1. Backfill missing credentials or size on resource doc
          const needsDocUpdate = !r.apiCredentials?.accessKey || !r.size || !r.hourlyRate;
          if (needsDocUpdate) {
            const size = r.size || "small";
            const rate = getHourlyRate(r.type, size);
            const creds = r.apiCredentials?.accessKey ? r.apiCredentials : generateFakeCredentials();
            await updateDoc(doc(db, "users", uid, "resources", r.id), {
              size,
              hourlyRate: rate,
              apiCredentials: creds,
            });
          }

          // 2. If running, verify an open usage record exists
          if (r.status === "running") {
            const hasOpenRecord = usageRecords.some(
              (u) => u.resourceId === r.id && u.endedAt === null
            );

            if (!hasOpenRecord) {
              const rate = r.hourlyRate || getHourlyRate(r.type, r.size || "small");
              await addDoc(collection(db, "users", uid, "usage"), {
                resourceId: r.id,
                resourceName: r.name,
                type: r.type,
                size: r.size || "small",
                hourlyRate: rate,
                startedAt: r.createdAt || serverTimestamp(),
                endedAt: null,
              });
            }
          }
        }
      } catch (err) {
        console.error("Usage migration error:", err);
      }
    };

    runMigration();
  }, [uid, resources, usageRecords, loading, usageLoading]);

  // Simulation: nudge CPU/memory for running resources every 5s
  useEffect(() => {
    if (!uid || uid === "demo-user") return;

    const interval = setInterval(async () => {
      const current = resourcesRef.current;
      for (const r of current) {
        if (r.status === "stopped" || r.status === "error") continue;

        const cpuDelta = (Math.random() - 0.5) * 8;
        const memDelta = (Math.random() - 0.5) * 6;
        const cpuUsage = clamp(Math.round(r.cpuUsage + cpuDelta), 0, 100);
        const memoryUsage = clamp(Math.round(r.memoryUsage + memDelta), 0, 100);

        let status: ResourceStatus = r.status;
        if (cpuUsage > 90 || memoryUsage > 90) status = "warning";
        else if (r.status === "warning" && cpuUsage < 85 && memoryUsage < 85) {
          status = "running";
        }

        try {
          await updateDoc(doc(db, "users", uid, "resources", r.id), {
            cpuUsage,
            memoryUsage,
            status,
            lastUpdated: serverTimestamp(),
          });
        } catch {
          // Silently ignore simulation write failures
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [uid]);

  // CRUD Operations ───────────────────────────────────────────────────────────

  const addResource = useCallback(
    async (data: {
      name: string;
      type: ResourceType;
      size?: ResourceSize;
      region: string;
      status?: ResourceStatus;
    }) => {
      if (!uid || uid === "demo-user") return;
      const size: ResourceSize = data.size || "small";
      const hourlyRate = getHourlyRate(data.type, size);
      const apiCredentials = generateFakeCredentials();
      const status: ResourceStatus = data.status ?? "running";

      try {
        const resDocRef = await addDoc(collection(db, "users", uid, "resources"), {
          name: data.name,
          type: data.type,
          size,
          region: data.region,
          status,
          cpuUsage: Math.round(Math.random() * 60 + 10),
          memoryUsage: Math.round(Math.random() * 50 + 20),
          hourlyRate,
          apiCredentials,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        });

        // If created in running status, add initial open usage record
        if (status === "running") {
          await addDoc(collection(db, "users", uid, "usage"), {
            resourceId: resDocRef.id,
            resourceName: data.name,
            type: data.type,
            size,
            hourlyRate,
            startedAt: serverTimestamp(),
            endedAt: null,
          });
        }

        toast.success(`Resource "${data.name}" (${size}) created`);
      } catch (err) {
        console.error("Add resource error:", err);
        toast.error("Failed to add resource");
      }
    },
    [uid]
  );

  const toggleResourceStatus = useCallback(
    async (resourceId: string, currentStatus: ResourceStatus) => {
      if (!uid || uid === "demo-user") return;
      const newStatus: ResourceStatus = currentStatus === "running" ? "stopped" : "running";

      try {
        // Update resource document
        await updateDoc(doc(db, "users", uid, "resources", resourceId), {
          status: newStatus,
          cpuUsage: newStatus === "stopped" ? 0 : Math.round(Math.random() * 40 + 10),
          memoryUsage: newStatus === "stopped" ? 0 : Math.round(Math.random() * 30 + 20),
          lastUpdated: serverTimestamp(),
        });

        if (newStatus === "stopped") {
          // Close open usage record
          const q = query(
            collection(db, "users", uid, "usage"),
            where("resourceId", "==", resourceId),
            where("endedAt", "==", null)
          );
          const snap = await getDocs(q);
          for (const d of snap.docs) {
            await updateDoc(doc(db, "users", uid, "usage", d.id), {
              endedAt: serverTimestamp(),
            });
          }
        } else {
          // Starting after a stop: create new open usage record
          const currentRes = resourcesRef.current.find((r) => r.id === resourceId);
          if (currentRes) {
            await addDoc(collection(db, "users", uid, "usage"), {
              resourceId,
              resourceName: currentRes.name,
              type: currentRes.type,
              size: currentRes.size || "small",
              hourlyRate: currentRes.hourlyRate || getHourlyRate(currentRes.type, currentRes.size || "small"),
              startedAt: serverTimestamp(),
              endedAt: null,
            });
          }
        }

        toast.success(`Resource ${newStatus === "running" ? "started" : "stopped"}`);
      } catch (err) {
        console.error("Toggle status error:", err);
        toast.error("Failed to update resource");
      }
    },
    [uid]
  );

  const deleteResource = useCallback(
    async (resourceId: string) => {
      if (!uid || uid === "demo-user") return;
      try {
        // 1. Close any open usage record so cost up to deletion is captured
        const q = query(
          collection(db, "users", uid, "usage"),
          where("resourceId", "==", resourceId),
          where("endedAt", "==", null)
        );
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          await updateDoc(doc(db, "users", uid, "usage", d.id), {
            endedAt: serverTimestamp(),
          });
        }

        // 2. Delete resource doc (usage records are kept in users/{uid}/usage!)
        await deleteDoc(doc(db, "users", uid, "resources", resourceId));
        toast.success("Resource deleted. Usage charges retained in billing.");
      } catch (err) {
        console.error("Delete resource error:", err);
        toast.error("Failed to delete resource");
      }
    },
    [uid]
  );

  const regenerateCredentials = useCallback(
    async (resourceId: string) => {
      if (!uid || uid === "demo-user") return;
      try {
        const newCreds = generateFakeCredentials();
        await updateDoc(doc(db, "users", uid, "resources", resourceId), {
          apiCredentials: newCreds,
          lastUpdated: serverTimestamp(),
        });
        toast.success("API Credentials regenerated");
      } catch (err) {
        console.error("Regenerate credentials error:", err);
        toast.error("Failed to regenerate credentials");
      }
    },
    [uid]
  );

  return {
    resources,
    usageRecords,
    loading,
    usageLoading,
    addResource,
    toggleResourceStatus,
    deleteResource,
    regenerateCredentials,
  };
}
