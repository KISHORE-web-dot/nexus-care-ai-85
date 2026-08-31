import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BedDouble,
  Building2,
  CheckCircle2,
  Filter,
  HeartPulse,
  Hospital as HospitalIcon,
  MapPin,
  Phone,
  Search,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";

import { AppShell } from "@/components/layout/AppShell";
import { StatsCard } from "@/components/emergency/StatsCard";
import { EmptyState, LoadingState } from "@/components/emergency/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useHospitals } from "@/hooks/useEmergencyData";
import { db } from "@/lib/firebase";
import { handleFirestoreError, OperationType } from "@/lib/firestoreErrors";
import type { Hospital } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/hospitals")({
  head: () => ({
    meta: [
      { title: "Hospitals Network — SmartResponse" },
      {
        name: "description",
        content:
          "Verified emergency hospital network, real-time bed capacity, and trauma center availability.",
      },
      { property: "og:title", content: "Hospitals Network — SmartResponse" },
      {
        property: "og:description",
        content: "Real-time hospital capacity and emergency trauma center directory.",
      },
    ],
  }),
  component: HospitalsPage,
});

const ALL_SPECIALIZATIONS = [
  "All",
  "Trauma",
  "Cardiology",
  "Neurology",
  "Emergency Medicine",
  "General Surgery",
];

function HospitalsPage() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const { data: hospitals = [], isLoading } = useHospitals();
  const [search, setSearch] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("All");
  const [onlyAvailableIcu, setOnlyAvailableIcu] = useState(false);
  const [onlyEmergency, setOnlyEmergency] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const canManage = role === "ADMIN" || role === "HOSPITAL";

  const totalHospitals = hospitals.length;
  const totalBeds = hospitals.reduce((sum, h) => sum + (h.total_beds || 0), 0);
  const totalAvailableBeds = hospitals.reduce((sum, h) => sum + (h.available_beds || 0), 0);
  const totalIcuBeds = hospitals.reduce((sum, h) => sum + (h.icu_beds || 0), 0);
  const emergencyReady = hospitals.filter((h) => h.emergency_available).length;

  const filteredHospitals = hospitals.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.address.toLowerCase().includes(search.toLowerCase()) ||
      h.specializations.some((s) => s.toLowerCase().includes(search.toLowerCase()));

    const matchesSpec =
      selectedSpec === "All" ||
      h.specializations.some((s) => s.toLowerCase() === selectedSpec.toLowerCase());

    const matchesIcu = !onlyAvailableIcu || (h.icu_beds && h.icu_beds > 0);
    const matchesEmergency = !onlyEmergency || h.emergency_available;

    return matchesSearch && matchesSpec && matchesIcu && matchesEmergency;
  });

  const toggleEmergencyStatus = async (hospital: Hospital) => {
    setUpdatingId(hospital.id);
    try {
      await updateDoc(doc(db, "hospitals", hospital.id), {
        emergency_available: !hospital.emergency_available,
      });
      toast.success(`${hospital.name} emergency status updated`);
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, `hospitals/${hospital.id}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update hospital status");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AppShell title="Hospitals Network">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Emergency Care Network</h2>
          <p className="text-sm text-muted-foreground">
            Live hospital bed occupancy, critical care facilities, and trauma response capabilities.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Network Hospitals"
            value={totalHospitals}
            subtitle={`${emergencyReady} emergency active`}
            icon={Building2}
            tone="default"
          />
          <StatsCard
            title="Available General Beds"
            value={totalAvailableBeds}
            subtitle={`Out of ${totalBeds} total capacity`}
            icon={BedDouble}
            tone="success"
          />
          <StatsCard
            title="ICU Critical Beds"
            value={totalIcuBeds}
            subtitle="Ready for severe trauma"
            icon={HeartPulse}
            tone={totalIcuBeds > 0 ? "default" : "critical"}
          />
          <StatsCard
            title="Emergency Trauma Active"
            value={`${Math.round((emergencyReady / (totalHospitals || 1)) * 100)}%`}
            subtitle={`${emergencyReady} of ${totalHospitals} receiving`}
            icon={Activity}
            tone="default"
          />
        </div>

        {/* Search & Filters */}
        <div className="card-surface space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search hospitals by name, address, or specialization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={onlyAvailableIcu} onCheckedChange={setOnlyAvailableIcu} />
                <span>ICU Beds Available</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={onlyEmergency} onCheckedChange={setOnlyEmergency} />
                <span>Emergency Ready</span>
              </label>
            </div>
          </div>

          {/* Specialization pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mr-1">
              <Filter className="size-3" /> Specialization:
            </span>
            {ALL_SPECIALIZATIONS.map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => setSelectedSpec(spec)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedSpec === spec
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* Hospitals List */}
        {isLoading ? (
          <LoadingState message="Loading hospital network and live bed capacities..." />
        ) : filteredHospitals.length === 0 ? (
          <EmptyState
            title="No matching hospitals found"
            description="Try adjusting your search criteria, filters, or specialization selection."
            icon={HospitalIcon}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredHospitals.map((hospital) => {
              const bedPercent = Math.min(
                100,
                Math.round(((hospital.available_beds || 0) / (hospital.total_beds || 1)) * 100),
              );

              return (
                <div
                  key={hospital.id}
                  className="card-surface flex flex-col justify-between p-5 transition-shadow hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{hospital.name}</h3>
                        </div>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                          <MapPin className="size-3.5 shrink-0" />
                          {hospital.address}
                        </p>
                      </div>
                      <Badge
                        variant={hospital.emergency_available ? "default" : "destructive"}
                        className="shrink-0"
                      >
                        {hospital.emergency_available ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="size-3" /> Emergency Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <XCircle className="size-3" /> Diverting
                          </span>
                        )}
                      </Badge>
                    </div>

                    {/* Capacity Indicators */}
                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Available Beds:</span>
                        <p className="text-sm font-semibold text-foreground mt-0.5">
                          {hospital.available_beds}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            / {hospital.total_beds} total
                          </span>
                        </p>
                        <div className="w-full bg-border rounded-full h-1.5 mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              bedPercent > 25
                                ? "bg-emerald-500"
                                : bedPercent > 10
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                            }`}
                            style={{ width: `${Math.max(5, bedPercent)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground">ICU Beds:</span>
                        <p className="text-sm font-semibold text-foreground mt-0.5">
                          {hospital.icu_beds}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            available
                          </span>
                        </p>
                        <span
                          className={`inline-block mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            (hospital.icu_beds || 0) > 0
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {(hospital.icu_beds || 0) > 0 ? "ICU Ready" : "ICU Full"}
                        </span>
                      </div>
                    </div>

                    {/* Specializations */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {hospital.specializations.map((spec) => (
                        <span
                          key={spec}
                          className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
                        >
                          <Stethoscope className="size-2.5" />
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                    <a
                      href={`tel:${hospital.phone}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      <Phone className="size-3.5" />
                      {hospital.phone}
                    </a>

                    <div className="flex items-center gap-2">
                      {canManage && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === hospital.id}
                          onClick={() => toggleEmergencyStatus(hospital)}
                          className="text-xs h-7"
                        >
                          {hospital.emergency_available ? "Set Divert" : "Set Active"}
                        </Button>
                      )}
                      <Button asChild size="sm" variant="secondary" className="text-xs h-7">
                        <Link to="/live">View Live Map</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
