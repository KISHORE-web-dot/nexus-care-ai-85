import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/types";

export interface DemoAccount {
  role: AppRole;
  email: string;
  name: string;
  label: string;
}

/** Demo identities used for the walkthrough. Credentials are never rendered in the UI. */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: "PATIENT", email: "patient@demo.emergency.app", name: "Anitha Raman", label: "Patient Demo" },
  { role: "DRIVER", email: "driver@demo.emergency.app", name: "Ravi Kumar", label: "Driver Demo" },
  { role: "HOSPITAL", email: "hospital@demo.emergency.app", name: "Aravind Control Desk", label: "Hospital Demo" },
  { role: "DOCTOR", email: "doctor@demo.emergency.app", name: "Dr. Meera Nair", label: "Doctor Demo" },
  { role: "ADMIN", email: "admin@demo.emergency.app", name: "Operations Admin", label: "Admin Demo" },
];

const DEMO_SECRET = "Demo#Emergency2026";

export async function ensureProfile(userId: string, name: string, email: string, phone: string | null, role: AppRole) {
  await supabase.from("profiles").upsert({ id: userId, name, email, phone } as never);
  await supabase.from("user_roles").upsert({ user_id: userId, role } as never, {
    onConflict: "user_id,role",
    ignoreDuplicates: true,
  } as never);
  if (role === "PATIENT") {
    const { data } = await supabase.from("patients").select("id").eq("user_id", userId).maybeSingle();
    if (!data) {
      await supabase.from("patients").insert({ user_id: userId, name, phone } as never);
    }
  }
}

export async function signUp(params: {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: AppRole;
}) {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      emailRedirectTo: `${window.location.origin}/dashboard`,
      data: { name: params.name, phone: params.phone, role: params.role },
    },
  });
  if (error) throw error;
  if (data.user && data.session) {
    await ensureProfile(data.user.id, params.name, params.email, params.phone, params.role);
  }
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInDemo(account: DemoAccount) {
  let result = await supabase.auth.signInWithPassword({
    email: account.email,
    password: DEMO_SECRET,
  });
  if (result.error) {
    const { error: signUpError } = await supabase.auth.signUp({
      email: account.email,
      password: DEMO_SECRET,
      options: { data: { name: account.name, role: account.role } },
    });
    if (signUpError && !signUpError.message.toLowerCase().includes("already")) throw signUpError;
    result = await supabase.auth.signInWithPassword({ email: account.email, password: DEMO_SECRET });
    if (result.error) throw result.error;
  }
  const user = result.data.user;
  if (user) await ensureProfile(user.id, account.name, account.email, "+91 90000 0000", account.role);
  return result.data;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function fetchRole(userId: string): Promise<AppRole | null> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).limit(1).maybeSingle();
  return ((data as { role: AppRole } | null)?.role as AppRole) ?? null;
}

export const authService = { signUp, signIn, signInDemo, resetPassword, fetchRole, ensureProfile, DEMO_ACCOUNTS };
