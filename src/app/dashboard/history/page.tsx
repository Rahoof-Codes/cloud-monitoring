"use client";

// ---------------------------------------------------------------------------
// History Page — Audit Log, Breach History & Operational Event Ledger
// ---------------------------------------------------------------------------

import { useState, useMemo } from "react";
import {
  History as HistoryIcon,
  ShieldAlert,
  CheckCircle2,
  Server,
  Download,
  Search,
  Clock,
} from "lucide-react";
import { useDashboard } from "@/components/dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface AuditEvent {
  id: string;
  timestamp: Date;
  type: "threshold_breach" | "alarm_resolved" | "resource_state" | "threshold_change";
  title: string;
  resourceName?: string;
  severity: "critical" | "warning" | "info" | "success";
  details: string;
}

export default function HistoryPage() {
  const { alerts, resources } = useDashboard();
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Construct comprehensive audit events from alerts and system state
  const events: AuditEvent[] = useMemo(() => {
    const list: AuditEvent[] = [];

    // Add alert events
    alerts.forEach((alert) => {
      const eventTime = new Date(alert.timestampMs ?? Date.now());
      list.push({
        id: `alert-${alert.id}`,
        timestamp: eventTime,
        type: "threshold_breach",
        title: `Alarm Triggered: ${alert.reason}`,
        resourceName: alert.resourceName,
        severity: alert.severity === "critical" ? "critical" : "warning",
        details: `Telemetry recorded ${alert.value.toFixed(1)} ${alert.unit} against threshold ${alert.threshold} ${alert.unit}`,
      });

      if (alert.status === "resolved") {
        list.push({
          id: `resolved-${alert.id}`,
          timestamp: new Date(eventTime.getTime() + 1000 * 60 * 3),
          type: "alarm_resolved",
          title: `Alarm Resolved: ${alert.reason}`,
          resourceName: alert.resourceName,
          severity: "success",
          details: "Incident marked as resolved. Normal operating thresholds restored.",
        });
      }
    });

    // Add resource lifecycle events
    resources.forEach((r, idx) => {
      list.push({
        id: `res-${r.id}`,
        timestamp: new Date(Date.now() - 1000 * 60 * (idx * 45 + 15)),
        type: "resource_state",
        title: `Resource Status Check: ${r.name}`,
        resourceName: r.name,
        severity: r.status === "running" ? "info" : "warning",
        details: `Type: ${r.type} · Region: ${r.region} · Current Status: ${r.status}`,
      });
    });

    return list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [alerts, resources]);

  const filteredEvents = events.filter((ev) => {
    if (filterType !== "all" && ev.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        ev.title.toLowerCase().includes(q) ||
        (ev.resourceName && ev.resourceName.toLowerCase().includes(q)) ||
        ev.details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExport = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(filteredEvents, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `cloudwatch_audit_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Audit history exported as JSON");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Audit & Alarm History
            </h1>
            <Badge variant="outline" className="text-xs font-mono">
              {filteredEvents.length} Events Logged
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Chronological audit trail of metric anomalies, threshold breaches, state transitions, and operator remediations.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="h-8 gap-1.5 text-xs w-fit"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Audit Log</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by event title, resource name, or details…"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="w-full pl-9 pr-3 h-9 text-xs rounded-md border border-input bg-background text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Events" },
            { id: "threshold_breach", label: "Breaches" },
            { id: "alarm_resolved", label: "Resolutions" },
            { id: "resource_state", label: "Resource States" },
          ].map((item) => (
            <Button
              key={item.id}
              variant={filterType === item.id ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(item.id)}
              className="h-9 text-xs shrink-0"
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Event Timeline Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/40 text-muted-foreground bg-muted/20">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Timestamp</th>
                  <th className="px-4 py-2.5 font-medium">Severity</th>
                  <th className="px-4 py-2.5 font-medium">Event Title</th>
                  <th className="px-4 py-2.5 font-medium">Resource</th>
                  <th className="px-4 py-2.5 font-medium">Operational Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      No audit events match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-[11px]">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {ev.timestamp.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          variant={
                            ev.severity === "critical"
                              ? "destructive"
                              : ev.severity === "warning"
                              ? "outline"
                              : "secondary"
                          }
                          className={`text-[10px] uppercase font-mono ${
                            ev.severity === "warning"
                              ? "border-amber-500/40 text-amber-600 dark:text-amber-400"
                              : ev.severity === "success"
                              ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                              : ""
                          }`}
                        >
                          {ev.severity}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {ev.title}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {ev.resourceName ?? "Global Fleet"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {ev.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
