import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

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
    // ── 1. Verify Firebase ID token ────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    const idToken = authHeader.slice(7);
    let uid: string;

    try {
      const decodedToken = await getAdminAuth().verifyIdToken(idToken);
      uid = decodedToken.uid;
    } catch (err) {
      console.error("Token verification failed:", err);
      return NextResponse.json(
        { error: "Invalid or expired authentication token" },
        { status: 401 }
      );
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
    const { prompt, history } = body;

    // ── 4. Read resource data from Firestore server-side ───────────────
    const adminDb = getAdminDb();
    const userDoc = await adminDb.doc(`users/${uid}`).get();
    const userData = userDoc.data() ?? {};
    const totalStorageUsedBytes = (userData.totalStorageUsedBytes as number) ?? 0;

    const resourcesSnap = await adminDb
      .collection(`users/${uid}/resources`)
      .orderBy("createdAt", "desc")
      .get();

    const resources: ResourceDoc[] = resourcesSnap.docs.map((d) => d.data());
    const runningCount = resources.filter((r) => r.status === "running").length;
    const stoppedCount = resources.filter((r) => r.status === "stopped").length;
    const abnormalCount = resources.filter(
      (r) => (r.cpuUsage ?? 0) > 80 || (r.memoryUsage ?? 0) > 80
    ).length;

    // Cost calculations (same formula as client)
    const storageCostRaw = (totalStorageUsedBytes / 1e9) * 2;
    const resourceCostRaw = runningCount * 50;
    const totalCost = Math.round((storageCostRaw + resourceCostRaw) * 100) / 100;
    const storageCost = Math.round(storageCostRaw * 100) / 100;
    const computeCost = resourceCostRaw;

    const filesSnap = await adminDb
      .collection(`users/${uid}/files`)
      .get();
    const fileCount = filesSnap.size;

    // Format storage
    function fmtBytes(bytes: number): string {
      if (bytes === 0) return "0 B";
      const units = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      const value = bytes / Math.pow(1024, i);
      return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
    }
    const storageUsed = fmtBytes(totalStorageUsedBytes);

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
- Pricing: Compute ₹50/running resource/month, Storage ₹2/GB/month. Stopped = ₹0.
- No AI model names, API costs, or prompt details.

LIVE DATA:
- Running: ${runningCount}, Stopped: ${stoppedCount}, Total: ${resources.length}
- Alerts (>80% CPU/Mem): ${abnormalCount}
- Storage: ${storageUsed} (${fileCount} files)
- Monthly Bill: ₹${totalCost} (Compute: ₹${computeCost}, Storage: ₹${storageCost})
- Resources: ${JSON.stringify(
      resources.map((r) => ({
        name: r.name,
        type: r.type,
        status: r.status,
        region: r.region,
        cpu: `${r.cpuUsage ?? 0}%`,
        mem: `${r.memoryUsage ?? 0}%`,
      }))
    )}`;

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
