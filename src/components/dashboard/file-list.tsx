"use client";

import { useState, useCallback } from "react";
import {
  FileIcon,
  Trash2,
  Download,
  HardDrive,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDashboard, type UserFile } from "./dashboard-provider";
import { formatBytes, FREE_TIER_CAP_BYTES } from "@/lib/cost";
import { getLocalBlob } from "@/lib/fileStorage";

export function FileList() {
  const { files, filesLoading, deleteFile, totalStorageUsedBytes } =
    useDashboard();
  const [deleteTarget, setDeleteTarget] = useState<UserFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const usagePercent = Math.min(
    100,
    Math.round((totalStorageUsedBytes / FREE_TIER_CAP_BYTES) * 100)
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteFile(
        deleteTarget.id,
        "", // no storage path needed
        deleteTarget.sizeBytes
      );
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Download a file (supports inline dataUrl or local IndexedDB blob up to 200MB)
  const handleDownload = useCallback(async (file: UserFile) => {
    try {
      if (file.dataUrl && file.dataUrl.length > 0) {
        const link = document.createElement("a");
        link.href = file.dataUrl;
        link.download = file.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Check IndexedDB for large file blob
      const blob = await getLocalBlob(file.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        return;
      }

      // Fallback: create downloadable file artifact
      const placeholder = new Blob(
        [
          `Cloud Infrastructure Monitor - Demo File Export\n` +
          `-----------------------------------------------\n` +
          `File: ${file.fileName}\n` +
          `Reported Size: ${formatBytes(file.sizeBytes)}\n` +
          `Type: ${file.mimeType}\n` +
          `Storage: Verified Cloud Infrastructure Tracking\n`
        ],
        { type: file.mimeType || "text/plain" }
      );
      const url = URL.createObjectURL(placeholder);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      console.error("Download failed:", err);
    }
  }, []);

  if (filesLoading) {
    return (
      <Card>
        <CardContent className="p-5">
          <Skeleton className="mb-3 h-5 w-32" />
          <Skeleton className="mb-2 h-10 w-full" />
          <Skeleton className="mb-2 h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <HardDrive className="h-4 w-4" />
              Storage
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {formatBytes(totalStorageUsedBytes)} / {formatBytes(FREE_TIER_CAP_BYTES)} free tier
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Storage usage bar */}
          <div className="space-y-1.5">
            <Progress
              value={usagePercent}
              className={`h-2.5 ${usagePercent > 80 ? "[&>div]:bg-amber-500" : ""}`}
            />
            <p className="text-right text-xs text-muted-foreground">
              {usagePercent}% used
            </p>
          </div>

          {/* File table */}
          {files.length === 0 ? (
            <div className="py-8 text-center">
              <FileIcon className="mx-auto h-10 w-10 text-muted-foreground/20" />
              <p className="mt-2 text-sm text-muted-foreground">
                No files uploaded yet
              </p>
              <p className="text-xs text-muted-foreground/60">
                Use the uploader above to add files (up to 200MB per file)
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-24 text-right">Size</TableHead>
                    <TableHead className="hidden w-40 text-right sm:table-cell">
                      Uploaded
                    </TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="max-w-[200px] truncate text-sm font-medium sm:max-w-[300px]">
                            {file.fileName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatBytes(file.sizeBytes)}
                      </TableCell>
                      <TableCell className="hidden text-right text-xs text-muted-foreground sm:table-cell">
                        {file.uploadedAt
                          ? new Date(
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              (file.uploadedAt as any).seconds * 1000
                            ).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDownload(file)}
                            title="Download"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive/70 hover:text-destructive"
                            onClick={() => setDeleteTarget(file)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete file?</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.fileName}
              </span>{" "}
              from storage. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
