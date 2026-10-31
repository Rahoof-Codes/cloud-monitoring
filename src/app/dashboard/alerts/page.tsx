"use client";

// ---------------------------------------------------------------------------
// Alerts Page — Incident Center, Active Alarms & Controlled Demonstration Suite
// ---------------------------------------------------------------------------

import { useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Zap,
  HardDrive,
  Wifi,
  Activity,
  RotateCcw,
  Sparkles,
  Clock,
  Check,
} from "lucide-react";
import { useDashboard } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function AlertsPage() {
  const {
    alerts,
    acknowledgeAlert,
    resolveAlert,
    simulateStressTest,
    openAiWithPrompt,
    isDemoMode,
  } = useDashboard();

  const [activeTab, setActiveTab] = useState<"all" | "active" | "resolved">("active");
  const [isSimulating, setIsSimulating] = useState(false);

  const activeAlerts = alerts.filter((a) => a.status === "active");
  const acknowledgedAlerts = alerts.filter((a) => a.status === "acknowledged");
  const resolvedAlerts = alerts.filter((a) => a.status === "resolved");

  const criticalCount = activeAlerts.filter((a) => a.severity === "critical").length;
  const warningCount = activeAlerts.filter((a) => a.severity === "warning").length;

  const handleTriggerTest = async (
    type: "cpu" | "storage" | "network" | "requests" | "reset",
    label: string
  ) => {
    setIsSimulating(true);
    try {
      await simulateStressTest(type);
      if (type === "reset") {
        toast.success("Reset Complete", {
          description: "All instances restored to healthy baseline metrics.",
        });
      } else {
        toast.warning(`Controlled Test Triggered: ${label}`, {
          description: "Usage thresholds exceeded. Anomaly detection engine logged an incident.",
        });
      }
    } finally {
      setIsSimulating(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (activeTab === "active") return a.status === "active" || a.status === "acknowledged";
    if (activeTab === "resolved") return a.status === "resolved";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Alerts & Incidents Center
          </h1>
          <Badge
            variant={activeAlerts.length > 0 ? "destructive" : "outline"}
            className="text-xs"
          >
            {activeAlerts.length} Active Alarm{activeAlerts.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Real-time incident response, active threshold breach triage, and controlled alarm demonstration suite.
        </p>
      </div>

      {/* 4 Stat Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-rose-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Active Alarms
              </span>
              <ShieldAlert className="h-4 w-4 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">
              {activeAlerts.length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Requires engineer triage
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-600 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Critical Severity
              </span>
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
              {criticalCount}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Immediate attention
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Warning Severity
              </span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {warningCount}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Approaching threshold
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Resolved Incidents
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">
              {resolvedAlerts.length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Remediated this session
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Controlled Test Demonstration Suite (Demo Mode Only) ── */}
      {isDemoMode && (
        <Card className="border-rose-500/30 bg-gradient-to-r from-rose-500/5 via-card to-amber-500/5 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-500/20 text-rose-500">
                    <Zap className="h-3.5 w-3.5" />
                  </div>
                  <CardTitle className="text-sm font-semibold tracking-tight">
                    Controlled Test Demonstration Suite
                  </CardTitle>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Simulate synthetic load to demonstrate real-time threshold breaches, alert dispatching, and AI remediation.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] w-fit font-mono">
                Demo Test Harness
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isSimulating}
                onClick={() => handleTriggerTest("cpu", "CPU Spike (95%)")}
                className="h-9 justify-start text-xs border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 gap-2"
              >
                <Zap className="h-3.5 w-3.5 shrink-0" />
                <span>CPU Spike (95%)</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={isSimulating}
                onClick={() => handleTriggerTest("storage", "Storage Warning (94%)")}
                className="h-9 justify-start text-xs border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 gap-2"
              >
                <HardDrive className="h-3.5 w-3.5 shrink-0" />
                <span>Storage Warning (94%)</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={isSimulating}
                onClick={() => handleTriggerTest("network", "Network Surge (88 MB/s)")}
                className="h-9 justify-start text-xs border-sky-500/40 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 gap-2"
              >
                <Wifi className="h-3.5 w-3.5 shrink-0" />
                <span>Network Surge (88 MB/s)</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={isSimulating}
                onClick={() => handleTriggerTest("requests", "Traffic Flood (2,450 req/s)")}
                className="h-9 justify-start text-xs border-purple-500/40 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 gap-2"
              >
                <Activity className="h-3.5 w-3.5 shrink-0" />
                <span>Traffic Flood (2.4k req/s)</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                disabled={isSimulating}
                onClick={() => handleTriggerTest("reset", "Healthy Baseline")}
                className="h-9 justify-start text-xs gap-2 font-medium"
              >
                <RotateCcw className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>Reset Healthy Baseline</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Active Alarms & Incident Triage ── */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as any)}
        className="space-y-4"
      >
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <TabsList className="h-9 bg-muted/60 p-1">
            <TabsTrigger value="active" className="text-xs gap-1.5">
              <AlertTriangle className="h-3 w-3" />
              Active Alarms ({activeAlerts.length + acknowledgedAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs gap-1.5">
              <CheckCircle2 className="h-3 w-3" />
              Resolved Archive ({resolvedAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">
              All Events ({alerts.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="space-y-3 pt-1">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-border/60 bg-card p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                All Systems Nominal
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {isDemoMode
                  ? "No active threshold breach alarms detected. Use the Controlled Test suite above to trigger a test incident."
                  : "No active threshold breach alarms detected across your connected cloud infrastructure."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => {
                const isCritical = alert.severity === "critical";
                const isResolved = alert.status === "resolved";
                const isAck = alert.status === "acknowledged";

                return (
                  <div
                    key={alert.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4 transition-colors ${
                      isResolved
                        ? "border-border/60 bg-muted/20 opacity-75"
                        : isCritical
                        ? "border-rose-500/40 bg-rose-500/5"
                        : "border-amber-500/40 bg-amber-500/5"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-md ${
                          isResolved
                            ? "bg-muted text-muted-foreground"
                            : isCritical
                            ? "bg-rose-500/15 text-rose-500"
                            : "bg-amber-500/15 text-amber-500"
                        }`}
                      >
                        {isResolved ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {alert.reason}
                          </span>
                          <Badge
                            variant={
                              isResolved
                                ? "outline"
                                : isCritical
                                ? "destructive"
                                : "outline"
                            }
                            className={`text-[10px] uppercase font-mono ${
                              !isResolved && !isCritical
                                ? "border-amber-500/40 text-amber-600 dark:text-amber-400"
                                : ""
                            }`}
                          >
                            {alert.severity}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {alert.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {alert.resourceName && (
                            <span>
                              Resource: <strong>{alert.resourceName}</strong>
                            </span>
                          )}
                          <span>
                            Trigger Value:{" "}
                            <strong>
                              {alert.value.toFixed(1)} {alert.unit}
                            </strong>{" "}
                            (Limit: {alert.threshold} {alert.unit})
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="h-3 w-3" />
                            {alert.time}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Incident Actions */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                      {/* Remediate with AI Button */}
                      {!isResolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openAiWithPrompt(
                              `Investigate active alert on ${alert.resourceName ?? "cloud fleet"}: ${alert.reason}. Current value is ${alert.value.toFixed(1)} ${alert.unit} vs threshold ${alert.threshold} ${alert.unit}. Suggest immediate remediation steps and cost impact.`
                            )
                          }
                          className="h-8 gap-1.5 text-xs text-purple-600 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Remediate with AI</span>
                        </Button>
                      )}

                      {!isResolved && !isAck && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            acknowledgeAlert(alert.id);
                            toast.info("Incident acknowledged");
                          }}
                          className="h-8 text-xs"
                        >
                          Acknowledge
                        </Button>
                      )}

                      {!isResolved && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            resolveAlert(alert.id);
                            toast.success("Incident resolved and archived");
                          }}
                          className="h-8 text-xs font-medium"
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
