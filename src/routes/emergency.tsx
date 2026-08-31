/**
 * /emergency — Public emergency entry and SOS workflow route.
 *
 * Accessible without authentication.
 *
 * Patient flow:  selector → sos-button → activation (fully automatic pipeline)
 * Bystander flow: selector → bystander → location → review → submitting → status
 *
 * API: POST /api/emergencies via publicEmergencyService.ts (bystander)
 *      runSOSPipeline via sosService.ts (patient)
 * No Supabase dependency. No authentication required.
 */

import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Phone, Siren } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmergencySelector } from "@/components/emergency/EmergencySelector";
import { SOSButton } from "@/components/emergency/SOSButton";
import { EmergencyActivation } from "@/components/emergency/EmergencyActivation";
import { BystanderSOS } from "@/components/emergency/BystanderSOS";
import { LocationStatus } from "@/components/emergency/LocationStatus";
import { EmergencyReview } from "@/components/emergency/EmergencyReview";
import { EmergencyStatus } from "@/components/emergency/EmergencyStatus";

import { submitEmergency } from "@/services/publicEmergencyService";
import type {
  BystanderFormData,
  EmergencySource,
  LocationCapture,
  PublicEmergency,
  PublicEmergencyPayload,
} from "@/types/emergency";

// ── Route definition ──────────────────────────────────────────────────────────

export const Route = createFileRoute("/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency — SmartResponse" },
      {
        name: "description",
        content: "Request emergency assistance — patient SOS or bystander report.",
      },
      { property: "og:title", content: "Emergency — SmartResponse" },
      { property: "og:description", content: "Fast, guided emergency request workflow." },
    ],
  }),
  component: EmergencyPage,
});

// ── Phase state machine ───────────────────────────────────────────────────────

type Phase =
  | "selector"
  | "sos-button" // Patient: press-and-hold SOS
  | "activation" // Patient: automatic pipeline running / dashboard
  | "bystander" // Bystander: 4-question flow
  | "location" // Bystander: GPS step
  | "review" // Bystander: pre-submit review
  | "submitting" // Bystander: sending
  | "status"; // Bystander: post-submit status

// Progress percentage per phase and source
function computeProgress(phase: Phase, source: EmergencySource | null): number {
  if (source === "PATIENT") {
    const patientPhases: Phase[] = ["selector", "sos-button", "activation"];
    const idx = patientPhases.indexOf(phase);
    if (idx < 0) return 100;
    return Math.round(((idx + 1) / patientPhases.length) * 100);
  }
  const bystanderPhases: Phase[] = [
    "selector",
    "bystander",
    "location",
    "review",
    "submitting",
    "status",
  ];
  const idx = bystanderPhases.indexOf(phase);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / bystanderPhases.length) * 100);
}

// Build the API payload for bystander submissions
function buildBystanderPayload(
  bystanderData: BystanderFormData | null,
  location: LocationCapture,
): PublicEmergencyPayload {
  const consciousMap: Record<BystanderFormData["consciousness"], boolean | null> = {
    YES: true,
    NO: false,
    UNKNOWN: null,
  };

  return {
    source: "BYSTANDER",
    emergencyType: bystanderData?.emergencyType ?? "Unknown",
    conscious: consciousMap[bystanderData?.consciousness ?? "UNKNOWN"],
    peopleAffected: bystanderData?.peopleAffected ?? 1,
    description: bystanderData?.description ?? "",
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
  };
}

// ── Page component ────────────────────────────────────────────────────────────

