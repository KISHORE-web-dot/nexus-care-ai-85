/**
 * EmergencyReview — pre-submission summary screen.
 * Shows a clean summary of all collected data before the final SEND action.
 */
import { AlertCircle, MapPin, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BystanderFormData, EmergencySource, LocationCapture } from "@/types/emergency";

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  source: EmergencySource;
  bystanderData: BystanderFormData | null;
  location: LocationCapture;
  onSubmit: () => void;
  onCancel: () => void;
  /** Human-readable error from a previous failed submission attempt. */
  submitError?: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function consciousnessLabel(c: BystanderFormData["consciousness"]): string {
  if (c === "YES") return "Conscious";
  if (c === "NO") return "Reported as unconscious (bystander report)";
  return "Unknown / Don't know";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EmergencyReview({ source, bystanderData, location, onSubmit, onCancel, submitError }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Emergency Request</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please review the details below before sending.
        </p>
      </div>

      {/* Summary card */}
      <div className="card-surface divide-y divide-border rounded-2xl overflow-hidden">
        <Row label="Request type" value={source === "PATIENT" ? "I NEED HELP (Patient SOS)" : "HELP SOMEONE (Bystander)"} />

        {source === "BYSTANDER" && bystanderData ? (
          <>
            <Row
              label="Condition"
              value={consciousnessLabel(bystanderData.consciousness)}
              urgent={bystanderData.consciousness === "NO"}
            />
            <Row label="Incident" value={bystanderData.emergencyType} />
            <Row
              label="People affected"
              value={bystanderData.peopleAffected === 1 ? "1 person" : `${bystanderData.peopleAffected} people`}
            />
            {bystanderData.description && (
              <Row label="Additional info" value={bystanderData.description} multiline />
            )}
          </>
        ) : (
          <Row label="Emergency type" value="Personal SOS — all details to be assessed on scene" />
        )}

        <div className="flex items-start gap-3 px-5 py-4">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Location</p>
            <p className="mt-0.5 text-sm font-medium">
              {location.source === "gps" ? "📍 Current location detected" : "📍 Manually entered location"}
            </p>
            {location.address ? (
              <p className="text-xs text-muted-foreground">{location.address}</p>
            ) : (
              <p className="text-xs font-mono text-muted-foreground">
                {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </p>
            )}
            {location.accuracy > 0 && (
              <p className="text-xs text-muted-foreground">± {Math.round(location.accuracy)} m</p>
            )}
          </div>
        </div>
      </div>

      {/* Safety disclaimer */}
      <p className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-xs text-warning-foreground">
        ⚠️ This is an educational prototype — not a certified emergency service. For real emergencies,
        always call your local emergency number (112 / 911) immediately.
      </p>

      {/* Previous submission error */}
      {submitError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-emergency/40 bg-emergency/5 px-4 py-3"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-emergency" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-emergency">Submission failed</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{submitError}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button
          variant="destructive"
          size="lg"
          onClick={onSubmit}
          className="w-full gap-2 py-6 text-base font-bold"
          aria-label="Send emergency request"
        >
          <Send className="size-5" aria-hidden />
          🚨 SEND EMERGENCY REQUEST
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full"
          aria-label="Cancel and go back to location step"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Row sub-component ─────────────────────────────────────────────────────────

function Row({
  label,
  value,
  urgent = false,
  multiline = false,
}: {
  label: string;
  value: string;
  urgent?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p
          className={`mt-0.5 text-sm font-semibold ${urgent ? "text-emergency" : "text-foreground"} ${multiline ? "whitespace-pre-wrap" : ""}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

