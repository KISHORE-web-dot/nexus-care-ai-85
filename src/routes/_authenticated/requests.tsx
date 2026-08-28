import { Link, createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { EmergencyCard } from "@/components/emergency/cards";
import { EmptyState, LoadingState } from "@/components/emergency/states";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAmbulances, useEmergencies, useHospitals } from "@/hooks/useEmergencyData";
import type { Emergency } from "@/lib/types";
import { advanceStatus, rejectAssignment } from "@/services/emergencyService";
import { claimAmbulanceForDriver } from "@/services/ambulanceService";

export const Route = createFileRoute("/_authenticated/requests")({
  head: () => ({
    meta: [
      { title: "Ambulance requests — SmartResponse" },
      { name: "description", content: "Accept dispatch requests and advance the emergency journey step by step." },
      { property: "og:title", content: "Ambulance requests — SmartResponse" },
      { property: "og:description", content: "Driver and paramedic response queue." },
    ],
  }),
  component: RequestsPage,
});

const NEXT_STEPS: { status: string; label: string }[] = [
  { status: "GOING_TO_PATIENT", label: "Start trip to patient" },
  { status: "ARRIVED_AT_PATIENT", label: "Arrived at patient" },
  { status: "PATIENT_ONBOARD", label: "Patient onboard" },
  { status: "GOING_TO_HOSPITAL", label: "Heading to hospital" },
  { status: "ARRIVED_AT_HOSPITAL", label: "Arrived at hospital" },
  { status: "COMPLETED", label: "Complete case" },
];

function RequestsPage() {
  const { user, name } = useAuth();
  const queryClient = useQueryClient();
  const { data: emergencies, isLoading } = useEmergencies();
  const { data: ambulances = [] } = useAmbulances();
  const { data: hospitals = [] } = useHospitals();
  const [busy, setBusy] = useState(false);

  const myAmbulance = ambulances.find((a) => a.driver_id === user?.id) ?? null;

  useEffect(() => {
    if (!user || myAmbulance || !ambulances.length) return;
    void claimAmbulanceForDriver(user.id, name).then(() => queryClient.invalidateQueries({ queryKey: ["ambulances"] }));
  }, [user, name, myAmbulance, ambulances.length, queryClient]);

  const mine = (emergencies ?? []).filter((e) => e.ambulance_id && e.ambulance_id === myAmbulance?.id);
  const incoming = mine.filter((e) => e.status === "AMBULANCE_ASSIGNED");
  const active = mine.filter(
    (e) => e.status !== "AMBULANCE_ASSIGNED" && e.status !== "COMPLETED" && e.status !== "CANCELLED",
  );
  const done = mine.filter((e) => e.status === "COMPLETED");

  const run = async (fn: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try {
      await fn();
      queryClient.invalidateQueries();
      toast.success(message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const nextFor = (e: Emergency) => {
    if (e.status === "DRIVER_ACCEPTED") return NEXT_STEPS[0]!;
    const i = NEXT_STEPS.findIndex((s) => s.status === e.status);
    return NEXT_STEPS[i + 1] ?? null;
  };

  const renderCard = (e: Emergency, actions: React.ReactNode) => (
    <EmergencyCard
      key={e.id}
      emergency={e}
      ambulance={myAmbulance}
      hospital={hospitals.find((h) => h.id === e.hospital_id) ?? null}
      action={actions}
    />
  );

  if (isLoading) {
    return (
      <AppShell title="Emergency requests">
        <LoadingState label="Loading requests…" />
      </AppShell>
    );
  }

  return (
    <AppShell title="Emergency requests">
      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Incoming requests ({incoming.length})
          </h2>
          {incoming.length ? (
            incoming.map((e) =>
              renderCard(
                e,
                <div className="flex gap-2">
                  <Button
                    disabled={busy}
                    onClick={() => run(() => advanceStatus(e, "DRIVER_ACCEPTED", user?.id), "Request accepted")}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => run(() => rejectAssignment(e, myAmbulance!.id), "Request rejected")}
                  >
                    Reject
                  </Button>
                </div>,
              ),
            )
          ) : (
            <EmptyState title="No pending requests" description="New dispatches appear here instantly." />
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Active trip ({active.length})</h2>
          {active.length ? (
            active.map((e) => {
              const next = nextFor(e);
              return renderCard(
                e,
                <div className="flex flex-wrap gap-2">
                  {next ? (
                    <Button
                      disabled={busy}
                      onClick={() => run(() => advanceStatus(e, next.status, user?.id), next.label)}
                    >
                      {next.label}
                    </Button>
                  ) : null}
                  <Button asChild variant="outline">
                    <Link to="/live">Live map</Link>
                  </Button>
                </div>,
              );
            })
          ) : (
            <EmptyState title="No active trip" description="Accept a request to begin the response journey." />
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Completed ({done.length})</h2>
          {done.slice(0, 5).map((e) =>
            renderCard(
              e,
              <Button asChild variant="outline">
                <Link to="/emergency/$id" params={{ id: e.id }}>
                  View record
                </Link>
              </Button>,
            ),
          )}
        </section>
      </div>
    </AppShell>
  );
}
