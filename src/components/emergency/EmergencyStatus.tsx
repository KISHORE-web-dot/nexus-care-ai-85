/**
 * EmergencyStatus — post-submission status screen.
 * Shown after a successful POST /api/emergencies call.
 * Displays the backend-generated emergency ID, key details, and the timeline.
 */
import { CheckCircle2, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmergencyTimeline } from "@/components/emergency/EmergencyTimeline";
import type { LocationCapture, PublicEmergency } from "@/types/emergency";

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  emergency: PublicEmergency;
  location: LocationCapture;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusLabel(s: PublicEmergency["status"]): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function sourceLabel(s: PublicEmergency["source"]): string {
  return s === "PATIENT" ? "Patient SOS" : "Bystander Report";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EmergencyStatus({ emergency, location }: Props) {
  return (
    <div className="space-y-6">
      {/* Success banner */}
      <div className="flex items-start gap-4 rounded-2xl border border-success/30 bg-success/10 p-5">
        <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-success" aria-hidden />
        <div>
          <h1 className="text-xl font-bold text-success">Emergency Request Sent</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your emergency has been received and a response is being coordinated.
          </p>
        </div>
      </div>

      {/* Emergency ID — prominent */}
      <div className="card-surface rounded-xl px-6 py-5 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Emergency ID
        </p>
        <p className="mt-1 text-3xl font-bold font-mono tracking-widest text-foreground">
          {emergency.id}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Keep this ID for reference.</p>
      </div>

      {/* Key details */}
      <div className="card-surface divide-y divide-border rounded-xl overflow-hidden">
        <Detail label="Request source" value={sourceLabel(emergency.source)} />
        <Detail label="Emergency type" value={emergency.emergencyType} />
        <Detail label="Current status" value={statusLabel(emergency.status)} badge />
        <div className="flex items-start gap-3 px-5 py-4">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Location
            </p>
            <p className="mt-0.5 text-sm font-medium">
              {location.source === "gps" ? "Current location (GPS)" : "Manually entered"}
            </p>
            {location.address ? (
              <p className="text-xs text-muted-foreground">{location.address}</p>
            ) : (
              <p className="text-xs font-mono text-muted-foreground">
                {emergency.latitude.toFixed(5)}, {emergency.longitude.toFixed(5)}
              </p>
            )}
          </div>
        </div>
        {emergency.peopleAffected > 1 && (
          <Detail label="People affected" value={`${emergency.peopleAffected} people`} />
        )}
      </div>

      {/* Timeline */}
      <section className="card-surface space-y-4 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Status Timeline
        </h2>
        <EmergencyTimeline emergency={emergency} />
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          The timeline will update as the emergency is processed. Refresh this page or connect to
          the live dashboard for real-time updates.
        </p>
      </section>

      {/* Safety reminder */}
      <div className="flex items-start gap-3 rounded-xl border border-emergency/30 bg-emergency/5 px-4 py-4">
        <Phone className="mt-0.5 size-5 shrink-0 text-emergency" aria-hidden />
        <div className="text-sm">
          <p className="font-semibold text-emergency">Stay safe</p>
          <p className="mt-0.5 text-muted-foreground">
            If the situation worsens, call your local emergency number (112 / 911) immediately. Do
            not rely solely on this application.
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-muted-foreground pb-4">
        This is an educational prototype. Emergency responses shown here use simulated data and are
        not connected to real emergency services.
      </p>
    </div>
  );
}

// ── Detail row ────────────────────────────────────────────────────────────────

function Detail({
  label,
  value,
  badge = false,
}: {
  label: string;
  value: string;
  badge?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {badge ? (
        <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
          {value}
        </span>
      ) : (
        <p className="text-sm font-semibold text-foreground">{value}</p>
      )}
    </div>
  );
}
