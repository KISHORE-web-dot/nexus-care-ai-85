import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { handleFirestoreError, OperationType } from "@/lib/firestoreErrors";
import type { TimelineEvent } from "@/lib/types";

/** Every meaningful action is written to the shared emergency timeline (audit log). */
export async function addTimelineEvent(
  emergencyId: string,
  event: string,
  description?: string,
  userId?: string,
) {
  const id = `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const item: TimelineEvent = {
    id,
    emergency_id: emergencyId,
    event,
    description: description ?? null,
    user_id: userId ?? null,
    created_at: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, "emergency_timeline", id), item);
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.CREATE, `emergency_timeline/${id}`);
    } catch {
      // Non-blocking log write
    }
  }
}

export const timelineService = { addTimelineEvent };
