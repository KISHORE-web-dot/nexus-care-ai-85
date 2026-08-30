/**
 * BystanderSOS — 4-step bystander question flow.
 * Manages internal sub-steps (Q1–Q4) and calls onComplete() when done.
 *
 * Q1 — Is the person conscious?
 * Q2 — What happened?
 * Q3 — How many people need help?
 * Q4 — Additional information (optional)
 */
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { BystanderFormData, ConsciousnessStatus } from "@/types/emergency";

// ── Constants ───────────────────────────────────────────────────────────────

type SubStep = 1 | 2 | 3 | 4;

const CONSCIOUSNESS_OPTIONS: { value: ConsciousnessStatus; label: string; note?: string }[] = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No", note: "Person reported as unconscious (as reported by bystander — not a medical diagnosis)" },
  { value: "UNKNOWN", label: "Don't Know" },
];

const INCIDENT_TYPES = [
  "Accident",
  "Fall",
  "Breathing Difficulty",
  "Chest Pain",
  "Unresponsive",
  "Injury",
  "Other",
  "Unknown",
] as const;

// ── Props ───────────────────────────────────────────────────────────────────

interface Props {
  onComplete: (data: BystanderFormData) => void;
  onBack: () => void;
}

// ── Component ───────────────────────────────────────────────────────────────

export function BystanderSOS({ onComplete, onBack }: Props) {
  const [subStep, setSubStep] = useState<SubStep>(1);
  const [consciousness, setConsciousness] = useState<ConsciousnessStatus | null>(null);
  const [emergencyType, setEmergencyType] = useState<string | null>(null);
  const [peopleAffected, setPeopleAffected] = useState(1);
  const [description, setDescription] = useState("");

  // ── Navigation ────────────────────────────────────────────────────────────

  const canAdvance =
    (subStep === 1 && consciousness !== null) ||
    (subStep === 2 && emergencyType !== null) ||
    subStep === 3 ||
    subStep === 4;

  const handleNext = () => {
    if (!canAdvance) return;
    if (subStep === 4) {
      onComplete({
        consciousness: consciousness!,
        emergencyType: emergencyType!,
        peopleAffected,
        description,
      });
      return;
    }
    setSubStep((s) => (s + 1) as SubStep);
  };

  const handleBack = () => {
    if (subStep === 1) {
      onBack();
    } else {
      setSubStep((s) => (s - 1) as SubStep);
    }
  };

  // ── Sub-step labels for accessibility ────────────────────────────────────
  const LABELS: Record<SubStep, string> = {
    1: "Is the person conscious?",
    2: "What happened?",
    3: "How many people need help?",
    4: "Additional information",
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6" role="form" aria-label={`Bystander emergency report — step ${subStep} of 4`}>
      {/* Progress dots */}
      <div className="flex gap-1.5" aria-hidden>
        {([1, 2, 3, 4] as SubStep[]).map((s) => (
          <div
            key={s}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              s < subStep ? "bg-success" : s === subStep ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>

      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Step {subStep} of 4
      </p>

      {/* ── Q1: Consciousness ─────────────────────────────────────────────── */}
      {subStep === 1 && (
        <section className="space-y-4" aria-labelledby="q1-heading">
          <div>
            <h2 id="q1-heading" className="text-xl font-bold tracking-tight">
              {LABELS[1]}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select the option that best describes their current state.
            </p>
          </div>
          <div className="grid gap-3">
            {CONSCIOUSNESS_OPTIONS.map(({ value, label, note }) => (
              <button
                key={value}
                type="button"
                onClick={() => setConsciousness(value)}
                aria-pressed={consciousness === value}
                className={cn(
                  "rounded-xl border-2 p-4 text-left transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  consciousness === value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 bg-card",
                )}
              >
                <p className="font-semibold">{label}</p>
                {note && (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{note}</p>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Q2: Incident type ─────────────────────────────────────────────── */}
      {subStep === 2 && (
        <section className="space-y-4" aria-labelledby="q2-heading">
          <div>
            <h2 id="q2-heading" className="text-xl font-bold tracking-tight">
              {LABELS[2]}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Select one option.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {INCIDENT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setEmergencyType(type)}
                aria-pressed={emergencyType === type}
                className={cn(
                  "rounded-xl border-2 p-4 text-sm font-semibold text-left transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  emergencyType === type
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 bg-card",
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Q3: People count ──────────────────────────────────────────────── */}
      {subStep === 3 && (
        <section className="space-y-6" aria-labelledby="q3-heading">
          <div>
            <h2 id="q3-heading" className="text-xl font-bold tracking-tight">
              {LABELS[3]}
            </h2>
          </div>
          <div
            className="flex items-center justify-center gap-8 py-8"
            role="group"
            aria-label="Number of people who need help"
          >
            <button
              type="button"
              onClick={() => setPeopleAffected((n) => Math.max(1, n - 1))}
              disabled={peopleAffected <= 1}
              aria-label="Decrease count"
              className={cn(
                "grid size-14 place-items-center rounded-full border-2 text-2xl font-bold transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                peopleAffected <= 1
                  ? "border-muted text-muted-foreground/40 cursor-not-allowed"
                  : "border-border hover:border-primary hover:bg-primary/5",
              )}
            >
              −
            </button>
            <span
              className="w-16 text-center text-6xl font-bold tabular-nums"
              aria-live="polite"
              aria-atomic
            >
              {peopleAffected}
            </span>
            <button
              type="button"
              onClick={() => setPeopleAffected((n) => n + 1)}
              aria-label="Increase count"
              className={cn(
                "grid size-14 place-items-center rounded-full border-2 text-2xl font-bold transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                "border-border hover:border-primary hover:bg-primary/5",
              )}
            >
              +
            </button>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {peopleAffected === 1 ? "1 person needs help" : `${peopleAffected} people need help`}
          </p>
        </section>
      )}

      {/* ── Q4: Additional info ───────────────────────────────────────────── */}
      {subStep === 4 && (
        <section className="space-y-4" aria-labelledby="q4-heading">
          <div>
            <h2 id="q4-heading" className="text-xl font-bold tracking-tight">
              {LABELS[4]}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Optional — describe anything important that emergency responders should know.
            </p>
          </div>
          <Textarea
            id="bystander-description"
            placeholder="Describe anything important that emergency responders should know."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            maxLength={600}
            aria-label="Additional information for emergency responders"
          />
          <p className="text-right text-xs text-muted-foreground" aria-live="polite">
            {description.length} / 600
          </p>
        </section>
      )}

      {/* ── Navigation buttons ────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-1">
        <Button
          variant="outline"
          onClick={handleBack}
          className="gap-2"
          aria-label={subStep === 1 ? "Back to emergency type selection" : "Back to previous question"}
        >
          <ArrowLeft className="size-4" aria-hidden /> Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canAdvance}
          className="flex-1 gap-2"
          aria-label={subStep === 4 ? "Continue to location detection" : "Next question"}
        >
          {subStep === 4 ? "Continue to Location" : "Next"}
          {subStep < 4 && <ArrowRight className="size-4" aria-hidden />}
        </Button>
      </div>
    </div>
  );
}

