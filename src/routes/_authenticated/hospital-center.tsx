import { Link, createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BedDouble, HeartPulse, Hospital as HospitalIcon, Stethoscope } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { EmergencyCard } from "@/components/emergency/cards";
import { StatsCard } from "@/components/emergency/StatsCard";
import { EmptyState, LoadingState } from "@/components/emergency/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { handleFirestoreError, OperationType } from "@/lib/firestoreErrors";
import { useAmbulances, useEmergencies, useHospitals } from "@/hooks/useEmergencyData";

export const Route = createFileRoute("/_authenticated/hospital-center")({
  head: () => ({
    meta: [
      { title: "Hospital command centre — SmartResponse" },
      {
        name: "description",
        content: "Track incoming patients and keep bed, ICU and emergency capacity up to date.",
      },
      { property: "og:title", content: "Hospital command centre — SmartResponse" },
      {
        property: "og:description",
        content: "Live incoming patients and hospital resource management.",
      },
    ],
  }),
  component: HospitalCenterPage,
});

function HospitalCenterPage() {
  const queryClient = useQueryClient();
  const { data: hospitals = [], isLoading } = useHospitals();
  const { data: emergencies = [] } = useEmergencies();
  const { data: ambulances = [] } = useAmbulances();
  const [saving, setSaving] = useState<string | null>(null);

  const incoming = emergencies.filter(
    (e) => e.hospital_id && e.status !== "COMPLETED" && e.status !== "CANCELLED",
  );

  const update = async (id: string, patch: Record<string, unknown>) => {
    setSaving(id);
    try {
      await updateDoc(doc(db, "hospitals", id), patch);
      toast.success("Hospital capacity updated");
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, `hospitals/${id}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update hospital");
      }
    } finally {
      setSaving(null);
    }
  };

  if (isLoading) {
    return (
      <AppShell title="Hospital centre">
        <LoadingState label="Loading hospital data…" />
      </AppShell>
    );
  }

  return (
    <AppShell title="Hospital command centre">
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Incoming patients"
            value={incoming.length}
            icon={HeartPulse}
            tone="emergency"
          />
          <StatsCard
            label="Available beds"
            value={hospitals.reduce((s, h) => s + h.available_beds, 0)}
            icon={BedDouble}
          />
          <StatsCard
            label="ICU beds"
            value={hospitals.reduce((s, h) => s + h.icu_beds, 0)}
            icon={Stethoscope}
          />
          <StatsCard label="Connected hospitals" value={hospitals.length} icon={HospitalIcon} />
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Incoming patients</h2>
          {incoming.length ? (
            incoming.map((e) => (
              <EmergencyCard
                key={e.id}
                emergency={e}
                ambulance={ambulances.find((a) => a.id === e.ambulance_id) ?? null}
                hospital={hospitals.find((h) => h.id === e.hospital_id) ?? null}
                action={
                  <Button asChild variant="outline">
                    <Link to="/emergency/$id" params={{ id: e.id }}>
                      Prepare case
                    </Link>
                  </Button>
                }
              />
            ))
          ) : (
            <EmptyState
              title="No incoming patients"
              description="Assigned emergencies will show up here live."
            />
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">Resource management</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {hospitals.map((h) => (
              <div key={h.id} className="card-surface space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{h.name}</p>
                    <p className="text-xs text-muted-foreground">{h.address}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {emergencies.filter((e) => e.hospital_id === h.id).length} cases
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`beds-${h.id}`}>Available beds</Label>
                    <Input
                      id={`beds-${h.id}`}
                      type="number"
                      min={0}
                      defaultValue={h.available_beds}
                      onBlur={(e) => update(h.id, { available_beds: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`icu-${h.id}`}>ICU beds</Label>
                    <Input
                      id={`icu-${h.id}`}
                      type="number"
                      min={0}
                      defaultValue={h.icu_beds}
                      onBlur={(e) => update(h.id, { icu_beds: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor={`er-${h.id}`}>Emergency department accepting</Label>
                  <Switch
                    id={`er-${h.id}`}
                    checked={h.emergency_available}
                    disabled={saving === h.id}
                    onCheckedChange={(v) => update(h.id, { emergency_available: v })}
                  />
                </div>
                <ul className="flex flex-wrap gap-1.5">
                  {h.specializations.map((s) => (
                    <li
                      key={s}
                      className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
