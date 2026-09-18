"use client";

// ---------------------------------------------------------------------------
// useResources — live Firestore resources via onSnapshot
// ---------------------------------------------------------------------------
// Listens in real-time to /users/{uid}/resources and provides CRUD helpers.
// Client-side CPU/memory simulation nudges values every 5 seconds.
// After any status change, recalculates estimatedMonthlyCost on the user doc.
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
} from "firebase/firestore";
import { db } from "./firebase";
import { calculateMonthlyCost } from "./cost";
import { toast } from "sonner";

export type ResourceType = "VM" | "Database" | "Network";
export type ResourceStatus = "running" | "stopped" | "warning" | "error";

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  region: string;
  cpuUsage: number;
  memoryUsage: number;
  createdAt: unknown;
  lastUpdated: unknown;
}

export const REGIONS = [
  "us-east-1",
  "us-west-2",
  "eu-west-1",
  "ap-southeast-1",
] as const;
export type Region = (typeof REGIONS)[number];

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useResources(uid: string | undefined) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const resourcesRef = useRef<Resource[]>([]);

  // Keep ref in sync for simulation interval
  useEffect(() => {
    resourcesRef.current = resources;
  }, [resources]);

  // Real-time listener
  useEffect(() => {
    if (!uid) {
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
        const items: Resource[] = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Resource[];
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

  // Client-side simulation: nudge CPU/memory every 5s
  useEffect(() => {
    if (!uid) return;

    const interval = setInterval(async () => {
      const current = resourcesRef.current;
      for (const r of current) {
        if (r.status === "stopped" || r.status === "error") continue;

        const cpuDelta = (Math.random() - 0.5) * 8;
        const memDelta = (Math.random() - 0.5) * 6;
        const cpuUsage = clamp(Math.round(r.cpuUsage + cpuDelta), 0, 100);
        const memoryUsage = clamp(
          Math.round(r.memoryUsage + memDelta),
          0,
          100
        );

        // Auto-derive warning when metrics spike
        let status: ResourceStatus = r.status;
        if (cpuUsage > 90 || memoryUsage > 90) status = "warning";
        else if (r.status === "warning" && cpuUsage < 85 && memoryUsage < 85)
          status = "running";

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

  // Recalculate cost whenever resources change
  const recalcCost = useCallback(
    async (updatedResources?: Resource[]) => {
      if (!uid) return;
      const res = updatedResources ?? resourcesRef.current;
      const runningCount = res.filter((r) => r.status === "running").length;

      try {
        // Get current storage bytes from user doc — we don't want to
        // import useFiles here, so read the user doc directly.
        const { getDoc } = await import("firebase/firestore");
        const userSnap = await getDoc(doc(db, "users", uid));
        const totalStorageUsedBytes =
          (userSnap.data()?.totalStorageUsedBytes as number) ?? 0;

        const cost = calculateMonthlyCost(totalStorageUsedBytes, runningCount);
        await updateDoc(doc(db, "users", uid), { estimatedMonthlyCost: cost });
      } catch (err) {
        console.error("Cost recalculation failed:", err);
      }
    },
    [uid]
  );

  // CRUD ────────────────────────────────────────────────────────────────────

  const addResource = useCallback(
    async (data: {
      name: string;
      type: ResourceType;
      region: string;
      status?: ResourceStatus;
    }) => {
      if (!uid) return;
      try {
        await addDoc(collection(db, "users", uid, "resources"), {
          name: data.name,
          type: data.type,
          region: data.region,
          status: data.status ?? "running",
          cpuUsage: Math.round(Math.random() * 60 + 10),
          memoryUsage: Math.round(Math.random() * 50 + 20),
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        });
        toast.success(`Resource "${data.name}" created`);
        // Cost will be recalculated by the onSnapshot callback
        setTimeout(() => recalcCost(), 1000);
      } catch (err) {
        console.error("Add resource error:", err);
        toast.error("Failed to add resource");
      }
    },
    [uid, recalcCost]
  );

  const toggleResourceStatus = useCallback(
    async (resourceId: string, currentStatus: ResourceStatus) => {
      if (!uid) return;
      const newStatus = currentStatus === "running" ? "stopped" : "running";
      try {
        await updateDoc(doc(db, "users", uid, "resources", resourceId), {
          status: newStatus,
          cpuUsage: newStatus === "stopped" ? 0 : Math.round(Math.random() * 40 + 10),
          memoryUsage: newStatus === "stopped" ? 0 : Math.round(Math.random() * 30 + 20),
          lastUpdated: serverTimestamp(),
        });
        toast.success(
          `Resource ${newStatus === "running" ? "started" : "stopped"}`
        );
        setTimeout(() => recalcCost(), 1000);
      } catch (err) {
        console.error("Toggle status error:", err);
        toast.error("Failed to update resource");
      }
    },
    [uid, recalcCost]
  );

  const deleteResource = useCallback(
    async (resourceId: string) => {
      if (!uid) return;
      try {
        await deleteDoc(doc(db, "users", uid, "resources", resourceId));
        toast.success("Resource deleted");
        setTimeout(() => recalcCost(), 1000);
      } catch (err) {
        console.error("Delete resource error:", err);
        toast.error("Failed to delete resource");
      }
    },
    [uid, recalcCost]
  );

  return {
    resources,
    loading,
    addResource,
    toggleResourceStatus,
    deleteResource,
    recalcCost,
  };
}
