import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BrainCircuit, Loader2, MapPin, Siren } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { AmbulanceCard, HospitalCard } from "@/components/emergency/cards";
import { PriorityBadge } from "@/components/emergency/badges";
import { ErrorState, LoadingState } from "@/components/emergency/states";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useAmbulances, useHospitals, usePatientProfile } from "@/hooks/useEmergencyData";
import { EMERGENCY_TYPES, type Emergency, type EmergencyConditions } from "@/lib/types";
import { assessEmergency, type AIAssessment } from "@/services/aiPriorityService";
import { rankAmbulances, type AmbulanceCandidate } from "@/services/ambulanceService";
import { rankHospitals } from "@/services/hospitalRecommendationService";
import { assignAmbulance, assignHospital, createEmergency } from "@/services/emergencyService";
import { describeLocation, getCurrentLocation } from "@/services/locationService";

export const Route = createFileRoute("/_authenticated/sos")({
  head: () => ({
    meta: [
      { title: "Emergency SOS — SmartResponse" },
      { name: "description", content: "Create an emergency case with GPS location, AI triage and ambulance dispatch." },
      { property: "og:title", content: "Emergency SOS — SmartResponse" },
      { property: "og:description", content: "Request emergency assistance in a guided four-step flow." },
    ],
  }),
  component: SosPage,
  pendingComponent: () => (
    <AppShell title="Emergency SOS">
      <LoadingState label="Loading emergency services…" />
    </AppShell>
  ),
});

type Step = "location" | "form" | "ai" | "dispatch";

const CONDITION_FIELDS: { key: keyof EmergencyConditions; label: string }[] = [
  { key: "breathingDifficulty", label: "Breathing difficulty" },
  { key: "heavyBleeding", label: "Heavy bleeding" },
  { key: "chestPain", label: "Chest pain" },
  { key: "cardiacSymptoms", label: "Heart-related symptoms" },
  { key: "accident", label: "Accident involved" },
  { key: "strokeSymptoms", label: "Stroke symptoms" },
  { key: "severePain", label: "Severe pain" },
];

