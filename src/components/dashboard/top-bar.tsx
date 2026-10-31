"use client";

// ---------------------------------------------------------------------------
// TopBar — CloudWatch Pro Header Navigation with Dedicated Sub-Page Routing
// ---------------------------------------------------------------------------

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Cloud,
  LogOut,
  RefreshCw,
  Bell,
  Sliders,
  Activity,
  Layers,
  BarChart3,
  ShieldAlert,
  History as HistoryIcon,
  Settings,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useDashboard } from "./dashboard-provider";
import { ProfileDialog } from "./profile-dialog";
import { ControlledTestDialog } from "./controlled-test-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDemoGuard } from "./demo-guard";
import { toast } from "sonner";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function TopBar() {
  const {
    user,
    auth,
    isDemoMode,
    refreshMetrics,
    refreshCountdown,
    isRefreshing,
    alerts,
  } = useDashboard();
  const { exitDemoMode } = useDemoGuard();
  const pathname = usePathname();
  const router = useRouter();

  const [profileOpen, setProfileOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeAlertsCount = alerts.filter((a) => a.status === "active").length;

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: Layers },
    { label: "Resources", href: "/dashboard/resources", icon: Layers },
    { label: "Metrics", href: "/dashboard/metrics", icon: BarChart3 },
    { label: "Thresholds", href: "/dashboard/thresholds", icon: Sliders },
    {
      label: "Alerts",
      href: "/dashboard/alerts",
      icon: ShieldAlert,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
    },
    { label: "History", href: "/dashboard/history", icon: HistoryIcon },
    { label: "Integrations", href: "/dashboard/integrations", icon: Cloud },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
    { label: "Help", href: "/dashboard/help", icon: HelpCircle },
  ];

  const handleLogout = async () => {
    if (isDemoMode) {
      exitDemoMode();
      toast.info("Exited demo session");
      router.push("/login");
    } else {
      try {
        await auth.signOut();
        toast.success("Logged out successfully");
        router.push("/login");
      } catch (err) {
        toast.error("Failed to log out");
      }
    }
  };

  const initials = (user.displayName ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isCurrentActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className="sticky top-3 z-40 mx-auto w-[calc(100%-1.25rem)] sm:w-[calc(100%-2rem)] lg:w-[calc(100%-3rem)] max-w-7xl">
        <div className="flex h-14 items-center justify-between px-3 sm:px-4 rounded-2xl border border-border/70 dark:border-white/10 bg-background/85 dark:bg-zinc-950/85 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] ring-1 ring-black/5 dark:ring-white/5 transition-all">
          {/* Left: Brand Logo & Title (CloudMonitor) */}
          <div className="flex items-center gap-5">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 font-bold tracking-tight text-foreground hover:opacity-90 transition-opacity shrink-0"
            >
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-md shadow-blue-500/25">
                <Cloud className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm sm:text-base font-extrabold tracking-tight">
                  Cloud<span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">Monitor</span>
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Items: Refined Segmented Capsule */}
            <nav className="hidden lg:flex items-center gap-0.5 p-1 rounded-xl bg-muted/40 dark:bg-zinc-900/40 border border-border/40">
              {navItems.map((item) => {
                const active = isCurrentActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      active
                        ? "bg-background dark:bg-zinc-800 text-foreground font-semibold shadow-xs border border-border/70 dark:border-white/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${active ? "text-blue-500" : "text-muted-foreground"}`} />
                    <span>{item.label}</span>
                    {typeof item.badge === "number" && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9.5px] font-bold text-white shadow-xs">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Controls: Consolidated profile, live sync, alert simulation, theme toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Quick Demo Test Action — Only visible in Demo Mode */}
            {isDemoMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTestOpen(true)}
                className="hidden xl:flex h-8 items-center gap-1.5 text-xs rounded-full border-rose-500/30 text-rose-500 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20"
                title="Demonstrate Live Threshold Alerts (Demo Mode)"
              >
                <ShieldAlert className="h-3 w-3" />
                <span>Simulate Alert</span>
              </Button>
            )}

            {/* Refresh countdown pill */}
            <button
              type="button"
              onClick={refreshMetrics}
              disabled={isRefreshing}
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Click to pull latest cloud metrics immediately"
            >
              <RefreshCw
                className={`h-3 w-3 text-blue-500 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
              <span className="text-[11px] font-mono font-medium">
                {isRefreshing ? "Syncing…" : `${refreshCountdown}s`}
              </span>
            </button>

            {/* Dark/Light mode toggle */}
            <ThemeToggle />

            {/* Consolidated User Profile & Logout Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 p-1 pr-2.5 text-xs font-medium hover:bg-muted/60 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={user.photoURL ?? undefined}
                    alt={user.displayName ?? "User"}
                  />
                  <AvatarFallback className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-[10px] font-bold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline max-w-[100px] truncate text-[11px] font-medium text-foreground">
                  {user.displayName || "Operator"}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 text-xs shadow-xl border border-border/80">
                <DropdownMenuLabel className="font-normal px-2 py-1.5">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-semibold text-foreground">{user.displayName || "Cloud User"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email || "demo@cloudmonitor.io"}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/settings")}
                  className="cursor-pointer gap-2 rounded-xl py-2 px-2.5"
                >
                  <Settings className="h-3.5 w-3.5 text-blue-500" />
                  Monitoring Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setProfileOpen(true)}
                  className="cursor-pointer gap-2 rounded-xl py-2 px-2.5"
                >
                  <Activity className="h-3.5 w-3.5 text-blue-500" />
                  Account Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer gap-2 rounded-xl py-2 px-2.5 text-rose-500 focus:text-rose-500 focus:bg-rose-500/10"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Floating Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2 p-2 rounded-2xl border border-border/80 bg-background/95 dark:bg-zinc-950/95 backdrop-blur-2xl shadow-2xl space-y-1">
            {navItems.map((item) => {
              const active = isCurrentActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {typeof item.badge === "number" && (
                    <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-border/60 flex justify-between items-center px-2">
              <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                {user.displayName || "Demo Operator"}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Global Dialogs triggered from TopBar */}
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <ControlledTestDialog open={testOpen} onOpenChange={setTestOpen} />
    </>
  );
}
