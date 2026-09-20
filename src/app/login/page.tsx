"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Cloud,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";

export default function LoginPage() {
  const {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
  } = useAuth();
  const router = useRouter();

  // Auth method state
  const [method, setMethod] = useState<"options" | "email">("options");
  const [emailMode, setEmailMode] = useState<"signin" | "signup">("signin");

  // Email form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);



  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setEmailSubmitting(true);
    try {
      if (emailMode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name || "Cloud User");
      }
    } catch {
      // toast is already emitted by useAuth
    } finally {
      setEmailSubmitting(false);
    }
  };



  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleTryDemo = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("crm_demo_mode", "true");
      sessionStorage.setItem("crm_demo_mode", "true");
    }
    toast.info("Entering Demo Mode with sample data");
    router.push("/dashboard");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background py-8">

      {/* Animated gradient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-blue-500/20 via-violet-500/15 to-transparent blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-emerald-500/15 via-cyan-500/10 to-transparent blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-amber-500/10 to-rose-500/10 blur-3xl animate-pulse [animation-delay:2s]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Login card */}
      <div className="relative z-10 mx-4 w-full max-w-md">
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 sm:p-8 shadow-2xl shadow-black/5 backdrop-blur-xl dark:bg-card/60 dark:shadow-black/20">
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/25">
              <Cloud className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Cloud Resource Monitor
            </h1>
            <p className="text-center text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
              Real-time per-user infrastructure monitoring, live usage metrics, and cost forecasting.
            </p>
          </div>

          {/* Try Demo Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleTryDemo}
            className="mb-4 w-full gap-2 rounded-xl border-amber-500/40 bg-amber-500/10 py-5 text-sm font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-all shadow-xs"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            Try demo (view sample data)
          </Button>

          {/* Quick Sign In with Google */}
          <Button
            onClick={signInWithGoogle}
            size="lg"
            className="group relative w-full gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30 hover:brightness-110"
          >
            <svg
              className="h-4.5 w-4.5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#fff"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#fff"
                opacity={0.8}
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#fff"
                opacity={0.6}
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#fff"
                opacity={0.9}
              />
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="border-t border-border/80 w-full" />
            <span className="bg-card px-3 text-[11px] uppercase tracking-wider text-muted-foreground shrink-0">
              or continue with
            </span>
            <div className="border-t border-border/80 w-full" />
          </div>



          {/* Email / Password Form */}
          {(method === "email" || method === "options") && (
            <form onSubmit={handleEmailSubmit} className="space-y-3.5">
              {emailMode === "signup" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Display Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                      disabled={emailSubmitting}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                    disabled={emailSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                    disabled={emailSubmitting}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={emailSubmitting}
                className="w-full gap-2 rounded-xl py-5 text-sm font-semibold"
              >
                {emailSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {emailMode === "signin" ? "Signing In…" : "Creating Account…"}
                  </>
                ) : (
                  <>
                    {emailMode === "signin" ? "Sign In with Email" : "Create Account"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="text-center pt-1">
                {emailMode === "signin" ? (
                  <p className="text-xs text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setEmailMode("signup")}
                      className="font-medium text-primary hover:underline"
                    >
                      Create one
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setEmailMode("signin")}
                      className="font-medium text-primary hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </form>
          )}



          {/* Security note */}
          <p className="mt-6 text-center text-[11px] text-muted-foreground/60">
            Isolated per user account · Google & Firebase Security
          </p>
        </div>
      </div>
    </div>
  );
}
