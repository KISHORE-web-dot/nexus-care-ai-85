import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  History as HistoryIcon,
  Hospital,
  MapPin,
  Search,
  ShieldAlert,
  Siren,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { StatsCard } from "@/components/emergency/StatsCard";
import { EmptyState, LoadingState } from "@/components/emergency/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useAmbulances, useEmergencies, useHospitals } from "@/hooks/useEmergencyData";
import type { Emergency, Severity } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Emergency History — SmartResponse" },
      {
        name: "description",
        content: "Archive and audit log of past emergency dispatches, responses, and outcomes.",
      },
      { property: "og:title", content: "Emergency History — SmartResponse" },
      {
        property: "og:description",
        content: "Complete incident history and emergency dispatch logs.",
      },
    ],
  }),
  component: HistoryPage,
});

const SEVERITY_TONES: Record<Severity, string> = {
  CRITICAL: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
  HIGH: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  MEDIUM: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  LOW: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",
};

function HistoryPage() {
  const { user, role } = useAuth();
  const { data: emergencies = [], isLoading } = useEmergencies();
  const { data: ambulances = [] } = useAmbulances();
  const { data: hospitals = [] } = useHospitals();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  // If patient, prioritize their own incidents or all incidents if admin/doctor
  const relevantEmergencies =
    role === "PATIENT" && user?.id
      ? emergencies.filter((e) => e.reported_by === user.id || !e.reported_by)
      : emergencies;

  const totalIncidents = relevantEmergencies.length;
  const completedIncidents = relevantEmergencies.filter((e) => e.status === "COMPLETED").length;
  const cancelledIncidents = relevantEmergencies.filter((e) => e.status === "CANCELLED").length;
  const criticalCount = relevantEmergencies.filter((e) => e.severity === "CRITICAL").length;

  const filtered = relevantEmergencies.filter((e) => {
    const matchesSearch =
      (e.emergency_type || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.address || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.id || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "COMPLETED" && e.status === "COMPLETED") ||
      (statusFilter === "CANCELLED" && e.status === "CANCELLED") ||
      (statusFilter === "ACTIVE" && e.status !== "COMPLETED" && e.status !== "CANCELLED");

    const matchesSeverity = severityFilter === "ALL" || e.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const getAmbulanceName = (id: string | null) => {
    if (!id) return "None assigned";
    const amb = ambulances.find((a) => a.id === id);
    return amb ? `${amb.ambulance_number} (${amb.ambulance_type})` : id;
  };

  const getHospitalName = (id: string | null) => {
    if (!id) return "None selected";
    const h = hospitals.find((item) => item.id === id);
    return h ? h.name : id;
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Recent";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <AppShell title="Emergency History">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Emergency Incident Log</h2>
          <p className="text-sm text-muted-foreground">
            Complete audit trail of reported emergencies, hospital handoffs, and dispatch outcomes.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Dispatches"
            value={totalIncidents}
            subtitle="Recorded in system"
            icon={Siren}
            tone="default"
          />
          <StatsCard
            title="Completed Hand-offs"
            value={completedIncidents}
            subtitle="Successfully transported"
            icon={CheckCircle2}
            tone="success"
          />
          <StatsCard
            title="Critical Cases"
            value={criticalCount}
            subtitle="Priority 1 triage"
            icon={ShieldAlert}
            tone={criticalCount > 0 ? "critical" : "default"}
          />
          <StatsCard
            title="Cancelled Requests"
            value={cancelledIncidents}
            subtitle="False alarm / user cancel"
            icon={XCircle}
            tone="default"
          />
        </div>

        {/* Filters and search */}
        <div className="card-surface space-y-4 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by incident ID, symptom, address, or type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Status:</span>
              {(["ALL", "ACTIVE", "COMPLETED", "CANCELLED"] as const).map((st) => (
                <Button
                  key={st}
                  type="button"
                  variant={statusFilter === st ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(st)}
                  className="text-xs h-8"
                >
                  {st === "ALL" ? "All Statuses" : st.charAt(0) + st.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
            <span className="text-xs text-muted-foreground">Severity:</span>
            {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${
                  severityFilter === sev
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Incident Cards */}
        {isLoading ? (
          <LoadingState message="Loading incident history logs..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No emergency records found"
            description={
              totalIncidents === 0
                ? "No emergency dispatches have been recorded in the system yet."
                : "No incidents match your current filter and search criteria."
            }
            icon={HistoryIcon}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((emergency) => {
              const isResolved = emergency.status === "COMPLETED";
              const isCancelled = emergency.status === "CANCELLED";
              const isActive = !isResolved && !isCancelled;

              return (
                <div
                  key={emergency.id}
                  className="card-surface flex flex-col justify-between gap-4 p-4 transition-colors hover:border-primary/40 md:flex-row md:items-center"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded border px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
                          SEVERITY_TONES[emergency.severity] || "bg-muted text-foreground"
                        }`}
                      >
                        {emergency.severity}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          isResolved
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : isCancelled
                              ? "bg-muted text-muted-foreground"
                              : "bg-primary/10 text-primary animate-pulse"
                        }`}
                      >
                        {emergency.status.replace(/_/g, " ")}
                      </span>

                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        {formatDate(emergency.created_at)}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-semibold text-foreground">
                        {emergency.emergency_type || "General Medical Emergency"}
                      </h3>
                      {emergency.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {emergency.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {emergency.address ||
                          `${emergency.latitude.toFixed(4)}, ${emergency.longitude.toFixed(4)}`}
                      </span>

                      <span className="flex items-center gap-1">
                        <Siren className="size-3 text-emergency" />
                        Ambulance: {getAmbulanceName(emergency.ambulance_id)}
                      </span>

                      <span className="flex items-center gap-1">
                        <Hospital className="size-3 text-primary" />
                        Hospital: {getHospitalName(emergency.hospital_id)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button asChild size="sm" variant="outline" className="text-xs">
                      <Link to="/emergency/$id" params={{ id: emergency.id }}>
                        <ExternalLink className="size-3.5 mr-1" /> View Timeline
                      </Link>
                    </Button>

                    {isActive && (
                      <Button asChild size="sm" variant="default" className="text-xs">
                        <Link to="/live">Track Live</Link>
                      </Button>
                    )}
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
