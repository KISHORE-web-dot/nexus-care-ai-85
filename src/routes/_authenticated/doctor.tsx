import { Link, createFileRoute } from "@tanstack/react-router";
import { Activity, HeartPulse, Stethoscope, Users } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { PriorityBadge, StatusBadge } from "@/components/emergency/badges";
import { StatsCard } from "@/components/emergency/StatsCard";
import { EmptyState, LoadingState } from "@/components/emergency/states";
import { Button } from "@/components/ui/button";
import { useAmbulances, useEmergencies, useHospitals } from "@/hooks/useEmergencyData";

export const Route = createFileRoute("/_authenticated/doctor")({
  head: () => ({
    meta: [
      { title: "Doctor console — SmartResponse" },
      {
        name: "description",
        content: "Review incoming patients, AI triage notes and vital context before arrival.",
      },
      { property: "og:title", content: "Doctor console — SmartResponse" },
      {
        property: "og:description",
        content: "Pre-arrival patient briefing for emergency doctors.",
      },
    ],
  }),
  component: DoctorPage,
});

function DoctorPage() {
  const { data: emergencies = [], isLoading } = useEmergencies();
  const { data: hospitals = [] } = useHospitals();
  const { data: ambulances = [] } = useAmbulances();

  const incoming = emergencies.filter((e) => e.status !== "COMPLETED" && e.status !== "CANCELLED");
  const critical = incoming.filter((e) => e.severity === "CRITICAL");

  if (isLoading) {
    return (
      <AppShell title="Doctor console">
        <LoadingState label="Loading patients…" />
      </AppShell>
    );
  }

  return (
    <AppShell title="Doctor console">
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Incoming patients"
            value={incoming.length}
            icon={HeartPulse}
            tone="emergency"
          />
          <StatsCard
            label="Critical cases"
            value={critical.length}
            icon={Activity}
            tone="warning"
          />
          <StatsCard
            label="Treated today"
            value={emergencies.filter((e) => e.status === "COMPLETED").length}
            icon={Users}
          />
          <StatsCard label="Hospitals on network" value={hospitals.length} icon={Stethoscope} />
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Pre-arrival briefings</h2>
          {incoming.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {incoming.map((e) => {
                const hospital = hospitals.find((h) => h.id === e.hospital_id);
                const ambulance = ambulances.find((a) => a.id === e.ambulance_id);
                return (
                  <article key={e.id} className="card-surface space-y-3 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{e.emergency_type}</p>
                      <div className="flex gap-2">
                        <PriorityBadge priority={e.severity} />
                        <StatusBadge status={e.status} />
                      </div>
                    </div>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">Patient</dt>
                        <dd>{e.patient_name ?? "Unknown"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Age / blood</dt>
                        <dd>
                          {e.conditions.age ?? "—"} · {e.conditions.bloodGroup || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Ambulance</dt>
                        <dd>{ambulance?.ambulance_number ?? "Pending"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Destination</dt>
                        <dd>{hospital?.name ?? "Pending"}</dd>
                      </div>
                    </dl>
                    <div>
                      <p className="text-xs text-muted-foreground">AI triage notes</p>
                      <ul className="mt-1 space-y-0.5 text-sm">
                        {e.ai_reasons.slice(0, 4).map((r) => (
                          <li key={r}>• {r}</li>
                        ))}
                      </ul>
                    </div>
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/emergency/$id" params={{ id: e.id }}>
                        Open full case record
                      </Link>
                    </Button>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No incoming patients"
              description="You will be alerted as soon as a case is routed here."
            />
          )}
        </section>
      </div>
    </AppShell>
  );
}
