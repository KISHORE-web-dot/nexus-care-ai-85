import { Link, createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { EmergencyCard } from "@/components/emergency/cards";
import { LiveMap, type MapMarker } from "@/components/emergency/LiveMap";
import { Timeline } from "@/components/emergency/Timeline";
import { EmptyState, LoadingState } from "@/components/emergency/states";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAmbulances, useEmergencies, useHospitals, useTimeline } from "@/hooks/useEmergencyData";
import { distanceKm } from "@/lib/geo";

export const Route = createFileRoute("/_authenticated/live")({
  head: () => ({
    meta: [
      { title: "Live emergency tracking — SmartResponse" },
      {
        name: "description",
        content: "Follow the ambulance, hospital and case timeline in real time.",
      },
      { property: "og:title", content: "Live emergency tracking — SmartResponse" },
      {
        property: "og:description",
        content: "Real-time ambulance position, ETA and status updates.",
      },
    ],
  }),
  component: LivePage,
});

function LivePage() {
  const { user, role } = useAuth();
  const { data: emergencies, isLoading } = useEmergencies();
  const { data: ambulances = [] } = useAmbulances();
  const { data: hospitals = [] } = useHospitals();

  const isResponder = role === "DRIVER" || role === "PARAMEDIC";
  const myAmbulance = ambulances.find((a) => a.driver_id === user?.id);
  const active =
    (isResponder
      ? emergencies?.find(
          (e) =>
            e.ambulance_id === myAmbulance?.id &&
            e.status !== "COMPLETED" &&
            e.status !== "CANCELLED",
        )
      : emergencies?.find(
          (e) => e.reported_by === user?.id && e.status !== "COMPLETED" && e.status !== "CANCELLED",
        )) ?? null;

  const { data: timeline = [] } = useTimeline(active?.id);
  const ambulance = ambulances.find((a) => a.id === active?.ambulance_id) ?? null;
  const hospital = hospitals.find((h) => h.id === active?.hospital_id) ?? null;

  if (isLoading) {
    return (
      <AppShell title="Live emergency">
        <LoadingState label="Loading live case…" />
      </AppShell>
    );
  }

  if (!active) {
    return (
      <AppShell title="Live emergency">
        <EmptyState
          title="No active emergency"
          description="Live tracking appears here as soon as a case is open."
          action={
            <Button asChild className="mt-3">
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const markers: MapMarker[] = [
    {
      id: "patient",
      latitude: active.latitude,
      longitude: active.longitude,
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

  const gap = ambulance ? distanceKm(active, ambulance) : null;

  return (
    <AppShell title="Live emergency tracking">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <LiveMap markers={markers} height={340} />
          <EmergencyCard
            emergency={active}
            ambulance={ambulance}
            hospital={hospital}
            action={
              <Button asChild variant="outline">
                <Link to="/emergency/$id" params={{ id: active.id }}>
                  Full case record
                </Link>
              </Button>
            }
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card-surface p-4">
              <p className="text-xs text-muted-foreground">Ambulance distance</p>
              <p className="text-lg font-semibold">{gap !== null ? `${gap.toFixed(1)} km` : "—"}</p>
            </div>
            <div className="card-surface p-4">
              <p className="text-xs text-muted-foreground">Driver</p>
              <p className="text-lg font-semibold">{ambulance?.driver_name ?? "—"}</p>
            </div>
            <div className="card-surface p-4">
              <p className="text-xs text-muted-foreground">Vehicle</p>
              <p className="text-lg font-semibold">{ambulance?.ambulance_number ?? "—"}</p>
            </div>
          </div>
        </div>

        <aside className="card-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Emergency timeline</h2>
          <Timeline events={timeline} />
        </aside>
      </div>
    </AppShell>
  );
}
