import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { handleFirestoreError, OperationType } from "@/lib/firestoreErrors";
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
 * In-app notification transport backed by Firestore.
 */
export async function notify(input: NotifyInput) {
  const id = `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const item: AppNotification = {
    id,
    user_id: input.userId ?? null,
    role: input.role ?? null,
    emergency_id: input.emergencyId ?? null,
    title: input.title,
    message: input.message ?? null,
    type: input.type ?? "INFO",
    read: false,
    created_at: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, "notifications", id), item);
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.CREATE, `notifications/${id}`);
    } catch {
      // Non-blocking notification write
    }
  }
}

export async function notifyMany(items: NotifyInput[]) {
  await Promise.all(items.map(notify));
}

export async function listNotifications(): Promise<AppNotification[]> {
  try {
    const q = query(collection(db, "notifications"), orderBy("created_at", "desc"), limit(60));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as AppNotification);
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.LIST, "notifications");
    } catch {
      return [];
    }
    return [];
  }
}

export async function markRead(id: string) {
  try {
    await updateDoc(doc(db, "notifications", id), { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
  }
}

export async function markAllRead(ids: string[]) {
  if (!ids.length) return;
  await Promise.all(ids.map((id) => markRead(id)));
}

export const notificationService = {
  notify,
  notifyMany,
  listNotifications,
  markRead,
  markAllRead,
};
