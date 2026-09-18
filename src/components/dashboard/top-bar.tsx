"use client";

import { useState } from "react";
import { Cloud, LogOut, User as UserIcon, Phone, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useDashboard } from "./dashboard-provider";
import { ProfileDialog } from "./profile-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function TopBar() {
  const { user, auth } = useDashboard();
  const [profileOpen, setProfileOpen] = useState(false);

  const initials = (user.displayName ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
        {/* Left: brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-sm">
            <Cloud className="h-4.5 w-4.5" />
          </div>
          <h1 className="text-base font-semibold tracking-tight sm:text-lg">
            Cloud Resource Monitor
          </h1>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark mode toggle */}
          <ThemeToggle />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="relative flex h-9 items-center gap-2 rounded-full px-2 text-sm outline-none transition-colors hover:bg-muted sm:px-3"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage
                  src={user.photoURL ?? undefined}
                  alt={user.displayName ?? "User"}
                />
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline-block">
                {user.displayName ?? "User"}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{user.displayName || "Cloud User"}</p>
                  <p className="text-xs text-muted-foreground">{user.email || "No email"}</p>
                  {user.phoneNumber ? (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{user.phoneNumber}</span>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                      <Phone className="h-3 w-3" />
                      <span>Phone not linked</span>
                    </div>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setProfileOpen(true)}
                className="cursor-pointer"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                Profile & Mobile Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={auth.signOut}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Account Profile & Mobile Linking Modal */}
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
