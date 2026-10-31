// ---------------------------------------------------------------------------
// Server-Side In-Memory Cache for Cloud Telemetry
// ---------------------------------------------------------------------------
// Prevents cloud API rate limits, costs, and thundering herd on dashboard refresh.
// Survives across requests within the same Next.js server worker process.
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  cachedAt: string;
}

interface GlobalCacheStore {
  __cloudMonitorCache?: Map<string, CacheEntry<any>>;
}
const globalCache = globalThis as unknown as GlobalCacheStore;
if (!globalCache.__cloudMonitorCache) {
  globalCache.__cloudMonitorCache = new Map();
}
const cacheStore = globalCache.__cloudMonitorCache;

export const DEFAULT_CACHE_TTL_MS = 60 * 1000; // 60 seconds for metrics/resources
export const BILLING_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes for billing

/**
 * Retrieve cached cloud data if available and not expired
 */
export function getCachedData<T>(key: string): T | null {
  const entry = cacheStore.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * Store data with a specified time-to-live
 */
export function setCachedData<T>(
  key: string,
  data: T,
  ttlMs: number = DEFAULT_CACHE_TTL_MS
): void {
  cacheStore.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
    cachedAt: new Date().toISOString(),
  });
}

/**
 * Invalidate all cached cloud data for a user (e.g. after adding/removing a provider)
 */
export function invalidateUserCache(uid: string): void {
  for (const key of cacheStore.keys()) {
    if (key.startsWith(`${uid}:`)) {
      cacheStore.delete(key);
    }
  }
}
