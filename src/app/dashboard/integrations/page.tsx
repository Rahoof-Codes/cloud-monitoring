"use client";

// ---------------------------------------------------------------------------
// Cloud Integrations & Credential Vault Page
// ---------------------------------------------------------------------------
// Manages encrypted credentials for AWS, GCP, and Microsoft Azure.
// Credentials are encrypted client-to-server and saved in AES-256-GCM vault.
// ---------------------------------------------------------------------------

import { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Lock,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  KeyRound,
  FileCode,
  Info,
  Server,
  Zap,
} from "lucide-react";
import { useDashboard } from "@/components/dashboard";
import { useCloudProviders } from "@/lib/useCloudProviders";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function IntegrationsPage() {
  const { dataMode, isDemoMode } = useDashboard();
  const {
    providers,
    loading,
    error,
    actionLoading,
    connectProvider,
    disconnectProvider,
    testConnection,
    isConnected,
    getProviderInfo,
  } = useCloudProviders();

  // Active expanded accordion forms
  const [expandedProvider, setExpandedProvider] = useState<"aws" | "gcp" | "azure" | null>(null);

  // Form states
  const [awsForm, setAwsForm] = useState({
    accessKeyId: "",
    secretAccessKey: "",
    region: "us-east-1",
  });

  const [gcpForm, setGcpForm] = useState({
    projectId: "",
    clientEmail: "",
    privateKey: "",
    jsonPaste: "",
  });

  const [azureForm, setAzureForm] = useState({
    tenantId: "",
    clientId: "",
    clientSecret: "",
    subscriptionId: "",
  });

  // Inline test feedback
  const [testResult, setTestResult] = useState<{
    provider: string;
    ok: boolean;
    message: string;
  } | null>(null);

  const toggleExpand = (provider: "aws" | "gcp" | "azure") => {
    setTestResult(null);
    setExpandedProvider((prev) => (prev === provider ? null : provider));
  };

  // Handle GCP JSON service account upload or paste
  const handleGcpJsonPaste = (val: string) => {
    try {
      const parsed = JSON.parse(val);
      setGcpForm({
        projectId: parsed.project_id || "",
        clientEmail: parsed.client_email || "",
        privateKey: parsed.private_key || "",
        jsonPaste: val,
      });
      toast.success("Service account JSON parsed successfully");
    } catch {
      setGcpForm((prev) => ({ ...prev, jsonPaste: val }));
    }
  };

  const handleTestAws = async () => {
    setTestResult(null);
    try {
      const res = await testConnection("aws", awsForm);
      setTestResult({ provider: "aws", ok: true, message: res.message || "AWS credentials validated!" });
      toast.success("AWS Connection Successful");
    } catch (err: any) {
      setTestResult({ provider: "aws", ok: false, message: err?.message || "Failed to test AWS connection" });
      toast.error("AWS Test Failed", { description: err?.message });
    }
  };

  const handleSaveAws = async () => {
    if (!awsForm.accessKeyId || !awsForm.secretAccessKey) {
      toast.error("Please fill in AWS Access Key ID and Secret Access Key");
      return;
    }

    try {
      await connectProvider({
        provider: "aws",
        credentials: {
          accessKeyId: awsForm.accessKeyId.trim(),
          secretAccessKey: awsForm.secretAccessKey.trim(),
          region: awsForm.region.trim(),
        },
        label: `AWS (${awsForm.region})`,
      });

      // Clear sensitive secret from component state
      setAwsForm({ accessKeyId: "", secretAccessKey: "", region: "us-east-1" });
      setExpandedProvider(null);
      setTestResult(null);
      toast.success("AWS Connected & Encrypted in Vault", {
        description: "Live telemetry and resources will now stream from CloudWatch & EC2.",
      });
    } catch (err: any) {
      toast.error("Failed to connect AWS", { description: err?.message });
    }
  };

  const handleTestGcp = async () => {
    setTestResult(null);
    try {
      const res = await testConnection("gcp", {
        projectId: gcpForm.projectId.trim(),
        clientEmail: gcpForm.clientEmail.trim(),
        privateKey: gcpForm.privateKey.trim(),
      });
      setTestResult({ provider: "gcp", ok: true, message: res.message || "GCP Service Account validated!" });
      toast.success("GCP Connection Successful");
    } catch (err: any) {
      setTestResult({ provider: "gcp", ok: false, message: err?.message || "Failed to test GCP connection" });
      toast.error("GCP Test Failed", { description: err?.message });
    }
  };

  const handleSaveGcp = async () => {
    if (!gcpForm.projectId || !gcpForm.clientEmail || !gcpForm.privateKey) {
      toast.error("Please provide Project ID, Client Email, and Private Key (or paste JSON)");
      return;
    }

    try {
      await connectProvider({
        provider: "gcp",
        credentials: {
          projectId: gcpForm.projectId.trim(),
          clientEmail: gcpForm.clientEmail.trim(),
          privateKey: gcpForm.privateKey.trim(),
        },
        label: `GCP (${gcpForm.projectId})`,
      });

      setGcpForm({ projectId: "", clientEmail: "", privateKey: "", jsonPaste: "" });
      setExpandedProvider(null);
      setTestResult(null);
      toast.success("Google Cloud Connected & Encrypted", {
        description: "Google Cloud Monitoring and Compute Engine telemetry active.",
      });
    } catch (err: any) {
      toast.error("Failed to connect GCP", { description: err?.message });
    }
  };

  const handleTestAzure = async () => {
    setTestResult(null);
    try {
      const res = await testConnection("azure", azureForm);
      setTestResult({ provider: "azure", ok: true, message: res.message || "Azure Service Principal validated!" });
      toast.success("Azure Connection Successful");
    } catch (err: any) {
      setTestResult({ provider: "azure", ok: false, message: err?.message || "Failed to test Azure connection" });
      toast.error("Azure Test Failed", { description: err?.message });
    }
  };

  const handleSaveAzure = async () => {
    if (!azureForm.tenantId || !azureForm.clientId || !azureForm.clientSecret || !azureForm.subscriptionId) {
      toast.error("Please fill in all Azure Service Principal fields");
      return;
    }

    try {
      await connectProvider({
        provider: "azure",
        credentials: {
          tenantId: azureForm.tenantId.trim(),
          clientId: azureForm.clientId.trim(),
          clientSecret: azureForm.clientSecret.trim(),
          subscriptionId: azureForm.subscriptionId.trim(),
        },
        label: `Azure (${azureForm.subscriptionId.slice(0, 8)}…)`,
      });

      setAzureForm({ tenantId: "", clientId: "", clientSecret: "", subscriptionId: "" });
      setExpandedProvider(null);
      setTestResult(null);
      toast.success("Microsoft Azure Connected & Encrypted", {
        description: "Azure Monitor & Virtual Machine telemetry active.",
      });
    } catch (err: any) {
      toast.error("Failed to connect Azure", { description: err?.message });
    }
  };

  const handleDisconnect = async (provider: "aws" | "gcp" | "azure") => {
    if (!confirm(`Are you sure you want to disconnect ${provider.toUpperCase()}? Stored encrypted credentials will be purged.`)) {
      return;
    }

    try {
      await disconnectProvider(provider);
      toast.info(`Disconnected ${provider.toUpperCase()} credentials`);
    } catch (err: any) {
      toast.error(`Failed to disconnect ${provider}`, { description: err?.message });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/20">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  Cloud Integrations & Vault
                </h1>
                <p className="text-xs text-muted-foreground">
                  Connect live AWS, GCP, and Azure accounts using zero-trust encrypted credentials.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Badge variant="outline" className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Lock className="h-3 w-3" /> AES-256-GCM Vault
              </Badge>
              <Badge variant="outline" className="gap-1.5 border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Zap className="h-3 w-3" /> Live SDK Normalization
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                {isDemoMode ? "Currently Viewing: Simulated Demo" : `Active Providers: ${providers.length}`}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-1.5">
                Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Security Architecture Notice */}
      <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <div>
          <p className="font-semibold text-foreground">Zero-Trust Credential Security Policy</p>
          <p className="mt-0.5">
            Credentials entered here are never stored in browser storage (no localStorage or cookies). They are encrypted
            server-side with AES-256-GCM and stored only in your private user Firestore vault. Cloud SDK queries run server-side
            via Next.js API routes with a 60-second in-memory cache to prevent provider rate-limit charges.
          </p>
        </div>
      </div>

      {/* Cloud Provider Cards */}
      <div className="grid grid-cols-1 gap-6">
        {/* ================================================================= AWS CARD */}
        <Card className={`overflow-hidden border transition-all ${isConnected("aws") ? "border-emerald-500/40 shadow-sm" : "border-border"}`}>
          <CardHeader className="bg-muted/15 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF9900]/15 text-[#FF9900] border border-[#FF9900]/30 font-bold">
                  AWS
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Amazon Web Services</CardTitle>
                    {isConnected("aws") ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Not Connected</Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    CloudWatch Metrics, EC2 Instances, and AWS Cost Explorer
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isConnected("aws") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 text-xs gap-1"
                    onClick={() => handleDisconnect("aws")}
                    disabled={actionLoading === "disconnect-aws"}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Disconnect
                  </Button>
                )}
                <Button
                  variant={isConnected("aws") ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleExpand("aws")}
                  className="gap-1.5"
                >
                  {isConnected("aws") ? "Edit Credentials" : "Connect AWS"}
                  {expandedProvider === "aws" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {isConnected("aws") && (
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground border-t border-border/40 pt-2.5">
                <span>Label: <strong className="text-foreground">{getProviderInfo("aws")?.label}</strong></span>
                <span>•</span>
                <span>Connected: {new Date(getProviderInfo("aws")?.connectedAt || "").toLocaleString()}</span>
              </div>
            )}
          </CardHeader>

          {/* AWS Form Accordion */}
          {expandedProvider === "aws" && (
            <CardContent className="pt-6 space-y-4 border-t border-border/50 bg-card">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="aws-access-key">AWS Access Key ID</Label>
                  <Input
                    id="aws-access-key"
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    value={awsForm.accessKeyId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAwsForm((p) => ({ ...p, accessKeyId: e.target.value }))}
                  />
                  <p className="text-[11px] text-muted-foreground">IAM user or assumed role access key</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="aws-region">Default Region</Label>
                  <Input
                    id="aws-region"
                    placeholder="us-east-1"
                    value={awsForm.region}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAwsForm((p) => ({ ...p, region: e.target.value }))}
                  />
                  <p className="text-[11px] text-muted-foreground">e.g. us-east-1, us-west-2, ap-south-1</p>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="aws-secret">AWS Secret Access Key</Label>
                  <Input
                    id="aws-secret"
                    type="password"
                    placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                    value={awsForm.secretAccessKey}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAwsForm((p) => ({ ...p, secretAccessKey: e.target.value }))}
                  />
                  <p className="text-[11px] text-muted-foreground">Masked password field. Encrypted upon submission.</p>
                </div>
              </div>

              {testResult?.provider === "aws" && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${testResult.ok ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" : "bg-destructive/10 text-destructive border border-destructive/30"}`}>
                  {testResult.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestAws}
                  disabled={actionLoading === "test-aws" || !awsForm.accessKeyId || !awsForm.secretAccessKey}
                  className="gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${actionLoading === "test-aws" ? "animate-spin" : ""}`} />
                  Test AWS Connection
                </Button>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setExpandedProvider(null)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveAws}
                    disabled={actionLoading === "connect-aws" || !awsForm.accessKeyId || !awsForm.secretAccessKey}
                    className="gap-1.5"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Save & Encrypt AWS
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* ================================================================= GCP CARD */}
        <Card className={`overflow-hidden border transition-all ${isConnected("gcp") ? "border-emerald-500/40 shadow-sm" : "border-border"}`}>
          <CardHeader className="bg-muted/15 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4285F4]/15 text-[#4285F4] border border-[#4285F4]/30 font-bold">
                  GCP
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Google Cloud Platform</CardTitle>
                    {isConnected("gcp") ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Not Connected</Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    Cloud Monitoring (formerly Stackdriver) and Compute Engine API
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isConnected("gcp") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 text-xs gap-1"
                    onClick={() => handleDisconnect("gcp")}
                    disabled={actionLoading === "disconnect-gcp"}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Disconnect
                  </Button>
                )}
                <Button
                  variant={isConnected("gcp") ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleExpand("gcp")}
                  className="gap-1.5"
                >
                  {isConnected("gcp") ? "Edit Credentials" : "Connect GCP"}
                  {expandedProvider === "gcp" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {isConnected("gcp") && (
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground border-t border-border/40 pt-2.5">
                <span>Label: <strong className="text-foreground">{getProviderInfo("gcp")?.label}</strong></span>
                <span>•</span>
                <span>Connected: {new Date(getProviderInfo("gcp")?.connectedAt || "").toLocaleString()}</span>
              </div>
            )}
          </CardHeader>

          {/* GCP Form Accordion */}
          {expandedProvider === "gcp" && (
            <CardContent className="pt-6 space-y-4 border-t border-border/50 bg-card">
              <div className="space-y-1.5">
                <Label htmlFor="gcp-json">Paste Service Account Key JSON</Label>
                <Textarea
                  id="gcp-json"
                  rows={4}
                  placeholder='{"type": "service_account", "project_id": "...", "private_key": "...", "client_email": "..."}'
                  value={gcpForm.jsonPaste}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleGcpJsonPaste(e.target.value)}
                  className="font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Paste the JSON key file downloaded from Google Cloud Console IAM & Admin &gt; Service Accounts.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="gcp-project">Project ID</Label>
                  <Input
                    id="gcp-project"
                    placeholder="my-gcp-project-12345"
                    value={gcpForm.projectId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGcpForm((p) => ({ ...p, projectId: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gcp-email">Client Email</Label>
                  <Input
                    id="gcp-email"
                    placeholder="sa-monitor@my-project.iam.gserviceaccount.com"
                    value={gcpForm.clientEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGcpForm((p) => ({ ...p, clientEmail: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="gcp-key">Private Key (PEM format)</Label>
                  <Textarea
                    id="gcp-key"
                    rows={3}
                    placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                    value={gcpForm.privateKey}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setGcpForm((p) => ({ ...p, privateKey: e.target.value }))}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              {testResult?.provider === "gcp" && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${testResult.ok ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" : "bg-destructive/10 text-destructive border border-destructive/30"}`}>
                  {testResult.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestGcp}
                  disabled={actionLoading === "test-gcp" || !gcpForm.projectId || !gcpForm.clientEmail}
                  className="gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${actionLoading === "test-gcp" ? "animate-spin" : ""}`} />
                  Test GCP Service Account
                </Button>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setExpandedProvider(null)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveGcp}
                    disabled={actionLoading === "connect-gcp" || !gcpForm.projectId || !gcpForm.clientEmail || !gcpForm.privateKey}
                    className="gap-1.5"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Save & Encrypt GCP
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* ================================================================= AZURE CARD */}
        <Card className={`overflow-hidden border transition-all ${isConnected("azure") ? "border-emerald-500/40 shadow-sm" : "border-border"}`}>
          <CardHeader className="bg-muted/15 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0089D6]/15 text-[#0089D6] border border-[#0089D6]/30 font-bold">
                  AZ
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Microsoft Azure</CardTitle>
                    {isConnected("azure") ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Not Connected</Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    Azure Monitor Metrics, Virtual Machines ARM, and Cost Management
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isConnected("azure") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 text-xs gap-1"
                    onClick={() => handleDisconnect("azure")}
                    disabled={actionLoading === "disconnect-azure"}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Disconnect
                  </Button>
                )}
                <Button
                  variant={isConnected("azure") ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleExpand("azure")}
                  className="gap-1.5"
                >
                  {isConnected("azure") ? "Edit Credentials" : "Connect Azure"}
                  {expandedProvider === "azure" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {isConnected("azure") && (
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground border-t border-border/40 pt-2.5">
                <span>Label: <strong className="text-foreground">{getProviderInfo("azure")?.label}</strong></span>
                <span>•</span>
                <span>Connected: {new Date(getProviderInfo("azure")?.connectedAt || "").toLocaleString()}</span>
              </div>
            )}
          </CardHeader>

          {/* Azure Form Accordion */}
          {expandedProvider === "azure" && (
            <CardContent className="pt-6 space-y-4 border-t border-border/50 bg-card">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="az-tenant">Tenant ID (Directory ID)</Label>
                  <Input
                    id="az-tenant"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={azureForm.tenantId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAzureForm((p) => ({ ...p, tenantId: e.target.value }))}
                  />
                  <p className="text-[11px] text-muted-foreground">Azure Active Directory (Entra ID) Tenant GUID</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="az-client">Client ID (Application ID)</Label>
                  <Input
                    id="az-client"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={azureForm.clientId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAzureForm((p) => ({ ...p, clientId: e.target.value }))}
                  />
                  <p className="text-[11px] text-muted-foreground">App Registration Client GUID</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="az-sub">Subscription ID</Label>
                  <Input
                    id="az-sub"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={azureForm.subscriptionId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAzureForm((p) => ({ ...p, subscriptionId: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="az-secret">Client Secret</Label>
                  <Input
                    id="az-secret"
                    type="password"
                    placeholder="••••••••••••••••••••••••••••••••"
                    value={azureForm.clientSecret}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAzureForm((p) => ({ ...p, clientSecret: e.target.value }))}
                  />
                  <p className="text-[11px] text-muted-foreground">App Registration Client Secret Value</p>
                </div>
              </div>

              {testResult?.provider === "azure" && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${testResult.ok ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" : "bg-destructive/10 text-destructive border border-destructive/30"}`}>
                  {testResult.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestAzure}
                  disabled={actionLoading === "test-azure" || !azureForm.tenantId || !azureForm.clientId}
                  className="gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${actionLoading === "test-azure" ? "animate-spin" : ""}`} />
                  Test Azure Connection
                </Button>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setExpandedProvider(null)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveAzure}
                    disabled={
                      actionLoading === "connect-azure" ||
                      !azureForm.tenantId ||
                      !azureForm.clientId ||
                      !azureForm.clientSecret ||
                      !azureForm.subscriptionId
                    }
                    className="gap-1.5"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Save & Encrypt Azure
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
