"use client";

// ---------------------------------------------------------------------------
// Cloud Provider Empty State — Onboarding screen for authenticated users
// ---------------------------------------------------------------------------
// Shown when dataMode === "real-no-creds": The user has logged in with a
// real Firebase account but has not connected any cloud providers yet.
//
// Replaces the resource grid / charts with a clean CTA card linking to
// the Cloud Integrations settings page.
// ---------------------------------------------------------------------------

import Link from "next/link";
import {
  Cloud,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Plug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PROVIDERS = [
  {
    name: "Amazon Web Services",
    short: "AWS",
    color: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-600 dark:text-orange-400",
    borderColor: "border-orange-500/20",
  },
  {
    name: "Google Cloud Platform",
    short: "GCP",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-500/20",
  },
  {
    name: "Microsoft Azure",
    short: "Azure",
    color: "from-sky-500 to-indigo-500",
    bgColor: "bg-sky-500/10",
    textColor: "text-sky-600 dark:text-sky-400",
    borderColor: "border-sky-500/20",
  },
] as const;

const BENEFITS = [
  {
    icon: BarChart3,
    title: "Live Metrics",
    desc: "Real-time CPU, memory, network, and storage telemetry from your cloud fleet",
  },
  {
    icon: Zap,
    title: "Unified Dashboard",
    desc: "Multi-cloud resources normalized into a single view with threshold alerts",
  },
  {
    icon: ShieldCheck,
    title: "Encrypted Vault",
    desc: "Credentials encrypted with AES-256-GCM at rest — decrypted only in memory on the server",
  },
] as const;

export function CloudProviderEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Hero icon */}
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600/20 via-violet-600/20 to-cyan-500/20 ring-1 ring-blue-500/10">
          <Cloud className="h-10 w-10 text-blue-500" />
        </div>
        {/* Decorative floating dot */}
        <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 ring-2 ring-background animate-pulse" />
      </div>

      {/* Title & description */}
      <h2 className="text-xl font-bold tracking-tight text-foreground text-center">
        Connect Your First Cloud Provider
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground text-center leading-relaxed">
        Link your AWS, GCP, or Azure account to start monitoring live infrastructure metrics,
        resource health, and billing — all from this unified dashboard.
      </p>

      {/* Provider pills */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
        {PROVIDERS.map((p) => (
          <div
            key={p.short}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 ${p.bgColor} ${p.borderColor} transition-all hover:scale-105`}
          >
            <Plug className={`h-3.5 w-3.5 ${p.textColor}`} />
            <span className={`text-xs font-semibold ${p.textColor}`}>
              {p.short}
            </span>
          </div>
        ))}
      </div>

      {/* CTA button */}
      <Link href="/dashboard/integrations" className="mt-8">
        <Button
          size="lg"
          className="gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:brightness-110 shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 font-semibold"
        >
          <Plug className="h-4 w-4" />
          Connect Cloud Provider
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>

      {/* Benefits grid */}
      <div className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
        {BENEFITS.map((b) => (
          <Card
            key={b.title}
            className="border-border/40 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4 text-center">
              <div className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
                <b.icon className="h-4.5 w-4.5 text-blue-500" />
              </div>
              <p className="text-xs font-semibold text-foreground">{b.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {b.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subtle security note */}
      <div className="mt-8 flex items-center gap-2 rounded-lg border border-border/40 bg-muted/30 px-4 py-2.5">
        <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
        <p className="text-[11px] text-muted-foreground">
          Your cloud credentials are encrypted with AES-256-GCM and never exposed to the browser.
          <span className="font-medium text-foreground"> Decryption happens only on the server</span>
          , in memory, per API call.
        </p>
      </div>

      {/* Skip / demo link */}
      <p className="mt-5 text-xs text-muted-foreground">
        Just exploring?{" "}
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              localStorage.setItem("crm_demo_mode", "true");
              window.location.href = "/dashboard";
            }
          }}
          className="font-medium text-blue-500 hover:text-blue-600 underline underline-offset-2 transition-colors"
        >
          Switch to Demo Mode
        </button>
      </p>
    </div>
  );
}
