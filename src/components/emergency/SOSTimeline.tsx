/**
 * SOSTimeline — dynamic timeline for the automatic SOS pipeline.
 *
 * Renders each pipeline step as done/active/pending/failed/skipped
 * with timestamps where available. Used both during the pipeline run
 * and in the final patient dashboard.
 */
import { AlertTriangle, CheckCircle2, Circle, Clock, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepState } from "@/services/sosService";
import { STEP_LABELS } from "@/services/sosService";

interface Props {
  steps: StepState[];
}

const ICONS = {
  done: CheckCircle2,
  active: Circle,
  pending: Clock,
  failed: AlertTriangle,
  skipped: SkipForward,
} as const;

const ICON_STYLES = {
  done: "text-success",
  active: "text-primary animate-pulse fill-primary/20",
  pending: "text-muted-foreground/40",
  failed: "text-emergency",
  skipped: "text-warning",
} as const;

export function SOSTimeline({ steps }: Props) {
  return (
    <ol className="relative space-y-4 pl-7" aria-label="SOS emergency status timeline">
      {/* Vertical connector */}
      <span className="absolute top-2 bottom-2 left-[11px] w-px bg-border" aria-hidden />

      {steps.map((s, i) => {
        const Icon = ICONS[s.status];
        const iconStyle = ICON_STYLES[s.status];
        const label = STEP_LABELS[s.step] ?? s.step;
        const dim = s.status === "pending";

        return (
          <li key={i} className={cn("relative", dim && "opacity-35")}>
            {/* Icon */}
            <span className="absolute top-0.5 -left-7">
              <Icon className={cn("size-5", iconStyle)} aria-label={s.status} />
            </span>

            {/* Label */}
            <p
              className={cn(
                "text-sm font-semibold leading-tight",
                s.status === "done" && "text-foreground",
                s.status === "active" && "text-primary",
                s.status === "failed" && "text-emergency",
                s.status === "skipped" && "text-warning",
                s.status === "pending" && "text-muted-foreground",
              )}
            >
              {label}
              {s.status === "active" && "…"}
            </p>

            {/* Error / skip message */}
            {s.error && (
              <p className={cn(
                "mt-0.5 text-xs",
                s.status === "failed" ? "text-emergency/80" : "text-warning/80",
              )}>
                {s.error}
              </p>
            )}

            {/* Timestamp */}
            {s.timestamp && (
              <p className="mt-0.5 text-[10px] text-muted-foreground/60 font-mono">
                {new Date(s.timestamp).toLocaleTimeString()}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

