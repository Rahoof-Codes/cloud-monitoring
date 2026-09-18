"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDashboard } from "./dashboard-provider";
import { RecaptchaVerifier, type ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  Phone,
  Mail,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user, auth: authActions } = useDashboard();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"input" | "otp">("input");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const initials = (user.displayName ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      toast.error("Please enter a valid phone number with country code (e.g. +91...)");
      return;
    }

    setLoading(true);

    try {
      // Clear container and previous verifier to prevent "reCAPTCHA has already been rendered in this element"
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // ignore
        }
        recaptchaVerifierRef.current = null;
      }
      const container = document.getElementById("profile-recaptcha-container");
      if (container) {
        container.innerHTML = "";
      }

      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        "profile-recaptcha-container",
        {
          size: "invisible",
          callback: () => {},
          "expired-callback": () => {
            toast.error("reCAPTCHA expired. Please try again.");
          },
        }
      );

      const formattedNumber = phoneNumber.trim().startsWith("+")
        ? phoneNumber.trim()
        : `+${phoneNumber.trim()}`;

      const result = await authActions.linkPhoneNumber(
        formattedNumber,
        recaptchaVerifierRef.current
      );

      setConfirmationResult(result);
      setStep("otp");
    } catch (err: unknown) {
      console.error("Phone link error:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("operation-not-allowed") || errMsg.includes("SMS unable to be sent")) {
        toast.error(
          "SMS region not enabled in Firebase. Add a Test Phone Number in Firebase Console -> Authentication -> Phone (e.g. +91 9999999999 / code 123456)."
        );
      } else if (errMsg.includes("invalid-phone-number") || errMsg.includes("INVALID_LENGTH")) {
        toast.error("Invalid phone number format. Please include country code (e.g. +91 98765 43210).");
      }
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // ignore
        }
        recaptchaVerifierRef.current = null;
      }
      const container = document.getElementById("profile-recaptcha-container");
      if (container) container.innerHTML = "";
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || !otpCode) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    try {
      await authActions.confirmPhoneCode(confirmationResult, otpCode.trim(), true);
      setStep("input");
      setPhoneNumber("");
      setOtpCode("");
      setConfirmationResult(null);
    } catch (err: unknown) {
      console.error("OTP verification error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkPhone = async () => {
    setLoading(true);
    try {
      await authActions.unlinkPhoneNumber();
      setStep("input");
      setPhoneNumber("");
      setOtpCode("");
    } catch (err: unknown) {
      console.error("Unlink error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            Account & Security Profile
          </DialogTitle>
          <DialogDescription>
            Manage your account credentials, security profile, and linked mobile phone.
          </DialogDescription>
        </DialogHeader>

        {/* Invisible container for Firebase reCAPTCHA */}
        <div id="profile-recaptcha-container" />

        <div className="space-y-6 pt-2">
          {/* User Profile Card */}
          <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
            <Avatar className="h-14 w-14 border border-border/80">
              <AvatarImage
                src={user.photoURL ?? undefined}
                alt={user.displayName ?? "User"}
              />
              <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-foreground">
                {user.displayName || "Cloud User"}
              </p>
              <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                {user.email || "No email registered"}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  UID: {user.uid.slice(0, 8)}…
                </Badge>
                {user.phoneNumber ? (
                  <Badge className="bg-emerald-500/10 text-[10px] text-emerald-600 border-emerald-500/20 dark:text-emerald-400">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Phone Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">
                    Single Provider
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Phone Linking Section */}
          <div className="space-y-3 rounded-xl border border-border/60 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold">Mobile Phone Authentication</h4>
              </div>
              {user.phoneNumber && (
                <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400">
                  Linked
                </Badge>
              )}
            </div>

            {user.phoneNumber ? (
              /* Already linked */
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span className="font-mono text-sm font-medium">
                      {user.phoneNumber}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUnlinkPhone}
                    disabled={loading}
                    className="h-7 gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    Unlink
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your phone is actively linked to this account for authentication and security verification.
                </p>
              </div>
            ) : (
              /* Not yet linked */
              <div className="space-y-3 pt-1">
                <p className="text-xs text-muted-foreground">
                  Link your mobile phone number to enable SMS OTP sign-in and multi-factor recovery.
                </p>

                {step === "input" ? (
                  <form onSubmit={handleSendOtp} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Phone Number (with Country Code)
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                        disabled={loading}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || !phoneNumber.trim()}
                      className="w-full gap-2 text-xs"
                      size="sm"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Sending OTP…
                        </>
                      ) : (
                        <>
                          <Phone className="h-3.5 w-3.5" />
                          Send Verification OTP
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-muted-foreground">
                          Enter 6-Digit SMS Code
                        </label>
                        <button
                          type="button"
                          onClick={() => setStep("input")}
                          className="text-[11px] text-primary hover:underline"
                        >
                          Change Number
                        </button>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-center font-mono text-base tracking-widest outline-none ring-ring focus:ring-2"
                        disabled={loading}
                        autoFocus
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setStep("input")}
                        disabled={loading}
                        className="flex-1 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading || otpCode.length < 6}
                        size="sm"
                        className="flex-1 gap-2 text-xs"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Verifying…
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Verify & Link
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Helpful tip about Firebase phone testing */}
                <div className="flex items-start gap-2 rounded-lg bg-blue-500/10 p-2.5 text-xs text-blue-600 dark:text-blue-400">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="leading-normal">
                    <strong>Developer Tip:</strong> Firebase Spark tier allows 10 SMS/day. You can add test phone numbers in Firebase Console → Authentication → Sign-in method → Phone (e.g. <code className="font-mono text-[11px]">+91 9999999999</code> with code <code className="font-mono text-[11px]">123456</code>) for unlimited instant testing.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
