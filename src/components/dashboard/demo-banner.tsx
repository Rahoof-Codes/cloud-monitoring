"use client";

// ---------------------------------------------------------------------------
// Demo Mode Banner
// ---------------------------------------------------------------------------

import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemoGuard } from "./demo-guard";

export function DemoBanner() {
  const { isDemoMode, exitDemoMode } = useDemoGuard();

  if (!isDemoMode) return null;

  return (
    <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 px-4 py-2.5 text-xs sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
          <Sparkles className="h-3 w-3" />
        </span>
        <span className="font-semibold text-amber-900 dark:text-amber-200">
          Demo mode — sample data
        </span>
        <span className="hidden text-amber-800/80 dark:text-amber-300/70 md:inline">
          (Interactive preview mode with sample telemetry and AWS Mumbai pricing. Actions that modify resources or upload files are protected.)
        </span>
      </div>

      <Button
        size="sm"
        onClick={exitDemoMode}
        className="h-7 gap-1.5 rounded-lg bg-amber-600 px-3 text-xs font-semibold text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
      >
        <span>Sign In</span>
        <ArrowRight className="h-3 w-3" />
      </Button>
    </div>
  );
}

