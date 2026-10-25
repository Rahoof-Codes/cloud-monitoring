"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  HelpCircle,
  AlertTriangle,
  Sliders,
  ShieldCheck,
  Bot,
  X,
  RefreshCw,
  Cpu,
  Square,
  Copy,
  Check,
  ChevronDown,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "./dashboard-provider";
import { formatBytes } from "@/lib/cost";
import { calculateMonthlyBill } from "@/lib/billing";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

// ── Glowing Blinking Cursor Component ─────────────────────────────────────

function Cursor() {
  return (
    <span
      className="inline-block w-1.5 h-3.5 ml-1 bg-emerald-500 rounded-[1px] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.85)] align-middle"
      aria-hidden="true"
    />
  );
}

// ── Markdown Formatter Component ──────────────────────────────────────────

function formatInline(text: string): React.ReactNode[] {
  let normalized = text;
  // If streaming and there is an unclosed **, close it virtually so raw asterisks don't flicker
  const boldCount = (normalized.match(/\*\*/g) || []).length;
  if (boldCount % 2 !== 0) {
    normalized += "**";
  }
  const backtickCount = (normalized.match(/`/g) || []).length;
  if (backtickCount % 2 !== 0) {
    normalized += "`";
  }

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
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 border border-border/40"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function FormattedContent({
  text,
  isStreaming,
}: {
  text: string;
  isStreaming?: boolean;
}) {
  if (!text && isStreaming) {
    return (
      <div className="flex items-center gap-2 py-0.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
        <span className="italic">Analyzing telemetry & formulating response…</span>
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
        <ul
          key={`ul-${nodes.length}`}
          className="my-1.5 list-disc space-y-1 pl-4 text-xs"
        >
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

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    if (line.startsWith("### ")) {
      flushList();
      nodes.push(
        <h4
          key={idx}
          className="mt-2.5 mb-1 text-xs font-bold text-foreground first:mt-0"
        >
          {formatInline(line.slice(4))}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      nodes.push(
        <h3
          key={idx}
          className="mt-3 mb-1 text-sm font-bold text-foreground first:mt-0"
        >
          {formatInline(line.slice(3))}
        </h3>
      );
    } else if (line === "---" || line === "***") {
      flushList();
      nodes.push(<hr key={idx} className="my-2 border-border/60" />);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      listItems.push(line.slice(2));
    } else if (/^\d+\.\s/.test(line)) {
      flushList();
      const match = line.match(/^(\d+)\.\s(.*)$/);
      nodes.push(
        <div key={idx} className="my-1 flex items-start gap-1.5 pl-0.5 text-xs">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {match?.[1]}.
          </span>
          <span className="leading-relaxed">{formatInline(match?.[2] || "")}</span>
        </div>
      );
    } else {
      flushList();
      nodes.push(
        <p key={idx} className="my-1 text-xs leading-relaxed">
          {formatInline(line)}
        </p>
      );
    }
  });

  flushList();

  return (
    <div className="space-y-0.5">
      {nodes}
      {isStreaming && <Cursor />}
    </div>
  );
}

// ── Main AskAIWidget Component ───────────────────────────────────────────

export function AskAIWidget() {
  const {
    resources,
    abnormal,
    alerts,
    totalStorageUsedBytes,
    files,
    user,
    usageRecords,
    clockTick,
    requireAuth,
    isAiOpen,
    setIsAiOpen,
    pendingAiPrompt,
    clearPendingAiPrompt,
  } = useDashboard();

  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);

  // Refs for streaming & typewriter effect
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const typewriterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const targetFullTextRef = useRef<string>("");
  const revealedLengthRef = useRef<number>(0);
  const activeAssistantIdRef = useRef<string | null>(null);
  const isStreamCompleteRef = useRef<boolean>(false);

  const runningResources = resources.filter((r) => r.status === "running");
  const bill = calculateMonthlyBill(usageRecords, totalStorageUsedBytes, new Date(clockTick));
  const monthlyCost = bill.totalCost;
  const storageCost = bill.storageCost;
  const computeCost = bill.computeCost;

  const getSystemSnapshot = () => ({
    user: {
      displayName: user.displayName || "Cloud User",
      email: user.email,
      phoneNumber: user.phoneNumber || "Not linked",
    },
    summary: {
      totalResources: resources.length,
      runningResources: runningResources.length,
      stoppedResources: resources.filter((r) => r.status === "stopped").length,
      abnormalCount: abnormal.length,
      totalStorageUsed: formatBytes(totalStorageUsedBytes),
      totalFilesCount: files.length,
      estimatedMonthlyCost: `₹${monthlyCost.toFixed(2)}`,
      storageCost: `₹${storageCost.toFixed(2)}`,
      computeCost: `₹${computeCost.toFixed(2)}`,
    },
    resources: resources.map((r) => ({
      name: r.name,
      type: r.type,
      status: r.status,
      region: r.region,
      cpuPercent: `${r.cpuUsage}%`,
      memoryPercent: `${r.memoryUsage}%`,
      storagePercent: `${r.storageUsage ?? 35}%`,
      networkBandwidth: `${r.networkTraffic ?? 10} MB/s`,
      requestRate: `${r.requestCount ?? 120} req/s`,
      isAbnormal: r.cpuUsage > 80,
    })),
    abnormalAlerts: alerts.map((a) => ({
      name: a.resourceName,
      type: a.resourceType,
      metric: a.metric,
      value: `${a.value}${a.unit || "%"}`,
      reason: a.reason,
      region: "",
    })),
  });

  // Handle user scroll detection
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isUp = scrollHeight - (scrollTop + clientHeight) > 65;
    setUserHasScrolledUp(isUp);
  };

  const scrollToBottom = (smooth = true) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  // Start smooth word-by-word typewriter loop
  const startTypewriterLoop = useCallback(() => {
    if (typewriterTimerRef.current) {
      clearInterval(typewriterTimerRef.current);
    }

    typewriterTimerRef.current = setInterval(() => {
      const target = targetFullTextRef.current;
      let currLen = revealedLengthRef.current;
      const assistantId = activeAssistantIdRef.current;

      if (!assistantId) return;

      if (currLen < target.length) {
        const remaining = target.slice(currLen);
        const backlog = target.length - currLen;
        let nextChunk = "";

        // Adaptive word-reveal speed:
        // - Standard: 1 word per tick (natural conversational speed)
        // - Medium backlog: 2 words per tick
        // - Large backlog: 3-4 words per tick to prevent lagging behind the model
        if (backlog > 140) {
          const match = remaining.match(/^(\S+\s*){1,4}/);
          nextChunk = match ? match[0] : remaining.slice(0, 30);
        } else if (backlog > 50) {
          const match = remaining.match(/^(\S+\s*){1,2}/);
          nextChunk = match ? match[0] : remaining.slice(0, 15);
        } else {
          const match = remaining.match(/^(\S+\s*|\s+)/);
          nextChunk = match ? match[0] : remaining.slice(0, 1);
        }

        currLen += nextChunk.length;
        revealedLengthRef.current = currLen;
        const newRevealedText = target.slice(0, currLen);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: newRevealedText, isStreaming: true }
              : m
          )
        );

        // Auto-scroll if user hasn't explicitly scrolled up
        if (!userHasScrolledUp && scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      } else if (isStreamCompleteRef.current) {
        // Stream completed and all pending words have been revealed
        if (typewriterTimerRef.current) {
          clearInterval(typewriterTimerRef.current);
          typewriterTimerRef.current = null;
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: target, isStreaming: false }
              : m
          )
        );
        setLoading(false);
        activeAssistantIdRef.current = null;
      }
    }, 18); // ~55 words/sec fluid typewriter cadence
  }, [userHasScrolledUp]);

  // Handle pending AI prompt from outside triggers
  useEffect(() => {
    if (pendingAiPrompt) {
      executeAIQuery(pendingAiPrompt);
      clearPendingAiPrompt();
    }
  }, [pendingAiPrompt]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (typewriterTimerRef.current) {
        clearInterval(typewriterTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Stop Generation Handler
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (typewriterTimerRef.current) {
      clearInterval(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }

    const assistantId = activeAssistantIdRef.current;
    if (assistantId) {
      const finalContent =
        targetFullTextRef.current || "*(Response generation stopped)*";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: finalContent, isStreaming: false }
            : m
        )
      );
    }

    setLoading(false);
    activeAssistantIdRef.current = null;
    toast.info("AI response generation stopped");
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("AI response copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    if (loading) {
      handleStopGenerating();
    }
    setMessages([]);
  };

  const executeAIQuery = async (queryText: string) => {
    if (!queryText.trim() || loading) return;
    if (!requireAuth()) return;

    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsgId = "user-" + Date.now();
    const assistantMsgId = "asst-" + Date.now();

    const userMsg: Message = {
      id: userMsgId,
      role: "user",
      content: queryText,
      timestamp: time,
    };

    const assistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: time,
      isStreaming: true,
    };

    const nextMessages = [...messages, userMsg, assistantMsg];
    setMessages(nextMessages);
    setInputQuery("");
    setLoading(true);
    setUserHasScrolledUp(false);

    targetFullTextRef.current = "";
    revealedLengthRef.current = 0;
    activeAssistantIdRef.current = assistantMsgId;
    isStreamCompleteRef.current = false;

    // Start progressive word-by-word reveal loop
    startTypewriterLoop();

    // Scroll to bottom immediately
    setTimeout(() => scrollToBottom(true), 50);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Get the user's Firebase ID token for server-side verification
      const { getAuth } = await import("firebase/auth");
      const idToken = await getAuth().currentUser?.getIdToken();
      const authHeader = idToken ? `Bearer ${idToken}` : "Bearer demo-token";
      const systemSnapshot = getSystemSnapshot();

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          prompt: queryText,
          history: messages
            .filter((m) => !m.content.includes("Unable to complete") && m.content.trim())
            .map((m) => ({
              role: m.role,
              content: m.content,
            })),
          systemContext: systemSnapshot,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errMessage = `AI service error (${res.status})`;
        try {
          const errData = await res.json();
          if (errData.error) errMessage = errData.error;
        } catch { }
        throw new Error(errMessage);
      }

      if (!res.body) {
        throw new Error("No response body received from AI service");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;

          if (trimmed === "data: [DONE]") {
            isStreamCompleteRef.current = true;
            break;
          }

          if (trimmed.startsWith("data: ")) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.error) {
                throw new Error(data.error);
              }
              if (data.text) {
                targetFullTextRef.current += data.text;
              }
            } catch (err: unknown) {
              if (
                err instanceof Error &&
                err.message !== "Stream encountered an error"
              ) {
                // Ignore transient JSON parse errors on partial SSE frames
              } else if (err instanceof Error) {
                throw err;
              }
            }
          }
        }
      }

      // Mark upstream SSE completion
      isStreamCompleteRef.current = true;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        // User intentionally cancelled stream
        return;
      }

      console.error("AI Assistant streaming failed:", err);
      toast.error(
        err instanceof Error ? err.message : "AI request failed"
      );

      if (typewriterTimerRef.current) {
        clearInterval(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
              ...m,
              content:
                targetFullTextRef.current ||
                `⚠️ **Unable to complete telemetry analysis.**\n\nPlease check network connectivity or try again in a moment.`,
              isStreaming: false,
            }
            : m
        )
      );
      setLoading(false);
      activeAssistantIdRef.current = null;
    }
  };

  const quickPrompts = [
    {
      label: "Explain System",
      icon: HelpCircle,
      prompt:
        "Explain how this cloud resource monitoring system functions, how it tracks live metrics, and how it helps DevOps teams monitor cloud health.",
    },
    {
      label: "Audit Anomalies",
      icon: AlertTriangle,
      prompt:
        "Analyze my currently running cloud resources, identify high CPU/memory anomalies, and tell me what actions I should take immediately.",
    },
    {
      label: "Optimize Resources",
      icon: Sliders,
      prompt:
        "Analyze my resource allocation and recommend ways to optimize cloud utilization, performance, and efficiency.",
    },
    {
      label: "Security Review",
      icon: ShieldCheck,
      prompt:
        "Review my infrastructure configuration, regional redundancy, and authentication isolation.",
    },
  ];

  return (
    <>
      {/* Round Floating Action Button in Bottom-Right (marked in user's image) */}
      <button
        onClick={() => setIsAiOpen(!isAiOpen)}
        aria-label="Ask AI"
        className="fixed bottom-[74px] right-4 md:bottom-6 md:right-6 z-40 flex h-12 w-12 md:w-auto md:h-auto md:px-5 md:py-3.5 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl shadow-emerald-950/30 transition-all hover:scale-105 active:scale-95 border-2 border-background/60"
      >
        <Sparkles className="h-5 w-5 text-amber-300 animate-pulse md:mr-2" />
        <span className="hidden md:inline text-sm font-semibold">Ask AI</span>
        {abnormal.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
        )}
      </button>

      {/* Floating Chat Window - sleek, curved, non-boxy floating assistant */}
      {isAiOpen && (
        <div
          className={`fixed z-50 flex flex-col overflow-hidden rounded-[28px] border border-border/70 dark:border-white/10 bg-background/90 dark:bg-zinc-950/90 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.7),0_0_40px_rgba(16,185,129,0.12)] backdrop-blur-2xl ring-1 ring-white/5 transition-all duration-200 w-[calc(100vw-24px)] max-w-[360px] h-[480px] max-h-[72vh] bottom-[76px] right-3 sm:max-w-[calc(100vw-48px)] ${
            isDesktopExpanded
              ? "sm:bottom-6 sm:right-6 md:right-8 sm:w-[760px] md:w-[860px] lg:w-[960px] sm:h-[calc(100vh-100px)] sm:max-h-[860px]"
              : "sm:bottom-20 sm:right-6 md:right-8 sm:w-[580px] md:w-[640px] lg:w-[700px] sm:h-[660px] md:h-[700px] lg:h-[740px] sm:max-h-[calc(100vh-140px)]"
          }`}
        >
          {/* Top ambient glow accent bar */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-500/70 to-transparent shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 bg-muted/20 px-3.5 py-2.5 sm:px-4 sm:py-3 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white shadow-md shadow-emerald-500/25 shrink-0">
                <Cpu className="h-4 w-4" />
                {loading && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold tracking-tight truncate">
                    Cloud AI
                  </h3>
                  <Badge className="bg-emerald-500/15 text-[9px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-1.5 py-0 font-semibold rounded-full">
                    {loading ? "Stream" : "Live"}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
                  {runningResources.length} running · Sync
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  title="Clear chat"
                  className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsDesktopExpanded(!isDesktopExpanded)}
                title={isDesktopExpanded ? "Standard width" : "Expanded width"}
                className="hidden sm:inline-flex rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              >
                {isDesktopExpanded ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                onClick={() => setIsAiOpen(false)}
                title="Close"
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="relative flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 text-xs"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-4 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2.5 shadow-sm border border-emerald-500/20">
                  <Bot className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-semibold">How can I assist you?</h4>
                <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground max-w-[260px] sm:max-w-[360px] leading-relaxed">
                  Real-time telemetry, anomaly analysis & cost guidance.
                </p>

                {/* Quick Prompts */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                  {quickPrompts.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => executeAIQuery(q.prompt)}
                      disabled={loading}
                      className="group flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/20 p-2.5 text-left text-[11px] font-medium transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-foreground disabled:opacity-50"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                        <q.icon className="h-3 w-3" />
                      </div>
                      <span className="whitespace-normal leading-tight">{q.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`group flex flex-col ${
                      m.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-muted-foreground/70">
                      <span className="font-medium">
                        {m.role === "user" ? "You" : "Cloud AI Advisor"}
                      </span>
                      <span>· {m.timestamp}</span>
                      {m.isStreaming && (
                        <span className="inline-flex items-center gap-1 text-[9px] text-emerald-500 font-semibold uppercase tracking-wider">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Streaming
                        </span>
                      )}
                      {m.role === "assistant" && !m.isStreaming && m.content && (
                        <button
                          onClick={() => copyToClipboard(m.content, m.id)}
                          title="Copy response"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-muted-foreground hover:text-foreground"
                        >
                          {copiedId === m.id ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                    <div
                      className={`relative text-xs leading-relaxed max-w-[92%] sm:max-w-[85%] transition-all ${
                        m.role === "user"
                          ? "bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md shadow-emerald-950/20 rounded-[20px] rounded-br-[4px] px-4 py-2.5 font-medium border border-emerald-400/20"
                          : "border border-border/60 bg-muted/30 dark:bg-zinc-900/70 text-foreground backdrop-blur-md rounded-[20px] rounded-bl-[4px] px-4 py-3 shadow-xs"
                      }`}
                    >
                      {m.role === "user" ? (
                        m.content
                      ) : (
                        <FormattedContent
                          text={m.content}
                          isStreaming={m.isStreaming}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Jump to bottom button when user scrolled up */}
            {userHasScrolledUp && (
              <button
                onClick={() => {
                  setUserHasScrolledUp(false);
                  scrollToBottom(true);
                }}
                className="sticky bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full border border-border/80 bg-background/95 px-3 py-1 text-[11px] font-medium text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-muted"
              >
                <ChevronDown className="h-3.5 w-3.5 text-emerald-500" />
                <span>Jump to latest</span>
              </button>
            )}
          </div>

          {/* Quick Prompts Bar if chat already has messages */}
          {messages.length > 0 && !loading && (
            <div className="flex items-center gap-1.5 overflow-x-auto px-3.5 py-2 border-t border-border/40 bg-muted/10 no-scrollbar">
              {quickPrompts.slice(0, 3).map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => executeAIQuery(q.prompt)}
                  className="shrink-0 flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 dark:bg-zinc-900/80 px-2.5 py-1 text-[10.5px] font-medium text-muted-foreground transition-all hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-500 shadow-2xs"
                >
                  <q.icon className="h-3 w-3 text-emerald-500" />
                  <span>{q.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input Footer - sleek floating capsule pill dock */}
          <div className="border-t border-border/50 p-2.5 sm:p-3 bg-muted/10 backdrop-blur-md">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!loading) {
                  executeAIQuery(inputQuery);
                }
              }}
              className="relative flex items-center rounded-full border border-border/70 dark:border-white/10 bg-background/90 dark:bg-zinc-900/90 shadow-inner px-2 py-1 focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={
                  loading
                    ? "Generating diagnostic insights…"
                    : "Ask AI about resources, health, costs…"
                }
                className="flex-1 bg-transparent px-3 py-1.5 text-xs outline-none text-foreground placeholder:text-muted-foreground/70 disabled:opacity-60"
                disabled={loading}
              />

              {loading ? (
                <Button
                  type="button"
                  onClick={handleStopGenerating}
                  size="sm"
                  variant="outline"
                  title="Stop generating"
                  className="h-7 rounded-full border-rose-500/40 bg-rose-500/10 px-2.5 text-xs text-rose-500 hover:bg-rose-500/20 hover:text-rose-400 transition-all"
                >
                  <Square className="h-3 w-3 fill-rose-500" />
                  <span className="ml-1 text-[10.5px] font-semibold">Stop</span>
                </Button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputQuery.trim()}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:hover:from-emerald-600 disabled:hover:to-teal-600 transition-all shrink-0 active:scale-95"
                >
                  <Send className="h-3 w-3" />
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
