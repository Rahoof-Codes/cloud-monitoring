import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { STORAGE_RATE_PER_GB_MONTH } from "@/lib/pricing";
import { calculateMonthlyBill, type UsageRecord } from "@/lib/billing";

export const maxDuration = 60;

// ── Simple in-memory rate limiter ──────────────────────────────────────────
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window

function checkRateLimit(uid: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(uid) ?? [];
  // Remove expired entries
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(uid, recent);
    return false; // rate limited
  }
  recent.push(now);
  rateLimitMap.set(uid, recent);
  return true;
}

// ── Types ──────────────────────────────────────────────────────────────────

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface ResourceDoc {
  name?: string;
  type?: string;
  status?: string;
  region?: string;
  cpuUsage?: number;
  memoryUsage?: number;
}

// ── Route Handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── 1. Verify or decode authentication token ────────────────────────
    const authHeader = req.headers.get("authorization") || "";
    let uid = "cloud-user";

    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      if (token === "demo-user" || token === "demo-token" || token.startsWith("demo-")) {
        const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
        uid = `demo-${clientIp}`;
      } else {
        const adminAuth = getAdminAuth();
        if (adminAuth) {
          try {
            const decodedToken = await adminAuth.verifyIdToken(token);
            uid = decodedToken.uid;
          } catch {
            try {
              const parts = token.split(".");
              if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
                uid = payload.uid || payload.sub || payload.user_id || "authenticated-user";
              }
            } catch {
              uid = "authenticated-user";
            }
          }
        } else {
          // Admin SDK has no credentials; decode JWT payload safely
          try {
            const parts = token.split(".");
            if (parts.length === 3) {
              const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
              uid = payload.uid || payload.sub || payload.user_id || "authenticated-user";
            }
          } catch {
            uid = "authenticated-user";
          }
        }
      }
    }

    // ── 2. Rate limit ──────────────────────────────────────────────────
    if (!checkRateLimit(uid)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment before trying again." },
        { status: 429 }
      );
    }

    // ── 3. Parse request body ──────────────────────────────────────────
    const body = await req.json();
    const { prompt, history, systemContext } = body;

    // Helper to format storage
    function fmtBytes(bytes: number): string {
      if (bytes === 0) return "0 B";
      const units = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      const value = bytes / Math.pow(1024, i);
      return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
    }

    // ── 4. Read telemetry: try Firestore Admin if available, else use client snapshot ───
    let runningCount = 0;
    let stoppedCount = 0;
    let abnormalCount = 0;
    let storageUsed = "0 B";
    let fileCount = 0;
    let totalCost = 0;
    let storageCost = 0;
    let computeCost = 0;
    let resourcesList: any[] = [];
    let abnormalAlerts: any[] = [];

    let loadedFromDb = false;
    const adminDb = getAdminDb();

    if (adminDb && !uid.startsWith("demo-")) {
      try {
        const userDoc = await adminDb.doc(`users/${uid}`).get();
        const userData = userDoc.data() ?? {};
        const totalStorageUsedBytes = (userData.totalStorageUsedBytes as number) ?? 0;

        const resourcesSnap = await adminDb
          .collection(`users/${uid}/resources`)
          .orderBy("createdAt", "desc")
          .get();

        const resources: ResourceDoc[] = resourcesSnap.docs.map((d) => d.data());
        runningCount = resources.filter((r) => r.status === "running").length;
        stoppedCount = resources.filter((r) => r.status === "stopped").length;
        abnormalCount = resources.filter(
          (r) => (r.cpuUsage ?? 0) > 80 || (r.memoryUsage ?? 0) > 80
        ).length;

        const usageSnap = await adminDb.collection(`users/${uid}/usage`).get();
        const usageRecords: UsageRecord[] = usageSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        const bill = calculateMonthlyBill(usageRecords, totalStorageUsedBytes, new Date());
        totalCost = bill.totalCost;
        storageCost = bill.storageCost;
        computeCost = bill.computeCost;

        const filesSnap = await adminDb.collection(`users/${uid}/files`).get();
        fileCount = filesSnap.size;
        storageUsed = fmtBytes(totalStorageUsedBytes);
        resourcesList = resources.map((r) => ({
          name: r.name,
          type: r.type,
          status: r.status,
          region: r.region,
          cpu: `${r.cpuUsage ?? 0}%`,
          mem: `${r.memoryUsage ?? 0}%`,
        }));
        loadedFromDb = true;
      } catch (err) {
        console.warn("Firestore Admin read failed, falling back to client telemetry:", err);
      }
    }

    // Gracefully fall back to client-provided real-time systemContext (e.g. demo mode or no admin credentials)
    if (!loadedFromDb && systemContext) {
      runningCount = systemContext.summary?.runningResources ?? 0;
      stoppedCount = systemContext.summary?.stoppedResources ?? 0;
      abnormalCount = systemContext.summary?.abnormalCount ?? 0;
      storageUsed = systemContext.summary?.totalStorageUsed ?? "0 B";
      fileCount = systemContext.summary?.totalFilesCount ?? 0;

      const parseNum = (val: any) => {
        if (typeof val === "number") return val;
        if (!val) return 0;
        const parsed = parseFloat(String(val).replace(/[^0-9.-]/g, ""));
        return isNaN(parsed) ? 0 : parsed;
      };

      totalCost = parseNum(systemContext.summary?.estimatedMonthlyCost);
      storageCost = parseNum(systemContext.summary?.storageCost);
      computeCost = parseNum(systemContext.summary?.computeCost);

      resourcesList = (systemContext.resources ?? []).map((r: any) => ({
        name: r.name,
        type: r.type,
        status: r.status,
        region: r.region,
        cpu: r.cpuPercent ?? `${r.cpuUsage ?? 0}%`,
        mem: r.memoryPercent ?? `${r.memoryUsage ?? 0}%`,
      }));

      abnormalAlerts = systemContext.abnormalAlerts ?? [];
    }

    // ── 5. Check NVIDIA API key ────────────────────────────────────────
    const nvidiaApiKey = process.env.NVIDIA_API_KEY;

    if (!nvidiaApiKey) {
      return NextResponse.json(
        {
          error:
            "AI service key is not configured on the server. Please check .env.local",
        },
        { status: 500 }
      );
    }

    // ── 6. Build system prompt (short, specific) ───────────────────────
    const systemInstruction = `You are Cloud AI, the infrastructure advisor for this dashboard.

RULES:
- Be concise. Keep answers under 150 words. No preambles or filler.
- NEVER start with "Based on the current real-time infrastructure telemetry" or any variation. Jump straight into the answer.
- Greet only on the very first message. On follow-ups, skip greetings and titles.
- When asked about billing, give exact numbers immediately using the data below.
- Pricing based on AWS Mumbai (ap-south-1): VM Small ₹0.85/hr, Medium ₹3.40/hr, Large ₹8.00/hr; Database Small ₹1.50/hr, Medium ₹6.00/hr, Large ₹12.00/hr; Network ₹2.00/hr; Storage ₹2/GB/month. Stopped resources incur ₹0 compute charge. Charges are usage-based (running seconds × hourly rate / 3600, min 60s per session) and survive resource deletion.
- No AI model names, API costs, or prompt details.

LIVE DATA:
- Running: ${runningCount}, Stopped: ${stoppedCount}, Total: ${resourcesList.length}
- Alerts (>80% CPU/Mem): ${abnormalCount}
- Storage: ${storageUsed} (${fileCount} files)
- Monthly Bill: ₹${totalCost.toFixed(2)} (Compute: ₹${computeCost.toFixed(2)}, Storage: ₹${storageCost.toFixed(2)})
- Resources: ${JSON.stringify(resourcesList)}
${abnormalAlerts.length > 0 ? `- Active Alerts: ${JSON.stringify(abnormalAlerts)}` : ""}`;

    // Build multi-turn message history for continuous dialogue
    const conversationMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: systemInstruction,
      },
    ];

    if (Array.isArray(history) && history.length > 0) {
      // Include up to the last 8 turns of conversation
      const recentHistory: ChatTurn[] = history.slice(-8);
      for (const turn of recentHistory) {
        if (turn.role === "user" || turn.role === "assistant") {
          conversationMessages.push({
            role: turn.role,
            content: turn.content,
          });
        }
      }
    } else {
      conversationMessages.push({
        role: "user",
        content: prompt,
      });
    }

    const upstreamResponse = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${nvidiaApiKey}`,
        },
        body: JSON.stringify({
          model: "meta/llama-3.2-11b-vision-instruct",
          messages: conversationMessages,
          temperature: 0.3,
          max_tokens: 400,
          stream: true,
        }),
        signal: req.signal,
      }
    );

    if (!upstreamResponse.ok) {
      const errText = await upstreamResponse.text();
      console.error("AI upstream service error:", errText);
      return NextResponse.json(
        {
          error: `AI service error (${upstreamResponse.status})`,
        },
        { status: upstreamResponse.status }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        if (!upstreamResponse.body) {
          controller.close();
          return;
        }

        const reader = upstreamResponse.body.getReader();
        let buffer = "";
        let insideThinkTag = false;

        try {
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
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
                return;
              }

              if (trimmed.startsWith("data: ")) {
                try {
                  const json = JSON.parse(trimmed.slice(6));
                  let delta = json.choices?.[0]?.delta?.content || "";
                  if (!delta && json.choices?.[0]?.delta?.reasoning_content) {
                    delta = json.choices[0].delta.reasoning_content;
                  }

                  if (delta) {
                    if (delta.includes("<think>")) {
                      insideThinkTag = true;
                      delta = delta.split("<think>")[0];
                    }
                    if (insideThinkTag) {
                      if (delta.includes("</think>")) {
                        insideThinkTag = false;
                        delta = delta.split("</think>")[1] || "";
                      } else {
                        delta = "";
                      }
                    }

                    if (delta) {
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ text: delta })}\n\n`)
                      );
                    }
                  }
                } catch {
                  // Ignore JSON parse errors for split SSE fragments
                }
              }
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err: unknown) {
          if (err instanceof Error && err.name === "AbortError") {
            // Client intentionally aborted request
            return;
          }
          console.error("Streaming error in AI route:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Stream encountered an error" })}\n\n`
            )
          );
          controller.close();
        }
      },
      cancel() {
        upstreamResponse.body?.cancel();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    console.error("AI route error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Internal AI route error",
      },
      { status: 500 }
    );
  }
}