function EmergencyPage() {
  const [phase, setPhase] = useState<Phase>("selector");
  const [source, setSource] = useState<EmergencySource | null>(null);
  const [bystanderData, setBystanderData] = useState<BystanderFormData | null>(null);
  const [location, setLocation] = useState<LocationCapture | null>(null);
  const [submittedEmergency, setSubmittedEmergency] = useState<PublicEmergency | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const progress = computeProgress(phase, source);
  const hideProgress = phase === "activation" || phase === "status";

  // ── Submit handler (bystander only) ─────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!location) return;
    setPhase("submitting");
    setSubmitError(null);

    try {
      const payload = buildBystanderPayload(bystanderData, location);
      const result = await submitEmergency(payload);
      setSubmittedEmergency(result);
      setPhase("status");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "An unexpected error occurred. Please try again.",
      );
      setPhase("review");
    }
  }, [bystanderData, location]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* ── Public header ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          {phase === "selector" ? (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-8 w-8 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <Link to="/">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -ml-2 text-muted-foreground hover:text-foreground"
              onClick={() => {
                if (phase === "sos-button" || phase === "bystander") setPhase("selector");
                else if (phase === "location") setPhase("bystander");
                else if (phase === "review") setPhase("location");
                else if (phase === "activation") setPhase("sos-button");
                else setPhase("selector");
              }}
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}
          <Link
            to="/"
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-emergency text-emergency-foreground">
              <Siren className="size-4" aria-hidden />
            </span>
            <span className="font-semibold text-sm">SmartResponse</span>
          </Link>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">Real emergency?</span>
            <strong>Call 112 / 911</strong>
          </div>
        </div>
        {/* Progress bar — hidden on activation/status screens */}
        {!hideProgress && (
          <Progress
            value={progress}
            className="h-0.5 rounded-none"
            aria-label="Emergency request progress"
          />
        )}
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-lg px-4 py-6 space-y-5">
        {/* Emergency number reminder (selector screen only) */}
        {phase === "selector" && (
          <div
            role="note"
            className="flex items-start gap-3 rounded-xl border border-emergency/30 bg-emergency/5 px-4 py-3 text-sm"
          >
            <Phone className="mt-0.5 size-4 shrink-0 text-emergency" aria-hidden />
            <p className="text-muted-foreground">
              <strong className="text-emergency">Real emergency?</strong> Call your local emergency
              number (112 / 911) immediately. This system is an educational prototype.
            </p>
          </div>
        )}

        {/* ── Selector ───────────────────────────────────────────────────── */}
        {phase === "selector" && (
          <EmergencySelector
            onSelect={(type) => {
              const src: EmergencySource = type === "patient" ? "PATIENT" : "BYSTANDER";
              setSource(src);
              setPhase(type === "patient" ? "sos-button" : "bystander");
            }}
          />
        )}

        {/* ── Patient: SOS Button ────────────────────────────────────────── */}
        {phase === "sos-button" && (
          <div className="flex flex-col items-center gap-8 py-8">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Emergency SOS</h1>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Press and hold the SOS button to activate emergency assistance. Your location will
                be automatically detected and help will be coordinated.
              </p>
            </div>

            <SOSButton onActivate={() => setPhase("activation")} />

            <button
              type="button"
              onClick={() => setPhase("selector")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to options
            </button>
          </div>
        )}

        {/* ── Patient: Activation (automatic pipeline) ────────────────────── */}
        {phase === "activation" && <EmergencyActivation onBack={() => setPhase("sos-button")} />}

        {/* ── Bystander questions ─────────────────────────────────────────── */}
        {phase === "bystander" && (
          <BystanderSOS
            onComplete={(data) => {
              setBystanderData(data);
              setPhase("location");
            }}
            onBack={() => setPhase("selector")}
          />
        )}

        {/* ── Bystander: Location detection ───────────────────────────────── */}
        {phase === "location" && (
          <LocationStatus
            onLocationCaptured={(loc) => {
              setLocation(loc);
              setPhase("review");
            }}
            onBack={() => setPhase("bystander")}
          />
        )}

        {/* ── Bystander: Review ───────────────────────────────────────────── */}
        {phase === "review" && source && location && (
          <EmergencyReview
            source={source}
            bystanderData={bystanderData}
            location={location}
            onSubmit={() => {
              void handleSubmit();
            }}
            onCancel={() => setPhase("location")}
            submitError={submitError}
          />
        )}

        {/* ── Bystander: Submitting (loading) ─────────────────────────────── */}
        {phase === "submitting" && (
          <div
            className="flex flex-col items-center justify-center gap-5 py-20"
            role="status"
            aria-live="polite"
          >
            <span className="grid size-20 place-items-center rounded-full bg-emergency/10">
              <Loader2 className="size-10 animate-spin text-emergency" aria-hidden />
            </span>
            <div className="text-center space-y-1">
              <p className="text-lg font-bold">Sending emergency request…</p>
              <p className="text-sm text-muted-foreground">
                Please do not close or refresh this page.
              </p>
            </div>
          </div>
        )}

        {/* ── Bystander: Status (post-submission) ─────────────────────────── */}
        {phase === "status" && submittedEmergency && location && (
          <EmergencyStatus emergency={submittedEmergency} location={location} />
        )}
      </main>
    </div>
  );
}
