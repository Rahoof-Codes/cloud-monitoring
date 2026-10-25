"use client";

// ---------------------------------------------------------------------------
// Cloud AI Copilot — Dedicated Full-Screen DevOps & Diagnostics Studio
// ---------------------------------------------------------------------------

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  AlertTriangle,
  Bot,
  User as UserIcon,
  Copy,
  Check,
  RotateCcw,
  Square,
  ShieldCheck,
  Cpu,
  Receipt,
  Download,
  Trash2,
  HardDrive,
  Activity,
  Layers,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { useDashboard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { calculateMonthlyBill } from "@/lib/billing";
import { formatBytes } from "@/lib/cost";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

// ── Glowing Blinking Cursor ────────────────────────────────────────────────
function Cursor() {
  return (
    <span
      className="inline-block w-1.5 h-3.5 ml-1 bg-blue-500 rounded-[1px] animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.85)] align-middle"
      aria-hidden="true"
    />
  );
}

// ── Markdown Formatter ─────────────────────────────────────────────────────
function formatInline(text: string): React.ReactNode[] {
  let normalized = text;
  const boldCount = (normalized.match(/\*\*/g) || []).length;
  if (boldCount % 2 !== 0) normalized += "**";
  const backtickCount = (normalized.match(/`/g) || []).length;
  if (backtickCount % 2 !== 0) normalized += "`";

  const parts = normalized.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={i}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-blue-500 dark:text-blue-400 border border-border/40"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function FormattedContent({ text, isStreaming }: { text: string; isStreaming?: boolean }) {
  if (!text && isStreaming) {
    return (
      <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
        <span className="italic">Analyzing telemetry & formulating diagnostic report…</span>
        <Cursor />
      </div>
    );
  }

  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      nodes.push(
        <ul key={`ul-${nodes.length}`} className="my-1.5 list-disc space-y-1 pl-4 text-xs">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {formatInline(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("### ")) {
      flushList();
      nodes.push(
        <h4 key={`h4-${idx}`} className="mt-3 mb-1 text-xs font-bold text-foreground">
          {formatInline(trimmed.slice(4))}
        </h4>
      );
    } else if (trimmed.startsWith("## ")) {
      flushList();
      nodes.push(
        <h3 key={`h3-${idx}`} className="mt-3.5 mb-1.5 text-sm font-bold text-foreground">
          {formatInline(trimmed.slice(3))}
        </h3>
      );
    } else if (trimmed.startsWith("# ")) {
      flushList();
      nodes.push(
        <h2 key={`h2-${idx}`} className="mt-4 mb-2 text-base font-bold text-foreground">
          {formatInline(trimmed.slice(2))}
        </h2>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      listItems.push(trimmed.slice(2));
    } else if (trimmed.match(/^\d+\.\s/)) {
      flushList();
      const numMatch = trimmed.match(/^(\d+)\.\s(.*)$/);
      if (numMatch) {
        nodes.push(
          <div key={`ol-${idx}`} className="my-1 flex items-start gap-2 text-xs">
            <span className="font-semibold text-blue-500">{numMatch[1]}.</span>
            <span className="leading-relaxed">{formatInline(numMatch[2])}</span>
          </div>
        );
      }
    } else if (trimmed === "") {
      flushList();
    } else {
      flushList();
      nodes.push(
        <p key={`p-${idx}`} className="my-1 text-xs leading-relaxed text-foreground/90">
          {formatInline(line)}
        </p>
      );
    }
  });

  flushList();

  return (
    <div className="space-y-1">
      {nodes}
      {isStreaming && <Cursor />}
    </div>
  );
}

export default function AiCopilotPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  const {
    resources,
    alerts,
    thresholds,
    monitoringConfig,
    usageRecords,
    totalStorageUsedBytes,
    files,
    pendingAiPrompt,
    clearPendingAiPrompt,
  } = useDashboard();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-greeting",
      role: "assistant",
      content: `👋 Hello! I am your **CloudWatch Pro AI Copilot**. I continuously monitor your infrastructure telemetry, detect threshold breaches, and recommend DevOps remediation steps.\n\n### Current Fleet Snapshot\n- **Monitored Resources:** ${resources.length} (${resources.filter((r) => r.status === "running").length} running)\n- **Active Alarms:** ${alerts.filter((a) => a.status === "active").length}\n- **Telemetry Provider:** ${monitoringConfig.provider} (${monitoringConfig.intervalSeconds}s interval)\n\nSelect a diagnostic prompt below or ask any question about your cloud resources!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load pending AI prompt from other pages (e.g. from "Remediate with AI" on Alerts page)
  useEffect(() => {
    if (pendingAiPrompt) {
      handleSend(pendingAiPrompt);
      clearPendingAiPrompt();
    }
  }, [pendingAiPrompt]);

  // Telemetry Snapshot for Context Injection
  const buildTelemetryContext = useCallback(() => {
    const running = resources.filter((r) => r.status === "running");
    const stopped = resources.filter((r) => r.status === "stopped");
    const activeAlerts = alerts.filter((a) => a.status === "active");
    const bill = calculateMonthlyBill(usageRecords, totalStorageUsedBytes);

    return {
      runningCount: running.length,
      stoppedCount: stopped.length,
      abnormalCount: activeAlerts.length,
      totalCost: bill.totalCost,
      computeCost: bill.computeCost,
      storageCost: bill.storageCost,
      storageUsed: formatBytes(totalStorageUsedBytes),
      fileCount: files.length,
      provider: monitoringConfig.provider,
      intervalSeconds: monitoringConfig.intervalSeconds,
      resourcesList: resources.map((r) => ({
        name: r.name,
        type: r.type,
        status: r.status,
        region: r.region,
        cpu: r.cpuUsage,
        storage: r.storageUsage,
        network: r.networkTraffic,
        requests: r.requestCount,
      })),
      abnormalAlerts: activeAlerts.map((a) => ({
        name: a.resourceName,
        type: a.resourceType,
        metric: a.metric,
        value: a.value,
        threshold: a.threshold,
        unit: a.unit,
        severity: a.severity,
        reason: a.reason,
      })),
    };
  }, [resources, alerts, usageRecords, totalStorageUsedBytes, files, monitoringConfig]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || isLoading) return;

    setInput("");
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const assistantMsgId = `a-${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    setIsLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const telemetryContext = buildTelemetryContext();

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          telemetry: telemetryContext,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No readable stream");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulated += parsed.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: accumulated, isStreaming: true }
                      : m
                  )
                );
              }
            } catch {
              // Ignore non-json lines
            }
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, content: accumulated, isStreaming: false } : m
        )
      );
    } catch (err: any) {
      if (err.name === "AbortError") {
        toast.info("AI generation stopped");
      } else {
        console.error("AI Error:", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content:
                    "⚠️ Failed to reach AI inference service. Please check API connection in Settings.",
                  isStreaming: false,
                }
              : m
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: "initial-greeting",
        role: "assistant",
        content: "Chat session cleared. How can I assist with your cloud infrastructure today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    toast.info("Conversation reset");
  };

  const handleExport = () => {
    const markdown = messages
      .map(
        (m) =>
          `### ${m.role === "user" ? "👤 Operator" : "🤖 CloudWatch AI"} (${m.timestamp})\n\n${m.content}\n\n---\n`
      )
      .join("\n");
    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(markdown);
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `cloudwatch_ai_session_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success("Conversation exported as Markdown");
  };

  // Quick prompt suggestions
  const PROMPT_SUGGESTIONS = [
    {
      title: "Active Alarms Audit",
      prompt: "Analyze all currently active alarms, identify the affected resources and root cause, and give step-by-step remediation commands.",
      icon: AlertTriangle,
    },
    {
      title: "FinOps Cost Optimization",
      prompt: "Audit our current cloud resource costs, hourly run-rates, and storage allocations. Suggest specific actions to lower our monthly bill.",
      icon: Receipt,
    },
    {
      title: "IAM & API Key Health Check",
      prompt: "Review our resource API credentials, IAM permission scopes, and recommend a key rotation and encryption posture plan.",
      icon: ShieldCheck,
    },
    {
      title: "Resource Sizing & Scaling",
      prompt: "Evaluate telemetry across all instances and tell me which ones are over-provisioned or under-provisioned based on CPU, RAM, and Disk usage.",
      icon: Cpu,
    },
  ];

  const activeAlerts = alerts.filter((a) => a.status === "active");
  const runningResources = resources.filter((r) => r.status === "running");

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-500" />
              Cloud AI Copilot & Automated Diagnostics
            </h1>
            <Badge variant="outline" className="text-xs font-mono">
              Meta Llama 3.2 11B Vision
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time infrastructure intelligence, threshold anomaly diagnostics, FinOps cost optimization, and IAM security auditing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-8 gap-1.5 text-xs"
            title="Export chat as Markdown"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="h-8 gap-1.5 text-xs text-rose-500 hover:text-rose-600"
            title="Clear chat history"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear</span>
          </Button>
        </div>
      </div>

      {/* Main Studio Grid: Left Sidebar Telemetry Status + Right Chat View */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left Column: Live Context & Fast Diagnostic Prompts */}
        <div className="lg:col-span-1 space-y-4">
          {/* Live System Context Card */}
          <Card className="shadow-sm border-border/70">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs font-semibold tracking-tight uppercase text-muted-foreground flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-blue-500" />
                Live Injected Context
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Active Alarms:</span>
                <Badge
                  variant={activeAlerts.length > 0 ? "destructive" : "outline"}
                  className="text-[10px]"
                >
                  {activeAlerts.length}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Running Fleet:</span>
                <span className="font-semibold text-foreground">
                  {runningResources.length} / {resources.length}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Telemetry Source:</span>
                <span className="font-mono text-[11px] text-foreground">
                  {monitoringConfig.provider}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Sampling Rate:</span>
                <span className="font-mono text-[11px] text-foreground">
                  {monitoringConfig.intervalSeconds}s
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Storage:</span>
                <span className="font-mono text-[11px] text-foreground">
                  {formatBytes(totalStorageUsedBytes)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Action Presets */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Diagnostic Runbooks
            </p>
            {PROMPT_SUGGESTIONS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSend(item.prompt)}
                  className="w-full text-left p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/50 hover:border-blue-500/50 transition-all shadow-xs group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-3.5 w-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-foreground group-hover:text-blue-500 transition-colors">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.prompt}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Chat Stream Studio */}
        <div className="lg:col-span-3 flex flex-col rounded-xl border border-border/70 bg-card shadow-sm h-[650px] overflow-hidden">
          {/* Studio Header */}
          <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5 bg-muted/20">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-white shadow-xs">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-semibold text-foreground">
                DevOps Copilot Session
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Telemetry Stream Active
              </span>
            </div>

            {isLoading && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStop}
                className="h-7 text-xs gap-1.5 border-rose-500/40 text-rose-500 hover:bg-rose-500/10"
              >
                <Square className="h-3 w-3 fill-current" />
                <span>Stop</span>
              </Button>
            )}
          </div>

          {/* Conversation Scroll Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold shrink-0 ${
                      isUser
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-800 text-blue-400 border border-border/60"
                    }`}
                  >
                    {isUser ? <UserIcon className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`group relative max-w-[85%] rounded-xl px-4 py-3 text-xs shadow-xs ${
                      isUser
                        ? "bg-blue-600 text-white"
                        : "bg-muted/40 border border-border/60 text-foreground"
                    }`}
                  >
                    <FormattedContent text={m.content} isStreaming={m.isStreaming} />

                    <div className="mt-1.5 flex items-center justify-between text-[10px] opacity-70">
                      <span>{m.timestamp}</span>
                      {!isUser && !m.isStreaming && (
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(m.id, m.content)}
                          className="opacity-0 group-hover:opacity-100 hover:text-blue-500 transition-opacity ml-2"
                          title="Copy markdown"
                        >
                          {copiedId === m.id ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="border-t border-border/40 p-3 bg-muted/10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about active alarms, threshold optimization, API keys, or cost right-sizing…"
                disabled={isLoading}
                className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-input bg-background text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium gap-1.5 shadow-xs"
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Send</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
