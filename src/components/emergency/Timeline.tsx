import { CheckCircle2, Circle } from "lucide-react";

import type { TimelineEvent } from "@/lib/types";
import { EmptyState } from "./states";

const LABELS: Record<string, string> = {
  SOS_RECEIVED: "SOS received",
  AI_ASSESSMENT: "AI assessment completed",
  AMBULANCE_ASSIGNED: "Ambulance assigned",
  AMBULANCE_REJECTED: "Ambulance reassignment",
  DRIVER_ACCEPTED: "Driver accepted",
  GOING_TO_PATIENT: "En route to patient",
  ARRIVED_AT_PATIENT: "Arrived at patient",
  PATIENT_ONBOARD: "Patient picked up",
  HOSPITAL_SELECTED: "Hospital selected",
  HOSPITAL_PREPARED: "Emergency department prepared",
  GOING_TO_HOSPITAL: "Transporting to hospital",
  ARRIVED_AT_HOSPITAL: "Arrived at hospital",
  COMPLETED: "Case completed",
};

export function Timeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) {
    return (
      <EmptyState
        title="No timeline events yet"
        description="Events appear here as the case progresses."
      />
    );
  }

  return (
    <ol className="relative space-y-5 pl-6">
      <span className="absolute top-2 bottom-2 left-[7px] w-px bg-border" aria-hidden />
      {events.map((e, i) => {
        const last = i === events.length - 1;
        return (
          <li key={e.id} className="relative">
            <span className="absolute top-0.5 -left-6 text-primary">
              {last ? (
                <Circle className="size-4 fill-primary/20" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
            </span>
            <p className="text-sm font-medium">{LABELS[e.event] ?? e.event.replace(/_/g, " ")}</p>
            {e.description ? (
              <p className="text-sm text-muted-foreground">{e.description}</p>
            ) : null}
            <time className="text-xs text-muted-foreground" dateTime={e.created_at}>
              {new Date(e.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </li>
        );
      })}
    </ol>
  );
}
