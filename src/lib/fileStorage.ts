// ---------------------------------------------------------------------------
// Client-side IndexedDB Blob Storage for Large Files (up to 200MB)
// ---------------------------------------------------------------------------
// Firestore documents have a strict 1MB size limit. To support files up to
// 200MB without requiring Firebase Cloud Storage Blaze plan, file binaries
// are safely kept in browser IndexedDB while metadata (name, size, cost,
// timestamp) is synchronized in real-time in Firestore.
// ---------------------------------------------------------------------------

const DB_NAME = "CloudMonitorStore";
const STORE_NAME = "blobs";

function openBlobDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not available in current environment"));
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocalBlob(id: string, blob: Blob): Promise<void> {
  try {
    const db = await openBlobDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(blob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Could not save blob to IndexedDB:", err);
  }
}

export async function getLocalBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openBlobDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function deleteLocalBlob(id: string): Promise<void> {
  try {
    const db = await openBlobDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}
