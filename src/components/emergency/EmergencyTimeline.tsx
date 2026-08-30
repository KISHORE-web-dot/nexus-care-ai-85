/**
 * EmergencyTimeline — public SOS status timeline.
 * Shows the fixed initial events (submitted, location, created, finding ambulance)
 * and future pending steps with placeholder styling.
 *
 * Does NOT poll Supabase — designed for the public /emergency route.
 * Future real-time updates will come from the backend via WebSocket or polling.
 */
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicEmergency } from "@/types/emergency";

// ── Timeline step definitions ──────────────────────────────────────────────

type StepState = "done" | "active" | "pending";

interface TStep {
  label: string;
  description?: string;
  state: StepState;
}

function buildSteps(emergency: PublicEmergency): TStep[] {
  // Steps 1–3 are always "done" after a successful submission.
  // Step 4 (finding ambulance) is the active waiting state for CREATED status.
  // All remaining steps are pending until the backend progresses the case.
  const done: TStep[] = [
    {
      label: "Emergency request submitted",
      description: `Source: ${emergency.source === "PATIENT" ? "Patient SOS" : "Bystander report"}`,
      state: "done",
    },
    {
      label: "Location detected",
      description: `${emergency.latitude.toFixed(5)}, ${emergency.longitude.toFixed(5)}${emergency.accuracy > 0 ? ` (±${Math.round(emergency.accuracy)} m)` : ""}`,
      state: "done",
    },
    {
      label: "Emergency case created",
      description: `Case ID: ${emergency.id}`,
      state: "done",
    },
  ];

  const active: TStep = {
    label: "Finding the nearest suitable ambulance",
    description: "Identifying the closest available ambulance for your location…",
    state: "active",
  };

  const pending: TStep[] = [
    { label: "AI priority assessment", state: "pending" },
    { label: "Ambulance dispatched", state: "pending" },
    { label: "Ambulance en route to your location", state: "pending" },
    { label: "Ambulance arrived", state: "pending" },
    { label: "Patient onboard", state: "pending" },
    { label: "Hospital selected and notified", state: "pending" },
    { label: "Arrived at hospital", state: "pending" },
    { label: "Emergency completed", state: "pending" },
  ];

  return [...done, active, ...pending];
}

// ── Component ──────────────────────────────────────────────────────────────

export function EmergencyTimeline({ emergency }: { emergency: PublicEmergency }) {
  const steps = buildSteps(emergency);

  return (
    <ol className="relative space-y-5 pl-7" aria-label="Emergency status timeline">
      {/* Vertical connector line */}
      <span className="absolute top-2 bottom-2 left-[11px] w-px bg-border" aria-hidden />

      {steps.map((step, i) => (
        <li key={i} className={cn("relative", step.state === "pending" && "opacity-35")}>
          {/* Icon */}
          <span className="absolute top-0.5 -left-7">
            {step.state === "done" ? (
              <CheckCircle2 className="size-5 text-success" aria-label="Completed" />
            ) : step.state === "active" ? (
              <Circle className="size-5 animate-pulse fill-primary/20 text-primary" aria-label="In progress" />
            ) : (
              <Clock className="size-5 text-muted-foreground/50" aria-label="Pending" />
            )}
          </span>

          {/* Content */}
          <p
            className={cn(
              "text-sm font-semibold leading-tight",
              step.state === "done" && "text-foreground",
              step.state === "active" && "text-primary",
              step.state === "pending" && "text-muted-foreground",
            )}
          >
            {step.label}
          </p>
          {step.description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

