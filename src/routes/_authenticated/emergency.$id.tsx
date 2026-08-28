import { Link, createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { PriorityBadge, StatusBadge } from "@/components/emergency/badges";
import { LiveMap, type MapMarker } from "@/components/emergency/LiveMap";
import { Timeline } from "@/components/emergency/Timeline";
import { EmptyState, LoadingState } from "@/components/emergency/states";
import { Button } from "@/components/ui/button";
import { useAmbulances, useEmergencies, useHospitals, useTimeline } from "@/hooks/useEmergencyData";

export const Route = createFileRoute("/_authenticated/emergency/$id")({
  head: () => ({
    meta: [
      { title: "Emergency case record — SmartResponse" },
      { name: "description", content: "Complete emergency record: AI triage, dispatch, hospital and full timeline." },
      { property: "og:title", content: "Emergency case record — SmartResponse" },
      { property: "og:description", content: "Auditable record of a single emergency response." },
    ],
  }),
  component: EmergencyDetailPage,
});

function EmergencyDetailPage() {
  const { id } = Route.useParams();
  const { data: emergencies, isLoading } = useEmergencies();
  const { data: ambulances = [] } = useAmbulances();
  const { data: hospitals = [] } = useHospitals();
  const { data: timeline = [] } = useTimeline(id);

  const emergency = emergencies?.find((e) => e.id === id) ?? null;

  if (isLoading) {
    return (
      <AppShell title="Emergency case">
        <LoadingState label="Loading case record…" />
      </AppShell>
    );
  }

  if (!emergency) {
    return (
      <AppShell title="Emergency case">
        <EmptyState
          title="Case not found"
          description="This emergency does not exist or you do not have access to it."
          action={
            <Button asChild className="mt-3">
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const ambulance = ambulances.find((a) => a.id === emergency.ambulance_id) ?? null;
  const hospital = hospitals.find((h) => h.id === emergency.hospital_id) ?? null;

  const markers: MapMarker[] = [
    {
      id: "patient",
      latitude: emergency.latitude,
      longitude: emergency.longitude,
      label: "Patient",
      kind: "patient",
    },
  ];
  if (ambulance)
    markers.push({
      id: ambulance.id,
      latitude: ambulance.latitude,
      longitude: ambulance.longitude,
      label: ambulance.ambulance_number,
      kind: "ambulance",
    });
  if (hospital)
    markers.push({
      id: hospital.id,
      latitude: hospital.latitude,
      longitude: hospital.longitude,
      label: hospital.name.split(" ")[0]!,
      kind: "hospital",
    });

  const conditions = Object.entries(emergency.conditions).filter(([, v]) => v !== undefined && v !== null && v !== "");

  return (
    <AppShell title={`Case ${emergency.id.slice(0, 8).toUpperCase()}`}>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="card-surface space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{emergency.emergency_type}</h2>
              <div className="flex gap-2">
                <PriorityBadge priority={emergency.severity} />
                <StatusBadge status={emergency.status} />
              </div>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">Patient</dt>
                <dd>{emergency.patient_name ?? "Unknown"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Reported</dt>
                <dd>{new Date(emergency.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">AI score</dt>
                <dd>{emergency.ai_score ?? "—"}/100</dd>
              </div>
              <div className="sm:col-span-3">
                <dt className="text-xs text-muted-foreground">Location</dt>
                <dd>
                  {emergency.address ?? "Unknown"} ({emergency.latitude.toFixed(4)}, {emergency.longitude.toFixed(4)})
                </dd>
              </div>
              {emergency.description ? (
                <div className="sm:col-span-3">
                  <dt className="text-xs text-muted-foreground">Description</dt>
                  <dd>{emergency.description}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <LiveMap markers={markers} height={300} />

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="card-surface space-y-2 p-5">
              <h3 className="text-sm font-semibold text-muted-foreground">AI assessment</h3>
              <ul className="space-y-0.5 text-sm">
                {emergency.ai_reasons.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
              <h3 className="pt-3 text-sm font-semibold text-muted-foreground">Reported conditions</h3>
              <ul className="flex flex-wrap gap-1.5">
                {conditions.map(([k, v]) => (
                  <li key={k} className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                    {k.replace(/([A-Z])/g, " $1").toLowerCase()}: {String(v)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-surface space-y-3 p-5">
              <h3 className="text-sm font-semibold text-muted-foreground">Response</h3>
              <p className="text-sm">
                Ambulance: <span className="font-medium">{ambulance?.ambulance_number ?? "Not assigned"}</span>
              </p>
              <p className="text-sm">
                Driver: <span className="font-medium">{ambulance?.driver_name ?? "—"}</span>
              </p>
              <p className="text-sm">
                Hospital: <span className="font-medium">{hospital?.name ?? "Not selected"}</span>
              </p>
              <p className="text-sm">
                ETA: <span className="font-medium">{emergency.eta_minutes ?? "—"} min</span>
              </p>
              {emergency.hospital_reasons.length ? (
                <ul className="space-y-0.5 text-xs text-muted-foreground">
                  {emergency.hospital_reasons.map((r) => (
                    <li key={r}>• {r}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="card-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Timeline</h2>
          <Timeline events={timeline} />
        </aside>
      </div>
    </AppShell>
  );
}
