"use client";

// ---------------------------------------------------------------------------
// useAppMode — Centralised three-state application mode resolver
// ---------------------------------------------------------------------------
// dataMode values:
//   "demo"            → isDemoMode=true (localStorage "crm_demo_mode")
//   "real-no-creds"   → authenticated user, but no cloud providers connected yet
//   "real-with-creds" → authenticated user with ≥1 cloud credential saved
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback, useRef } from "react";
import type { User } from "firebase/auth";

export type DataMode = "demo" | "real-no-creds" | "real-with-creds";

export interface ConnectedProvider {
  provider: "aws" | "gcp" | "azure";
  connectedAt: string;
  label: string;
}

interface AppModeState {
  isDemoMode: boolean;
  isAuthenticated: boolean;
  dataMode: DataMode;
  connectedProviders: ConnectedProvider[];
  providersLoading: boolean;
  providersError: string | null;
  setDemoMode: (enabled: boolean) => void;
  refreshProviders: () => void;
}

const DEMO_MODE_KEY = "crm_demo_mode";
const PROVIDERS_CACHE_KEY = "crm_connected_providers";

function readDemoFlag(): boolean {
  if (typeof window === "undefined") return false;
  return (
    localStorage.getItem(DEMO_MODE_KEY) === "true" ||
    sessionStorage.getItem(DEMO_MODE_KEY) === "true"
  );
}

function readCachedProviders(): ConnectedProvider[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROVIDERS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useAppMode(user: User | null, authLoading: boolean): AppModeState {
  const [isDemoMode, setIsDemoModeState] = useState<boolean | null>(null);
  const [connectedProviders, setConnectedProviders] = useState<ConnectedProvider[]>(() =>
    readCachedProviders()
  );
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [fetchGen, setFetchGen] = useState(0);

  // Hydrate demo flag on mount
  useEffect(() => {
    setIsDemoModeState(readDemoFlag());
    setConnectedProviders(readCachedProviders());
  }, []);

  // Listen for provider connection updates from other components
  useEffect(() => {
    const onProvidersUpdated = () => {
      setConnectedProviders(readCachedProviders());
      setFetchGen((g) => g + 1);
    };

    window.addEventListener("crm-providers-updated", onProvidersUpdated);
    window.addEventListener("storage", onProvidersUpdated);

    return () => {
      window.removeEventListener("crm-providers-updated", onProvidersUpdated);
      window.removeEventListener("storage", onProvidersUpdated);
    };
  }, []);

  const setDemoMode = useCallback((enabled: boolean) => {
    if (typeof window === "undefined") return;
    if (enabled) {
      localStorage.setItem(DEMO_MODE_KEY, "true");
    } else {
      localStorage.removeItem(DEMO_MODE_KEY);
      sessionStorage.removeItem(DEMO_MODE_KEY);
    }
    setIsDemoModeState(enabled);
  }, []);

  const refreshProviders = useCallback(() => {
    setFetchGen((g) => g + 1);
  }, []);

  // Fetch connected providers from the server
  useEffect(() => {
    if (isDemoMode === null || authLoading) return;
    if (isDemoMode || !user) {
      setConnectedProviders([]);
      setProvidersLoading(false);
      return;
    }

    let cancelled = false;
    setProvidersLoading(true);
    setProvidersError(null);

    const fetchProviders = async () => {
      try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/vault/providers", {
          headers: { Authorization: `Bearer ${idToken}` },
          cache: "no-store",
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Server returned ${res.status}`);
        }

        const data: { providers: ConnectedProvider[] } = await res.json();
        if (!cancelled) {
          const list = data.providers ?? [];
          setConnectedProviders(list);
          if (typeof window !== "undefined") {
            localStorage.setItem(PROVIDERS_CACHE_KEY, JSON.stringify(list));
          }
          setProvidersLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load connected providers";
          setProvidersError(message);
          setProvidersLoading(false);
        }
      }
    };

    fetchProviders();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, authLoading, isDemoMode, fetchGen]);

  const resolvedIsDemoMode = isDemoMode ?? false;
  const isAuthenticated = !!user;

  // Derive stable three-state dataMode
  let dataMode: DataMode;
  if (resolvedIsDemoMode) {
    dataMode = "demo";
  } else if (!isAuthenticated) {
    dataMode = "demo";
  } else if (connectedProviders.length > 0) {
    dataMode = "real-with-creds";
  } else if (providersLoading) {
    // While loading from server on initial mount, do NOT flash the empty state
    dataMode = "real-with-creds";
  } else {
    dataMode = "real-no-creds";
  }

  return {
    isDemoMode: resolvedIsDemoMode,
    isAuthenticated,
    dataMode,
    connectedProviders,
    providersLoading,
    providersError,
    setDemoMode,
    refreshProviders,
  };
}
