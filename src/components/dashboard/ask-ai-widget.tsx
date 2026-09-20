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
      isAbnormal: r.cpuUsage > 80,
    })),
    abnormalAlerts: alerts.map((a) => ({
      name: a.resourceName,
      type: a.resourceType,
      metric: a.metric,
      value: `${a.value}%`,
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
          history: messages.map((m) => ({
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

      {/* Floating Chat Window - consumes marked place on right side */}
      {isAiOpen && (
        <div
          className={`fixed bottom-[134px] right-3.5 sm:bottom-20 sm:right-6 md:right-8 z-50 flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-background/95 shadow-2xl backdrop-blur-xl transition-all duration-200 w-[70vw] max-w-[315px] h-[380px] max-h-[50vh] ${
            isDesktopExpanded
              ? "sm:w-[680px] md:w-[760px] lg:w-[840px] sm:h-[720px] md:h-[780px] lg:h-[840px] sm:max-h-[90vh] md:max-h-[92vh]"
              : "sm:w-[500px] md:w-[560px] lg:w-[600px] sm:h-[640px] md:h-[700px] lg:h-[740px] sm:max-h-[85vh] md:max-h-[88vh]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-3 py-2 sm:px-4 sm:py-3">
            <div className="flex items-center gap-2">
              <div className="relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-sm shrink-0">
                <Cpu className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {loading && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <h3 className="text-xs font-bold tracking-tight truncate">
                    Cloud AI
                  </h3>
                  <Badge className="bg-emerald-500/15 text-[8.5px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-1 py-0 font-medium">
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
                  className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              )}
              <button
                onClick={() => setIsDesktopExpanded(!isDesktopExpanded)}
                title={isDesktopExpanded ? "Standard width" : "Expanded width"}
                className="hidden sm:inline-flex rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {isDesktopExpanded ? (
                  <Minimize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
              </button>
              <button
                onClick={() => setIsAiOpen(false)}
                title="Close"
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="relative flex-1 overflow-y-auto p-2.5 sm:p-4 space-y-2.5 sm:space-y-4 text-xs"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2 shadow-xs border border-emerald-500/20">
                  <Bot className="h-5 w-5" />
                </div>
                <h4 className="text-[11.5px] font-semibold">How can I assist you?</h4>
                <p className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground max-w-[240px] sm:max-w-[360px] leading-relaxed">
                  Real-time telemetry, anomaly analysis & cost guidance.
                </p>

                {/* Quick Prompts */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 w-full">
                  {quickPrompts.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => executeAIQuery(q.prompt)}
                      disabled={loading}
                      className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/20 p-2 text-left text-[10.5px] font-medium transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-emerald-600 disabled:opacity-50"
                    >
                      <q.icon className="h-3 w-3 text-emerald-600 shrink-0" />
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
                    className={`group flex flex-col ${m.role === "user" ? "items-end" : "items-start"
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
                      className={`relative rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs leading-relaxed max-w-[94%] sm:max-w-[88%] transition-all ${m.role === "user"
                          ? "bg-primary text-primary-foreground font-medium rounded-tr-sm shadow-sm"
                          : "border border-border/75 bg-muted/25 text-foreground rounded-tl-sm shadow-sm"
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
            <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-1.5 border-t border-border/40 bg-muted/10 no-scrollbar">
              {quickPrompts.slice(0, 3).map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => executeAIQuery(q.prompt)}
                  className="shrink-0 flex items-center gap-1 rounded-lg border border-border/50 bg-background px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:border-emerald-500/40 hover:text-foreground"
                >
                  <q.icon className="h-2.5 w-2.5 text-emerald-600" />
                  <span>{q.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <div className="border-t border-border/60 p-2.5 sm:p-3.5 bg-background">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!loading) {
                  executeAIQuery(inputQuery);
                }
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={
                  loading
                    ? "Generating…"
                    : "Ask AI about resources, health…"
                }
                className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none ring-ring focus:ring-2 disabled:opacity-60"
                disabled={loading}
              />

              {loading ? (
                <Button
                  type="button"
                  onClick={handleStopGenerating}
                  size="sm"
                  variant="outline"
                  title="Stop generating"
                  className="h-8 rounded-xl border-rose-500/40 bg-rose-500/10 px-2.5 text-xs text-rose-600 hover:bg-rose-500/20 hover:text-rose-700"
                >
                  <Square className="h-3 w-3 fill-rose-600" />
                  <span className="ml-1 text-[11px] font-semibold">Stop</span>
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!inputQuery.trim()}
                  size="sm"
                  className="h-8 rounded-xl bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-700 transition-all shadow-sm"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
