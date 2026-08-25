import { supabase } from "@/integrations/supabase/client";
import type { AppNotification, AppRole } from "@/lib/types";

export interface NotifyInput {
  userId?: string | null;
  role?: AppRole | null;
  emergencyId?: string | null;
  title: string;
  message?: string;
  type?: "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";
}

/**
 * In-app notification transport. A push transport (e.g. FCM) can be added here
 * later without touching any caller.
 */
export async function notify(input: NotifyInput) {
  const { error } = await supabase.from("notifications").insert({
    user_id: input.userId ?? null,
    role: input.role ?? null,
    emergency_id: input.emergencyId ?? null,
    title: input.title,
    message: input.message ?? null,
    type: input.type ?? "INFO",
  } as never);
  if (error) console.error("notification failed", error.message);
}

export async function notifyMany(items: NotifyInput[]) {
  await Promise.all(items.map(notify));
}

export async function listNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return (data ?? []) as unknown as AppNotification[];
}

export async function markRead(id: string) {
  await supabase.from("notifications").update({ read: true } as never).eq("id", id);
}

export async function markAllRead(ids: string[]) {
  if (!ids.length) return;
  await supabase.from("notifications").update({ read: true } as never).in("id", ids);
}

export const notificationService = { notify, notifyMany, listNotifications, markRead, markAllRead };
