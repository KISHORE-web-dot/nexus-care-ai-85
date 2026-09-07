import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, Siren } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import type { AppRole } from "@/lib/types";
import {
  DEMO_ACCOUNTS,
  formatAuthErrorMessage,
  signInDemo,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/services/authService";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — SmartResponse Emergency Platform" },
      {
        name: "description",
        content:
          "Sign in with Email, Google, or use a demo account to explore the emergency coordination prototype.",
      },
      { property: "og:title", content: "Sign in — SmartResponse" },
      {
        property: "og:description",
        content: "Role-based access for patients, drivers, hospitals, doctors and admins.",
      },
    ],
  }),
  component: AuthPage,
});

const ROLES: AppRole[] = ["PATIENT", "DRIVER", "PARAMEDIC", "DOCTOR", "HOSPITAL", "ADMIN"];

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("PATIENT");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  const go = () => navigate({ to: "/dashboard", replace: true });

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      toast.error("Please enter your email address");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }
    if (isSignUp && password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setBusy("email");
    try {
      if (isSignUp) {
        await signUpWithEmail(cleanEmail, password, selectedRole, fullName);
        toast.success(`Account created as ${selectedRole}`);
      } else {
        await signInWithEmail(cleanEmail, password, selectedRole);
        toast.success("Signed in successfully");
      }
      go();
    } catch (err) {
      toast.error(formatAuthErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleDemo = async (demoEmail: string) => {
    const account = DEMO_ACCOUNTS.find((a) => a.email === demoEmail)!;
    setBusy(demoEmail);
    try {
      await signInDemo(account);
      toast.success(`Signed in as ${account.label}`);
      go();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Demo sign-in failed");
    } finally {
      setBusy(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setBusy("google");
    try {
      await signInWithGoogle(selectedRole);
      toast.success("Signed in with Google");
      go();
    } catch (e) {
      toast.error(formatAuthErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-navy p-10 text-navy-foreground lg:flex">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-emergency text-emergency-foreground">
            <Siren className="size-5" aria-hidden />
          </span>
          <span className="font-semibold">SmartResponse</span>
        </div>
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">
            One emergency case. Every responder in sync.
          </h2>
          <p className="mt-3 max-w-md text-navy-foreground/70">
            Patients, drivers, hospitals, doctors and operations staff all act on the same live
            record — from SOS to hospital handover powered by Firebase.
          </p>
        </div>
        <p className="text-xs text-navy-foreground/60">
          Educational prototype. AI output is decision support only.
        </p>
      </section>

      <section className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center justify-between">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <Link to="/">
                <ArrowLeft className="size-4" />
                Back to Home
              </Link>
            </Button>
          </div>

          <div className="card-surface p-5 space-y-4">
            <div>
              <p className="text-base font-semibold">
                {isSignUp ? "Create an account" : "Sign in to your account"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isSignUp
                  ? "Enter your email and password to register a new portal account."
                  : "Enter your email and password to access the emergency platform."}
              </p>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {isSignUp && (
                <div className="space-y-1.5">
                  <Label htmlFor="auth-name">Full Name</Label>
                  <Input
                    id="auth-name"
                    type="text"
                    placeholder="e.g. Dr. Jane Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!!busy}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="auth-email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="auth-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                    autoComplete="email"
                    disabled={!!busy}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auth-password">Password</Label>
                  {isSignUp && (
                    <span className="text-[11px] text-muted-foreground">Min. 6 characters</span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9"
                    required
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    disabled={!!busy}
                  />
                  <button
                    type="button"
                    id="btn-toggle-password-visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="auth-role">Select your portal role</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(val) => setSelectedRole(val as AppRole)}
                  disabled={!!busy}
                >
                  <SelectTrigger id="auth-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                id="btn-submit-email-auth"
                type="submit"
                className="w-full gap-2"
                disabled={!!busy}
              >
                {busy === "email" ? <Loader2 className="size-4 animate-spin" /> : null}
                {isSignUp ? "Create Account" : "Sign in with Email"}
              </Button>

              <div className="text-center pt-0.5">
                <button
                  id="btn-toggle-auth-mode"
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                >
                  {isSignUp
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Create one"}
                </button>
              </div>
            </form>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              id="btn-google-auth"
              type="button"
              variant="outline"
              className="w-full gap-2"
              disabled={!!busy}
              onClick={handleGoogleSignIn}
            >
              {busy === "google" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <svg className="size-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              Continue with Google
            </Button>
          </div>

          <div className="card-surface p-5">
            <p className="text-sm font-semibold">Or use a demo account</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Instantly enter any role-based dashboard with pre-seeded demo data.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <Button
                  key={a.email}
                  variant="outline"
                  size="sm"
                  disabled={!!busy}
                  onClick={() => handleDemo(a.email)}
                >
                  {busy === a.email ? <Loader2 className="size-4 animate-spin" /> : null}
                  {a.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
