"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Server,
  Database,
  Wifi,
  MapPin,
  Cpu,
  MemoryStick,
  Play,
  Square,
  Trash2,
} from "lucide-react";
import { useDashboard, type ResourceType, type ResourceStatus } from "./dashboard-provider";

function typeIcon(type: ResourceType) {
  const cls = "h-5 w-5";
  switch (type) {
    case "VM":
      return <Server className={cls} />;
    case "Database":
      return <Database className={cls} />;
    case "Network":
      return <Wifi className={cls} />;
  }
}

function statusColor(s: ResourceStatus) {
  switch (s) {
    case "running":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "stopped":
      return "bg-zinc-500/15 text-zinc-500 border-zinc-500/30";
    case "warning":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "error":
      return "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30";
  }
}

interface MetricRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  percent?: number;
  alert?: boolean;
}

function MetricRow({ icon, label, value, percent, alert }: MetricRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={`text-sm font-semibold tabular-nums ${
            alert ? "text-amber-500" : ""
          }`}
        >
          {value}
        </p>
      </div>
      {percent !== undefined && (
        <div className="w-20">
          <Progress value={percent} className="h-1.5" />
        </div>
      )}
    </div>
  );
}

export function ResourceDetailSheet() {
  const {
    selectedResource,
    setSelectedResource,
    toggleResourceStatus,
    deleteResource,
  } = useDashboard();
  const r = selectedResource;
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (!r) return;
    setIsToggling(true);
    await toggleResourceStatus(r.id, r.status);
    setIsToggling(false);
  };

  const handleDelete = async () => {
    if (!r) return;
    setIsDeleting(true);
    await deleteResource(r.id);
    setIsDeleting(false);
    setShowDelete(false);
    setSelectedResource(null);
  };

  return (
    <>
      <Sheet
        open={!!r}
        onOpenChange={(open) => !open && setSelectedResource(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {r && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {typeIcon(r.type)}
                  </div>
                  <div>
                    <SheetTitle className="text-base">{r.name}</SheetTitle>
                    <SheetDescription className="text-xs">
                      {r.type} · {r.id.slice(0, 8)}…
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-5">
                {/* Status & region */}
                <div className="flex items-center gap-3">
                  <Badge
                    className={`${statusColor(r.status)} border uppercase text-[10px] tracking-wider`}
                  >
                    {r.status}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {r.region}
                  </span>
                </div>

                <Separator />

                {/* Metrics */}
                <div className="space-y-2">
                  <MetricRow
                    icon={<Cpu className="h-4 w-4" />}
                    label="CPU Usage"
                    value={`${r.cpuUsage}%`}
                    percent={r.cpuUsage}
                    alert={r.cpuUsage > 85}
                  />
                  <MetricRow
                    icon={<MemoryStick className="h-4 w-4" />}
                    label="Memory Usage"
                    value={`${r.memoryUsage}%`}
                    percent={r.memoryUsage}
                    alert={r.memoryUsage > 85}
                  />
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Actions
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant={r.status === "running" ? "outline" : "default"}
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={handleToggle}
                      disabled={isToggling || r.status === "error"}
                    >
                      {r.status === "running" ? (
                        <>
                          <Square className="h-3.5 w-3.5" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          Start
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setShowDelete(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Meta */}
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Resource ID</span>
                    <span className="max-w-[180px] truncate font-mono text-foreground">
                      {r.id}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete resource?</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">{r?.name}</span>.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDelete(false)}
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
