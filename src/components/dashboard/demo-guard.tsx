"use client";

// ---------------------------------------------------------------------------
// Demo Mode Auth Guard & Dialog
// ---------------------------------------------------------------------------
// Guard used by every write action:
//   - Add Resource
//   - Start/Stop/Delete Resource
//   - File upload (button + drag-and-drop)
//   - Sending a message in Ask AI chat (protects AI quota)
//
// In demo mode, it opens a Shadcn Dialog:
//   "You can't create resources or upload files until you sign in."
// with "Sign in" and "Cancel" buttons.
// ---------------------------------------------------------------------------

import { useState, createContext, useContext, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface DemoGuardContextType {
  isDemoMode: boolean;
  requireAuth: (action?: () => void | Promise<void>) => boolean;
  openSignInDialog: () => void;
  exitDemoMode: () => void;
}

const DemoGuardContext = createContext<DemoGuardContextType | null>(null);

export function useDemoGuard() {
  const ctx = useContext(DemoGuardContext);
  if (!ctx) {
    throw new Error("useDemoGuard must be used within DemoGuardProvider");
  }
  return ctx;
}

interface DemoGuardProviderProps {
  children: ReactNode;
  isDemoMode: boolean;
}

export function DemoGuardProvider({ children, isDemoMode }: DemoGuardProviderProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const exitDemoMode = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("crm_demo_mode");
      sessionStorage.removeItem("crm_demo_mode");
    }
    router.push("/login");
  }, [router]);

  const openSignInDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const requireAuth = useCallback(
    (action?: () => void | Promise<void>): boolean => {
      if (isDemoMode) {
        setDialogOpen(true);
        return false;
      }
      if (action) {
        action();
      }
      return true;
    },
    [isDemoMode]
  );

  return (
    <DemoGuardContext.Provider
      value={{
        isDemoMode,
        requireAuth,
        openSignInDialog,
        exitDemoMode,
      }}
    >
      {children}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Lock className="h-5 w-5" />
            </div>
            <DialogTitle className="text-center text-base font-semibold">
              Sign In Required
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground pt-1 leading-relaxed">
              You can&apos;t create resources or upload files until you sign in.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex-row justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
              className="flex-1 sm:flex-initial"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={exitDemoMode}
              className="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:brightness-110"
            >
              Sign In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DemoGuardContext.Provider>
  );
}

