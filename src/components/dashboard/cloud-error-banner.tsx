"use client";

// ---------------------------------------------------------------------------
// Cloud Error Banner Component
// ---------------------------------------------------------------------------
// Displays graceful non-blocking notifications when live cloud SDK calls fail
// (e.g. IAM permission denied, invalid credentials, or rate limiting).
// ---------------------------------------------------------------------------

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, X, ExternalLink, ShieldAlert, KeyRound, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface CloudError {
  provider: "aws" | "gcp" | "azure" | "all";
  type: "auth_failed" | "permission_denied" | "rate_limited" | "network" | "unknown";
  message: string;
  details?: string;
}

interface CloudErrorBannerProps {
  errors: CloudError[];
  onDismiss?: (index: number) => void;
  onRetry?: () => void;
}

export function CloudErrorBanner({ errors, onDismiss, onRetry }: CloudErrorBannerProps) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  if (!errors || errors.length === 0) return null;

  const activeErrors = errors.filter((_, idx) => !dismissed.has(idx));
  if (activeErrors.length === 0) return null;

  const handleDismiss = (idx: number) => {
    setDismissed((prev) => new Set(prev).add(idx));
    onDismiss?.(idx);
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case "aws":
        return <Badge variant="outline" className="border-[#FF9900]/40 text-[#FF9900] bg-[#FF9900]/10 text-[10px] px-1.5 py-0">AWS</Badge>;
      case "gcp":
        return <Badge variant="outline" className="border-[#4285F4]/40 text-[#4285F4] bg-[#4285F4]/10 text-[10px] px-1.5 py-0">GCP</Badge>;
      case "azure":
        return <Badge variant="outline" className="border-[#0089D6]/40 text-[#0089D6] bg-[#0089D6]/10 text-[10px] px-1.5 py-0">Azure</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0">Cloud</Badge>;
    }
  };

  const getTitle = (type: CloudError["type"]) => {
    switch (type) {
      case "auth_failed":
        return "Authentication / Signature Failure";
      case "permission_denied":
        return "IAM Permission Missing";
      case "rate_limited":
        return "API Rate Limit Exceeded";
      default:
        return "Cloud Telemetry Ingestion Warning";
    }
  };

  return (
    <div className="space-y-2 mb-4">
      {activeErrors.map((err, idx) => (
        <div
          key={idx}
          className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 px-4 py-3 text-amber-900 dark:text-amber-200 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs tracking-tight">
                  {getTitle(err.type)}
                </span>
                {getProviderBadge(err.provider)}
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {err.message}
              </p>
              {err.details && (
                <p className="font-mono text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-1 line-clamp-1">
                  {err.details}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {onRetry && (
              <Button
                variant="ghost"
                size="xs"
                onClick={onRetry}
                className="h-7 text-xs text-amber-900 hover:bg-amber-500/20 dark:text-amber-200 gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Retry
              </Button>
            )}
            <Link href="/dashboard/integrations">
              <Button
                variant="outline"
                size="xs"
                className="h-7 border-amber-500/30 text-amber-900 hover:bg-amber-500/20 dark:text-amber-200 text-xs gap-1"
              >
                <KeyRound className="h-3 w-3" /> Update Vault
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handleDismiss(idx)}
              className="text-amber-700 hover:text-amber-900 hover:bg-amber-500/20 dark:text-amber-300"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
