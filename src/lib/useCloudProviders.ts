"use client";

// ---------------------------------------------------------------------------
// useCloudProviders — Client hook for managing encrypted cloud connections
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/useAuth";
import type { ConnectedProvider } from "@/lib/useAppMode";

export interface ProviderConnectionPayload {
  provider: "aws" | "gcp" | "azure";
  credentials: Record<string, any>;
  label?: string;
  region?: string;
  projectId?: string;
}

function readCachedProviders(): ConnectedProvider[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("crm_connected_providers");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useCloudProviders() {
  const auth = useAuth();
  const [providers, setProviders] = useState<ConnectedProvider[]>(() => readCachedProviders());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    if (!auth.user) {
      setProviders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = await auth.user.getIdToken();
      const res = await fetch("/api/vault/providers", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      const list = data.providers ?? [];
      setProviders(list);
      if (typeof window !== "undefined") {
        localStorage.setItem("crm_connected_providers", JSON.stringify(list));
        window.dispatchEvent(new CustomEvent("crm-providers-updated"));
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load cloud providers");
      // Keep cached providers if fetch failed momentarily
    } finally {
      setLoading(false);
    }
  }, [auth.user]);

  useEffect(() => {
    if (!auth.loading) {
      fetchProviders();
    }
  }, [auth.loading, fetchProviders]);

  const connectProvider = async (payload: ProviderConnectionPayload) => {
    if (!auth.user) throw new Error("Must be logged in to connect cloud provider");
    setActionLoading(`connect-${payload.provider}`);
    try {
      const token = await auth.user.getIdToken();
      const res = await fetch("/api/vault/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save cloud credentials");
      }

      await fetchProviders();
      return data;
    } finally {
      setActionLoading(null);
    }
  };

  const disconnectProvider = async (provider: "aws" | "gcp" | "azure") => {
    if (!auth.user) throw new Error("Must be logged in to disconnect cloud provider");
    setActionLoading(`disconnect-${provider}`);
    try {
      const token = await auth.user.getIdToken();
      const res = await fetch("/api/vault/disconnect", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ provider }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to disconnect ${provider}`);
      }

      await fetchProviders();
      return data;
    } finally {
      setActionLoading(null);
    }
  };

  const testConnection = async (provider: "aws" | "gcp" | "azure", credentials?: Record<string, any>) => {
    if (!auth.user) throw new Error("Must be logged in to test connection");
    setActionLoading(`test-${provider}`);
    try {
      const token = await auth.user.getIdToken();
      const res = await fetch("/api/vault/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ provider, credentials }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Connection test failed");
      }

      return data;
    } finally {
      setActionLoading(null);
    }
  };

  const isConnected = (provider: "aws" | "gcp" | "azure") => {
    return providers.some((p) => p.provider === provider);
  };

  const getProviderInfo = (provider: "aws" | "gcp" | "azure") => {
    return providers.find((p) => p.provider === provider);
  };

  return {
    providers,
    loading,
    error,
    actionLoading,
    fetchProviders,
    connectProvider,
    disconnectProvider,
    testConnection,
    isConnected,
    getProviderInfo,
  };
}