function SosPage() {
  const { user, name } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: patient } = usePatientProfile(user?.id);
  const { data: ambulances = [] } = useAmbulances();
  const { data: hospitals = [] } = useHospitals();

  const [step, setStep] = useState<Step>("location");
  const [locating, setLocating] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState<string>("");

  const [emergencyType, setEmergencyType] = useState<string>("Road Accident");
  const [conditions, setConditions] = useState<EmergencyConditions>({ conscious: true, injuredCount: 1 });
  const [description, setDescription] = useState("");

  const [assessment, setAssessment] = useState<AIAssessment | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [emergency, setEmergency] = useState<Emergency | null>(null);
  const [candidates, setCandidates] = useState<AmbulanceCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assigned, setAssigned] = useState(false);

  const detect = useCallback(async () => {
    setLocating(true);
    setLocationError(null);
    try {
      const loc = await getCurrentLocation();
      setCoords({ latitude: loc.latitude, longitude: loc.longitude });
      setAddress(await describeLocation(loc));
    } catch (e) {
      setLocationError(e instanceof Error ? e.message : "Unable to automatically detect location.");
    } finally {
      setLocating(false);
    }
  }, []);

  useEffect(() => {
    void detect();
  }, [detect]);

  const runAssessment = async () => {
    if (!coords || !user) return;
    setStep("ai");
    setAnalysing(true);
    const result = assessEmergency({ emergencyType, conditions, description });
    await new Promise((r) => setTimeout(r, 1400));
    setAssessment(result);
    setAnalysing(false);

    try {
      const created = await createEmergency({
        reportedBy: user.id,
        patientId: patient?.id ?? null,
        patientName: patient?.name ?? name,
        emergencyType,
        description,
        conditions,
        latitude: coords.latitude,
        longitude: coords.longitude,
        address,
        assessment: result,
      });
      setEmergency(created);
      queryClient.invalidateQueries({ queryKey: ["emergencies"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the emergency case");
    }
  };

  const findAmbulances = async () => {
    if (!coords || !assessment) return;
    setStep("dispatch");
    setSearching(true);
    await new Promise((r) => setTimeout(r, 1200));
    setCandidates(rankAmbulances(ambulances, coords, assessment.priority));
    setSearching(false);
  };

  const doAssign = async (candidate: AmbulanceCandidate) => {
    if (!emergency || !assessment || !coords) return;
    setAssigning(true);
    try {
      await assignAmbulance(emergency, candidate);
      const recs = rankHospitals(hospitals, coords, emergencyType, assessment.priority);
      if (recs[0]) await assignHospital(emergency, recs[0]);
      setAssigned(true);
      queryClient.invalidateQueries();
      toast.success(`${candidate.ambulance.ambulance_number} dispatched`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  const stepIndex = ["location", "form", "ai", "dispatch"].indexOf(step);

  return (
    <AppShell title="Emergency SOS">
      <div className="mx-auto max-w-3xl space-y-6">
        <Progress value={((stepIndex + 1) / 4) * 100} aria-label="SOS progress" />

        {step === "location" ? (
          <section className="card-surface space-y-4 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <MapPin className="size-5 text-primary" aria-hidden />
              {locating ? "Detecting your location…" : locationError ? "Location needed" : "Location detected ✓"}
            </h2>
            {locating ? <p className="text-sm text-muted-foreground">Requesting GPS permission…</p> : null}
            {locationError ? (
              <div className="space-y-4">
                <ErrorState message={`${locationError} Enter the location manually to continue.`} onRetry={detect} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="lat">Latitude</Label>
                    <Input
                      id="lat"
                      type="number"
                      step="any"
                      onChange={(e) =>
                        setCoords((c) => ({ latitude: Number(e.target.value), longitude: c?.longitude ?? 0 }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lng">Longitude</Label>
                    <Input
                      id="lng"
                      type="number"
                      step="any"
                      onChange={(e) =>
                        setCoords((c) => ({ latitude: c?.latitude ?? 0, longitude: Number(e.target.value) }))
                      }
                    />
                  </div>
                </div>
              </div>
            ) : null}
            {coords ? (
              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted-foreground">Latitude</dt>
                  <dd className="font-medium">{coords.latitude.toFixed(5)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Longitude</dt>
                  <dd className="font-medium">{coords.longitude.toFixed(5)}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-xs text-muted-foreground">Approximate address</dt>
                  <dd className="font-medium">{address || "—"}</dd>
                </div>
              </dl>
            ) : null}
            <Button className="w-full" disabled={!coords} onClick={() => setStep("form")}>
              Continue
            </Button>
          </section>
        ) : null}

        {step === "form" ? (
          <section className="card-surface space-y-5 p-6">
            <h2 className="text-lg font-semibold">Emergency information</h2>
            <div className="space-y-1.5">
              <Label htmlFor="etype">Emergency type</Label>
              <Select value={emergencyType} onValueChange={setEmergencyType}>
                <SelectTrigger id="etype">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMERGENCY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">Patient condition</legend>
              <label className="flex items-center gap-3 text-sm">
                <Checkbox
                  checked={conditions.conscious !== false}
                  onCheckedChange={(v) => setConditions((c) => ({ ...c, conscious: v === true }))}
                />
                Patient is conscious
              </label>
              {CONDITION_FIELDS.map((f) => (
                <label key={String(f.key)} className="flex items-center gap-3 text-sm">
                  <Checkbox
                    checked={Boolean(conditions[f.key])}
                    onCheckedChange={(v) => setConditions((c) => ({ ...c, [f.key]: v === true }))}
                  />
                  {f.label}
                </label>
              ))}
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="injured">Injured people</Label>
                <Input
                  id="injured"
                  type="number"
                  min={1}
                  max={50}
                  value={conditions.injuredCount ?? 1}
                  onChange={(e) => setConditions((c) => ({ ...c, injuredCount: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min={0}
                  max={120}
                  onChange={(e) => setConditions((c) => ({ ...c, age: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="blood">Blood group</Label>
                <Input
                  id="blood"
                  maxLength={4}
                  defaultValue={patient?.blood_group ?? ""}
                  onChange={(e) => setConditions((c) => ({ ...c, bloodGroup: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc">Description (optional)</Label>
              <Textarea
                id="desc"
                maxLength={600}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened? Any landmark nearby?"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("location")}>
                Back
              </Button>
              <Button variant="destructive" className="flex-1" onClick={runAssessment}>
                <Siren className="size-4" aria-hidden /> Submit emergency
              </Button>
            </div>
          </section>
        ) : null}

        {step === "ai" ? (
          <section className="card-surface space-y-4 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <BrainCircuit className="size-5 text-primary" aria-hidden /> AI Emergency Assessment
            </h2>
            {analysing || !assessment ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Analyzing emergency information…
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <PriorityBadge priority={assessment.priority} className="px-3 py-1 text-sm" />
                  <span className="text-sm text-muted-foreground">
                    Score {assessment.score}/100 · confidence {(assessment.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <ul className="space-y-1 text-sm">
                  {assessment.reasons.map((r) => (
                    <li key={r}>• {r}</li>
                  ))}
                </ul>
                <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-xs">
                  AI assessment is decision support only. It does not replace professional medical judgment.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("form")} disabled={analysing}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={findAmbulances}>
                    Find best ambulance
                  </Button>
                </div>
              </>
            )}
          </section>
        ) : null}

        {step === "dispatch" ? (
          <section className="space-y-4">
            <div className="card-surface p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">
                  {searching ? "Searching for suitable ambulance…" : "Ambulance dispatch"}
                </h2>
                {!assigned ? (
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" onClick={() => setStep("ai")} disabled={searching || assigning}>
                      Back
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/dashboard" })} disabled={assigning}>
                      Cancel
                    </Button>
                  </div>
                ) : null}
              </div>
              {searching ? (
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden /> Scoring availability, distance, traffic and
                  vehicle capability…
                </p>
              ) : null}
              {!searching && !candidates.length ? (
                <p className="mt-2 text-sm text-emergency">
                  No ambulance is currently available. Operations has been notified — please retry shortly.
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {candidates.map((c, i) => (
                <AmbulanceCard
                  key={c.ambulance.id}
                  candidate={c}
                  best={i === 0}
                  assigning={assigning}
                  {...(assigned ? {} : { onAssign: () => doAssign(c) })}
                />
              ))}
            </div>

            {assigned && emergency ? (
              <div className="card-surface space-y-4 p-6">
                <p className="font-medium text-success">Ambulance assigned ✓ Hospital recommendation ready</p>
                {(() => {
                  const rec = coords && assessment
                    ? rankHospitals(hospitals, coords, emergencyType, assessment.priority)[0]
                    : null;
                  return rec ? <HospitalCard recommendation={rec} best /> : null;
                })()}
                <Button className="w-full" onClick={() => navigate({ to: "/live" })}>
                  Open live tracking
                </Button>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
