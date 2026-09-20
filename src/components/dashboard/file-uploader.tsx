"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, FileIcon, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDashboard } from "./dashboard-provider";
import { formatBytes } from "@/lib/cost";

export function FileUploader() {
  const { uploadFile, uploadProgress, requireAuth } = useDashboard();
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (!requireAuth()) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...droppedFiles]);
    }
  }, [requireAuth]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      setSelectedFiles((prev) => [...prev, ...files]);
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    },
    []
  );

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(async () => {
    if (!requireAuth()) return;
    if (selectedFiles.length === 0) return;
    setIsUploading(true);

    for (const file of selectedFiles) {
      try {
        await uploadFile(file);
      } catch {
        // Error toast already handled in useFiles
      }
    }

    setSelectedFiles([]);
    setIsUploading(false);
  }, [requireAuth, selectedFiles, uploadFile]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Upload className="h-4 w-4" />
          Upload Files
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!requireAuth()) return;
            inputRef.current?.click();
          }}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
            isDragOver
              ? "border-primary bg-primary/5 shadow-inner"
              : "border-border/60 hover:border-primary/40 hover:bg-muted/30"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <Upload
            className={`mx-auto h-8 w-8 transition-colors ${
              isDragOver ? "text-primary" : "text-muted-foreground/40"
            }`}
          />
          <p className="mt-3 text-sm font-medium">
            {isDragOver ? "Drop files here" : "Drag & drop files here"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            or click to browse · Supports files up to 200MB
          </p>
        </div>

        {/* Selected files preview */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""}{" "}
              selected
            </p>
            <div className="max-h-40 space-y-1.5 overflow-y-auto">
              {selectedFiles.map((file, i) => (
                <div
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2"
                >
                  <FileIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1 truncate text-xs font-medium">
                    {file.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatBytes(file.size)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                    className="text-muted-foreground/60 hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full"
              size="sm"
            >
              {isUploading ? "Uploading…" : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""}`}
            </Button>
          </div>
        )}

        {/* Upload progress */}
        {uploadProgress !== null && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Uploading…</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
