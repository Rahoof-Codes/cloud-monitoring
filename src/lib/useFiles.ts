"use client";

// ---------------------------------------------------------------------------
// useFiles — Hybrid File Storage (Firestore + Local IndexedDB for Large Files)
// ---------------------------------------------------------------------------
// Supports files up to 200MB for monitoring showcase:
//   - Files <= 700KB: Stored as base64 in Firestore doc & IndexedDB
//   - Files > 700KB up to 200MB: Binary stored in browser IndexedDB,
//     while full file metadata (size, name, timestamps) and user
//     storage/cost counters are tracked in real-time in Firestore.
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import { STORAGE_RATE_PER_GB_MONTH } from "./pricing";
import { saveLocalBlob, deleteLocalBlob } from "./fileStorage";
import { toast } from "sonner";

/** Max file size in bytes: 200 MB */
export const MAX_FILE_SIZE = 200 * 1024 * 1024;

/** Max size for storing inline base64 in a single Firestore document */
const FIRESTORE_DOC_MAX_FILE_SIZE = 700 * 1024; // 700 KB

export interface UserFile {
  id: string;
  fileName: string;
  sizeBytes: number;
  dataUrl?: string; // base64-encoded for small files
  isLocalBlob?: boolean; // true if binary is in local IndexedDB
  mimeType: string;
  uploadedAt: unknown;
}

export function useFiles(uid: string | undefined) {
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [totalStorageUsedBytes, setTotalStorageUsedBytes] = useState(0);

  // Real-time listener for files
  useEffect(() => {
    if (!uid || uid === "demo-user") {
      setFiles([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users", uid, "files"),
      orderBy("uploadedAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: UserFile[] = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as UserFile[];
        setFiles(items);

        // Recalculate total storage from file sizes
        const total = items.reduce((sum, f) => sum + (f.sizeBytes || 0), 0);
        setTotalStorageUsedBytes(total);

        setLoading(false);
      },
      (err) => {
        console.error("Files listener error:", err);
        toast.error("Failed to load files");
        setLoading(false);
      }
    );

    return unsub;
  }, [uid]);

  // Recalc storage on user doc
  const recalcStorage = useCallback(
    async (newTotalBytes: number) => {
      if (!uid || uid === "demo-user") return;
      try {
        const storageCost = Math.round(((newTotalBytes / 1e9) * STORAGE_RATE_PER_GB_MONTH) * 100) / 100;
        await updateDoc(doc(db, "users", uid), {
          totalStorageUsedBytes: newTotalBytes,
          estimatedStorageMonthlyCost: storageCost,
        });
      } catch (err) {
        console.error("Storage recalculation failed:", err);
      }
    },
    [uid]
  );

  // Read small file as base64 data URL
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  // Upload a file (supports up to 200MB)
  const uploadFile = useCallback(
    async (file: File) => {
      if (!uid) return;

      // Check 200MB limit
      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          `File exceeds 200MB limit: ${(file.size / (1024 * 1024)).toFixed(1)}MB.`
        );
        return;
      }

      setUploadProgress(10);

      try {
        const fileId = crypto.randomUUID();
        const isSmall = file.size <= FIRESTORE_DOC_MAX_FILE_SIZE;

        // Save binary to local IndexedDB
        setUploadProgress(25);
        await saveLocalBlob(fileId, file);

        let dataUrl = "";
        if (isSmall) {
          setUploadProgress(45);
          dataUrl = await readFileAsDataUrl(file);
        }

        setUploadProgress(70);

        // Write file record and metadata to Firestore
        await setDoc(doc(db, "users", uid, "files", fileId), {
          fileName: file.name,
          sizeBytes: file.size,
          mimeType: file.type || "application/octet-stream",
          dataUrl: isSmall ? dataUrl : "",
          isLocalBlob: !isSmall,
          uploadedAt: serverTimestamp(),
        });

        setUploadProgress(90);

        // Recalculate total storage in user profile
        const newTotal = totalStorageUsedBytes + file.size;
        await recalcStorage(newTotal);

        setUploadProgress(100);
        toast.success(`"${file.name}" uploaded successfully`);

        setTimeout(() => {
          setUploadProgress(null);
        }, 500);
      } catch (err) {
        console.error("Upload error:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to upload file"
        );
        setUploadProgress(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, totalStorageUsedBytes, recalcStorage]
  );

  // Delete a file
  const deleteFile = useCallback(
    async (fileId: string, _storagePath: string, sizeBytes: number) => {
      if (!uid) return;

      try {
        // Delete Firestore document
        await deleteDoc(doc(db, "users", uid, "files", fileId));

        // Delete from local IndexedDB if stored there
        await deleteLocalBlob(fileId);

        // Recalculate total storage
        const newTotal = Math.max(0, totalStorageUsedBytes - sizeBytes);
        await recalcStorage(newTotal);

        toast.success("File deleted");
      } catch (err) {
        console.error("Delete file error:", err);
        toast.error("Failed to delete file");
      }
    },
    [uid, totalStorageUsedBytes, recalcStorage]
  );

  return {
    files,
    loading,
    uploadFile,
    deleteFile,
    uploadProgress,
    totalStorageUsedBytes,
  };
}
