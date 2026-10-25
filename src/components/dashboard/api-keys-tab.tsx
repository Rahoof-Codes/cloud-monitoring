"use client";

// ---------------------------------------------------------------------------
// API Keys & IAM Security Tab — Fleet-wide Credential & Access Management
// ---------------------------------------------------------------------------

import { useState } from "react";
import {
  Key,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  Code2,
  Lock,
  Globe,
  Terminal,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useDashboard, type Resource } from "./dashboard-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function ApiKeysTab() {
  const { resources, regenerateCredentials } = useDashboard();
  const [searchQuery, setSearchQuery] = useState("");
  const [revealedKeys, setRevealedKeys] = useState<Record<string, { ak?: boolean; sk?: boolean }>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [selectedSnippetResource, setSelectedSnippetResource] = useState<Resource | null>(null);
  const [codeLang, setCodeLang] = useState<"curl" | "python" | "node" | "env">("curl");

  const toggleReveal = (id: string, field: "ak" | "sk") => {
    setRevealedKeys((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: !prev[id]?.[field],
      },
    }));
  };

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRotate = async (id: string, name: string) => {
    setRotatingId(id);
    try {
      await regenerateCredentials(id);
      toast.success(`API Key Rotated for ${name}`, {
        description: "Old credentials revoked; new cryptographic pair issued.",
      });
    } catch {
      toast.error(`Failed to rotate key for ${name}`);
    } finally {
      setRotatingId(null);
    }
  };

  const handleRotateAll = async () => {
    setRotatingId("all");
    try {
      for (const res of resources) {
        await regenerateCredentials(res.id);
      }
      toast.success("All Fleet API Keys Rotated", {
        description: `Successfully regenerated ${resources.length} resource access key pairs.`,
      });
    } finally {
      setRotatingId(null);
    }
  };

  const mask = (str: string = "", keep = 6) => {
    if (str.length <= keep) return "••••••••";
    return str.slice(0, keep) + "••••••••••••" + str.slice(-4);
  };

  const filteredResources = resources.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q) ||
      r.region.toLowerCase().includes(q) ||
      (r.apiCredentials?.accessKey && r.apiCredentials.accessKey.toLowerCase().includes(q))
    );
  });

  // Generate code snippet based on selected resource and language
  const getCodeSnippet = (res: Resource, lang: "curl" | "python" | "node" | "env") => {
    const ak = res.apiCredentials?.accessKey || "AKIA_DEMO_KEY";
    const sk = res.apiCredentials?.secretKey || "SECRET_DEMO_KEY";
    const endpoint = `https://${res.region}.cloudwatch.monitoring.io/v1/resources/${res.id}`;

    switch (lang) {
      case "curl":
        return `# Ingest Telemetry or Manage Resource via cURL
curl -X POST "${endpoint}/metrics" \\
  -H "Content-Type: application/json" \\
  -H "X-CloudWatch-Access-Key: ${ak}" \\
  -H "X-CloudWatch-Secret-Key: ${sk}" \\
  -d '{
    "metric": "CPUUtilization",
    "value": 45.2,
    "unit": "Percent",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }'`;

      case "python":
        return `# Python 3.10+ SDK Integration (boto3 / requests)
import requests
import datetime

ENDPOINT = "${endpoint}/metrics"
HEADERS = {
    "X-CloudWatch-Access-Key": "${ak}",
    "X-CloudWatch-Secret-Key": "${sk}",
    "Content-Type": "application/json"
}

payload = {
    "resource_id": "${res.id}",
    "resource_name": "${res.name}",
    "metrics": {
        "cpu_usage": 42.5,
        "storage_usage": 68.0,
        "network_traffic_mb": 15.4
    },
    "timestamp": datetime.datetime.utcnow().isoformat()
}

response = requests.post(ENDPOINT, json=payload, headers=HEADERS)
print(f"Status: {response.status_code}, Response: {response.json()}")`;

      case "node":
        return `// Node.js (TypeScript / JavaScript) SDK
import { fetch } from 'undici';

const ENDPOINT = "${endpoint}/metrics";
const response = await fetch(ENDPOINT, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CloudWatch-Access-Key': '${ak}',
    'X-CloudWatch-Secret-Key': '${sk}',
  },
  body: JSON.stringify({
    resourceId: '${res.id}',
    type: '${res.type}',
    timestamp: new Date().toISOString(),
    telemetry: {
      cpuUsage: 38.2,
      networkThroughput: 12.5,
    },
  }),
});

const data = await response.json();
console.log('Ingestion Response:', data);`;

      case "env":
        return `# Environment Variables (.env.local)
CLOUDWATCH_RESOURCE_ID=${res.id}
CLOUDWATCH_RESOURCE_NAME=${res.name}
CLOUDWATCH_REGION=${res.region}
CLOUDWATCH_ACCESS_KEY_ID=${ak}
CLOUDWATCH_SECRET_ACCESS_KEY=${sk}
CLOUDWATCH_API_ENDPOINT=${endpoint}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Security Posture Summary Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Active Key Pairs
              </span>
              <Key className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">
              {resources.length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              100% encrypted in transit
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                KMS Cryptography
              </span>
              <Lock className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              AES-256 GCM
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Envelope encryption active
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                IAM Scopes
              </span>
              <ShieldCheck className="h-4 w-4 text-purple-500" />
            </div>
            <div className="mt-2 text-base font-bold text-foreground">
              Least Privilege
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              telemetry:push · compute:power
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Rotation Schedule
              </span>
              <RefreshCw className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-base font-bold text-foreground">
              90-Day Policy
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              0 expired keys detected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Control Bar: Search & Batch Rotate ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search API keys by resource name, type, region, or key prefix…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 h-9 text-xs rounded-md border border-input bg-background text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRotateAll}
            disabled={rotatingId !== null}
            className="h-9 text-xs gap-1.5 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            title="Rotate API credentials across all monitored cloud resources"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${rotatingId === "all" ? "animate-spin" : ""}`}
            />
            <span>Rotate All Fleet Keys</span>
          </Button>
        </div>
      </div>

      {/* ── Fleet API Credentials Table ── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight">
                Resource API Credentials Inventory
              </CardTitle>
              <CardDescription className="text-xs">
                Per-resource credentials for telemetry push, SDK automation, and RESTful telemetry ingestion
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              {filteredResources.length} Key Pairs
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/40 text-muted-foreground bg-muted/20">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Resource</th>
                  <th className="px-4 py-2.5 font-medium">Access Key ID</th>
                  <th className="px-4 py-2.5 font-medium">Secret Access Key</th>
                  <th className="px-4 py-2.5 font-medium">IAM Permission Scopes</th>
                  <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredResources.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No resources match your search query.
                    </td>
                  </tr>
                ) : (
                  filteredResources.map((res) => {
                    const ak = res.apiCredentials?.accessKey || "AKIA_DEMO_KEY";
                    const sk = res.apiCredentials?.secretKey || "SECRET_DEMO_KEY";
                    const isRevealedAk = revealedKeys[res.id]?.ak;
                    const isRevealedSk = revealedKeys[res.id]?.sk;
                    const isRotating = rotatingId === res.id || rotatingId === "all";

                    return (
                      <tr key={res.id} className="hover:bg-muted/30 transition-colors">
                        {/* Resource Name & Region */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{res.name}</div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono mt-0.5">
                            <span className="rounded bg-muted px-1 py-0.2 border border-border/40">
                              {res.type}
                            </span>
                            <span>{res.region}</span>
                          </div>
                        </td>

                        {/* Access Key ID */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <code className="font-mono text-[11px] bg-muted/50 border border-border/40 px-2 py-1 rounded-md text-foreground select-all">
                              {isRevealedAk ? ak : mask(ak, 8)}
                            </code>
                            <button
                              type="button"
                              onClick={() => toggleReveal(res.id, "ak")}
                              className="p-1 hover:text-foreground text-muted-foreground transition-colors"
                              title={isRevealedAk ? "Hide Access Key" : "Reveal Access Key"}
                            >
                              {isRevealedAk ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(ak, `${res.id}-ak`)}
                              className="p-1 hover:text-foreground text-muted-foreground transition-colors"
                              title="Copy Access Key"
                            >
                              {copiedField === `${res.id}-ak` ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Secret Access Key */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <code className="font-mono text-[11px] bg-muted/50 border border-border/40 px-2 py-1 rounded-md text-foreground select-all">
                              {isRevealedSk ? sk : "••••••••••••••••••••••••"}
                            </code>
                            <button
                              type="button"
                              onClick={() => toggleReveal(res.id, "sk")}
                              className="p-1 hover:text-foreground text-muted-foreground transition-colors"
                              title={isRevealedSk ? "Hide Secret Key" : "Reveal Secret Key"}
                            >
                              {isRevealedSk ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(sk, `${res.id}-sk`)}
                              className="p-1 hover:text-foreground text-muted-foreground transition-colors"
                              title="Copy Secret Key"
                            >
                              {copiedField === `${res.id}-sk` ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* IAM Permission Scopes */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            <span className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.2 text-[10px] font-mono">
                              telemetry:push
                            </span>
                            <span className="rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2 py-0.2 text-[10px] font-mono">
                              metrics:read
                            </span>
                            {res.type === "Storage" && (
                              <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.2 text-[10px] font-mono">
                                s3:read-write
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSnippetResource(res)}
                              className="h-7 text-xs gap-1 px-2"
                              title="Generate SDK Code Snippet"
                            >
                              <Code2 className="h-3 w-3" />
                              <span>SDK Code</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isRotating}
                              onClick={() => handleRotate(res.id, res.name)}
                              className="h-7 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground"
                              title="Rotate & Issue New Key Pair"
                            >
                              <RefreshCw
                                className={`h-3 w-3 ${isRotating ? "animate-spin" : ""}`}
                              />
                              <span>Rotate</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Interactive Code Snippet Modal ── */}
      {selectedSnippetResource && (
        <Dialog
          open={Boolean(selectedSnippetResource)}
          onOpenChange={(open) => {
            if (!open) setSelectedSnippetResource(null);
          }}
        >
          <DialogContent className="sm:max-w-2xl text-xs">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-blue-500" />
                <DialogTitle className="text-sm font-semibold">
                  SDK Integration Snippet: {selectedSnippetResource.name}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs">
                Copy and run code snippet to connect and push telemetry using this resource's API credentials.
              </DialogDescription>
            </DialogHeader>

            {/* Language Tabs */}
            <div className="flex items-center gap-1.5 border-b border-border/40 pb-2">
              {[
                { id: "curl" as const, label: "cURL" },
                { id: "python" as const, label: "Python (boto3)" },
                { id: "node" as const, label: "Node.js (AWS SDK)" },
                { id: "env" as const, label: ".env format" },
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setCodeLang(lang.id)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    codeLang === lang.id
                      ? "bg-blue-600 text-white font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Code Block */}
            <div className="relative rounded-lg border border-border/70 bg-zinc-950 p-3 text-zinc-100 font-mono text-[11px] overflow-x-auto max-h-[340px]">
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    getCodeSnippet(selectedSnippetResource, codeLang),
                    "modal-code"
                  )
                }
                className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-[10px] text-zinc-200 transition-colors"
                title="Copy code"
              >
                {copiedField === "modal-code" ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <pre className="pr-14 leading-relaxed">
                {getCodeSnippet(selectedSnippetResource, codeLang)}
              </pre>
            </div>

            <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1">
              <span>Endpoint: {selectedSnippetResource.region}.cloudwatch.monitoring.io</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSnippetResource(null)}
                className="h-7 text-xs"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
