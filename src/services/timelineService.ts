import { supabase } from "@/integrations/supabase/client";

/** Every meaningful action is written to the shared emergency timeline (audit log). */
export async function addTimelineEvent(
  emergencyId: string,
  event: string,
  description?: string,
  userId?: string,
) {
  const { error } = await supabase.from("emergency_timeline").insert({
    emergency_id: emergencyId,
    event,
    description: description ?? null,
    user_id: userId ?? null,
  } as never);
  if (error) console.error("timeline write failed", error.message);
}

export const timelineService = { addTimelineEvent };
