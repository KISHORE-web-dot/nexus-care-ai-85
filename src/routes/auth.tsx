import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Siren } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import type { AppRole } from "@/lib/types";
import { DEMO_ACCOUNTS, resetPassword, signIn, signInDemo, signUp } from "@/services/authService";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({ demo: search["demo"] === "1" ? "1" : undefined }),
  head: () => ({
    meta: [
      { title: "Sign in — SmartResponse Emergency Platform" },
      { name: "description", content: "Sign in or use a demo account to explore the emergency coordination prototype." },
      { property: "og:title", content: "Sign in — SmartResponse" },
      { property: "og:description", content: "Role-based access for patients, drivers, hospitals, doctors and admins." },
    ],
  }),
  component: AuthPage,
});

const ROLES: AppRole[] = ["PATIENT", "DRIVER", "PARAMEDIC", "DOCTOR", "HOSPITAL", "ADMIN"];

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate({ to: "/dashboard", replace: true });
  }, [session, navigate]);

  const go = () => navigate({ to: "/dashboard", replace: true });

  const handleDemo = async (email: string) => {
    const account = DEMO_ACCOUNTS.find((a) => a.email === email)!;
    setBusy(email);
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

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy("login");
    try {
      await signIn(String(form.get("email")), String(form.get("password")));
      toast.success("Welcome back");
      go();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(null);
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setBusy("register");
    try {
      await signUp({
        name: String(form.get("name")),
        email: String(form.get("email")),
        phone: String(form.get("phone")),
        password,
        role: String(form.get("role") || "PATIENT") as AppRole,
      });
      toast.success("Account created");
      go();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setBusy(null);
    }
  };

  const handleReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy("reset");
    try {
      await resetPassword(String(form.get("email")));
      toast.success("If that email exists, a reset link is on the way.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send reset email");
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
          <h2 className="text-3xl font-semibold tracking-tight">One emergency case. Every responder in sync.</h2>
          <p className="mt-3 max-w-md text-navy-foreground/70">
            Patients, drivers, hospitals, doctors and operations staff all act on the same live record —
            from SOS to hospital handover.
          </p>
        </div>
        <p className="text-xs text-navy-foreground/60">
          Educational prototype. AI output is decision support only.
        </p>
      </section>

      <section className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="card-surface p-5">
            <p className="text-sm font-semibold">Use a demo account</p>
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

          <Tabs defaultValue="login" className="card-surface p-5">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
              <TabsTrigger value="forgot">Forgot</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form className="space-y-3" onSubmit={handleLogin}>
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy === "login"}>
                  {busy === "login" ? <Loader2 className="size-4 animate-spin" /> : null} Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form className="space-y-3" onSubmit={handleRegister}>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-name">Full name</Label>
                  <Input id="reg-name" name="name" required maxLength={80} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-phone">Phone</Label>
                    <Input id="reg-phone" name="phone" required maxLength={20} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-role">Role</Label>
                    <Select name="role" defaultValue="PATIENT">
                      <SelectTrigger id="reg-role">
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
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input
                    id="reg-password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy === "register"}>
                  {busy === "register" ? <Loader2 className="size-4 animate-spin" /> : null} Create account
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="forgot">
              <form className="space-y-3" onSubmit={handleReset}>
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input id="forgot-email" name="email" type="email" required />
                </div>
                <Button type="submit" variant="outline" className="w-full" disabled={busy === "reset"}>
                  Send reset link
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
