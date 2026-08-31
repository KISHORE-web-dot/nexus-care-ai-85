import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Ambulance as AmbulanceIcon,
  BedDouble,
  Building2,
  CheckCircle2,
  Clock,
  Hospital as HospitalIcon,
  MapPin,
  Siren,
  Stethoscope,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { EmergencyCard } from "@/components/emergency/cards";
import { PriorityBadge, StatusBadge } from "@/components/emergency/badges";
import { StatsCard } from "@/components/emergency/StatsCard";
import { EmptyState, LoadingState } from "@/components/emergency/states";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  activeEmergencyOf,
  useAmbulances,
  useEmergencies,
  useHospitals,
  usePatientProfile,
} from "@/hooks/useEmergencyData";
import { getCurrentLocation } from "@/services/locationService";
import { buildAnalytics } from "@/services/analyticsService";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SmartResponse" },
      { name: "description", content: "Role-based emergency coordination dashboard." },
      { property: "og:title", content: "Dashboard — SmartResponse" },
      { property: "og:description", content: "Live emergency status for your role." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { role } = useAuth();
  const title =
    role === "ADMIN"
      ? "Emergency Operations Center"
      : role === "HOSPITAL"
        ? "Hospital Emergency Control Center"
        : role === "DRIVER" || role === "PARAMEDIC"
          ? "Ambulance Control"
          : role === "DOCTOR"
            ? "Clinical Dashboard"
            : "Emergency Assistance";

  return (
    <AppShell title={title}>
      {role === "ADMIN" ? <AdminSummary /> : null}
      {role === "HOSPITAL" ? <HospitalSummary /> : null}
      {role === "DOCTOR" ? <DoctorSummary /> : null}
      {role === "DRIVER" || role === "PARAMEDIC" ? <DriverSummary /> : null}
      {!role || role === "PATIENT" ? <PatientDashboard /> : null}
    </AppShell>
  );
}

function PatientDashboard() {
  const { user } = useAuth();
  const { data: emergencies, isLoading } = useEmergencies();
  const { data: ambulances = [] } = useAmbulances();
  const { data: hospitals = [] } = useHospitals();
  const { data: patient } = usePatientProfile(user?.id);
  const [gps, setGps] = useState<{ status: string; text: string }>({
    status: "pending",
    text: "Checking location services…",
  });

  useEffect(() => {
    getCurrentLocation()
      .then((loc) =>
        setGps({
          status: "ok",
          text: `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`,
        }),
      )
      .catch(() => setGps({ status: "error", text: "GPS unavailable — manual entry required" }));
  }, []);

  const active = activeEmergencyOf(emergencies, user?.id);
  const ambulance = ambulances.find((a) => a.id === active?.ambulance_id) ?? null;
  const hospital = hospitals.find((h) => h.id === active?.hospital_id) ?? null;
  const history = (emergencies ?? []).filter((e) => e.reported_by === user?.id).slice(0, 4);

  return (
    <div className="space-y-6">
      <section className="card-surface overflow-hidden">
        <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-emergency">
              <Siren className="size-4" aria-hidden /> EMERGENCY SOS
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Press SOS to request emergency assistance
            </h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">GPS status</dt>
                <dd className="flex items-center gap-1.5 font-medium">
                  <MapPin className="size-3.5" aria-hidden />
                  {gps.status === "ok"
                    ? "Location detected"
                    : gps.status === "error"
                      ? "Unavailable"
                      : "Detecting…"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Current location</dt>
                <dd className="font-medium">{gps.text}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Emergency availability</dt>
                <dd className="font-medium text-success">
                  {ambulances.filter((a) => a.status === "AVAILABLE").length} ambulances available
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Emergency contact</dt>
                <dd className="font-medium">{patient?.emergency_contact ?? "Not set"}</dd>
              </div>
            </dl>
          </div>
          <Button
            asChild
            variant="destructive"
            className="animate-sos h-32 w-full text-lg font-bold sm:size-40 sm:rounded-full"
          >
            <Link to="/sos">
              <span className="flex flex-col items-center gap-1">
                <Siren className="size-8" aria-hidden />
                PRESS SOS
              </span>
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Active emergency"
          value={active ? active.emergency_type : "None"}
          icon={Activity}
          tone={active ? "emergency" : "success"}
          hint={active ? `Case ${active.id.slice(0, 8).toUpperCase()}` : "No open cases"}
        />
        <StatsCard
          label="Ambulance status"
          value={ambulance ? ambulance.status.replace(/_/g, " ") : "—"}
          icon={AmbulanceIcon}
          hint={ambulance?.ambulance_number ?? "Not assigned"}
        />
        <StatsCard
          label="ETA"
          value={active?.eta_minutes ? `${active.eta_minutes} min` : "—"}
          icon={Clock}
        />
        <StatsCard
          label="Recommended hospital"
          value={hospital ? hospital.name.split(" ")[0]! : "—"}
          icon={HospitalIcon}
          hint={hospital?.name}
        />
      </section>

      {active ? (
        <EmergencyCard
          emergency={active}
          ambulance={ambulance}
          hospital={hospital}
          action={
            <Button asChild>
              <Link to="/live">Open live tracking</Link>
            </Button>
          }
        />
      ) : null}

      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
          Recent emergency history
        </h3>
        {isLoading ? (
          <LoadingState />
        ) : history.length ? (
          <ul className="space-y-3">
            {history.map((e) => (
              <li key={e.id}>
                <Link to="/emergency/$id" params={{ id: e.id }} className="block">
                  <div className="card-surface flex flex-wrap items-center gap-3 p-4">
                    <span className="font-medium">{e.emergency_type}</span>
                    <PriorityBadge priority={e.severity} />
                    <StatusBadge status={e.status} />
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(e.created_at).toLocaleString()}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No emergencies yet"
            description="Your past SOS cases will be listed here."
          />
        )}
      </section>
    </div>
  );
}

function DriverSummary() {
  const { data: emergencies = [] } = useEmergencies();
  const { data: ambulances = [] } = useAmbulances();
  const { user } = useAuth();
  const mine = ambulances.find((a) => a.driver_id === user?.id);
  const today = emergencies.filter(
    (e) => new Date(e.created_at).toDateString() === new Date().toDateString(),
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Current status"
          value={mine?.status.replace(/_/g, " ") ?? "Unassigned"}
          icon={AmbulanceIcon}
        />
        <StatsCard label="Today's emergencies" value={today.length} icon={Activity} />
        <StatsCard
          label="Assigned vehicle"
          value={mine?.ambulance_number ?? "—"}
          icon={AmbulanceIcon}
        />
        <StatsCard
          label="Open requests"
          value={emergencies.filter((e) => e.status === "AMBULANCE_ASSIGNED").length}
          icon={Siren}
          tone="emergency"
        />
      </div>
      <Button asChild>
        <Link to="/requests">Open emergency requests</Link>
      </Button>
    </div>
  );
}

function HospitalSummary() {
  const { data: emergencies = [] } = useEmergencies();
  const { data: hospitals = [] } = useHospitals();
  const incoming = emergencies.filter(
    (e) => e.hospital_id && e.status !== "COMPLETED" && e.status !== "CANCELLED",
  );
  const beds = hospitals.reduce((sum, h) => sum + h.available_beds, 0);
  const icu = hospitals.reduce((sum, h) => sum + h.icu_beds, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Incoming ambulances"
          value={incoming.length}
          icon={AmbulanceIcon}
          tone="emergency"
        />
        <StatsCard
          label="Emergency cases today"
          value={
            emergencies.filter(
              (e) => new Date(e.created_at).toDateString() === new Date().toDateString(),
            ).length
          }
          icon={Activity}
        />
        <StatsCard label="Available beds" value={beds} icon={BedDouble} tone="success" />
        <StatsCard label="ICU beds" value={icu} icon={Building2} tone="warning" />
      </div>
      <Button asChild>
        <Link to="/hospital-center">Open emergency control center</Link>
      </Button>
    </div>
  );
}

function DoctorSummary() {
  const { data: emergencies = [] } = useEmergencies();
  const incoming = emergencies.filter((e) => e.status !== "COMPLETED" && e.status !== "CANCELLED");
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Incoming patients"
          value={incoming.length}
          icon={Stethoscope}
          tone="emergency"
        />
        <StatsCard
          label="Critical cases"
          value={incoming.filter((e) => e.severity === "CRITICAL").length}
          icon={Activity}
          tone="warning"
        />
        <StatsCard
          label="Completed handovers"
          value={emergencies.filter((e) => e.status === "COMPLETED").length}
          icon={CheckCircle2}
          tone="success"
        />
        <StatsCard label="Total cases" value={emergencies.length} icon={Users} />
      </div>
      <Button asChild>
        <Link to="/doctor">View incoming patients</Link>
      </Button>
    </div>
  );
}

function AdminSummary() {
  const { data: emergencies = [], isLoading } = useEmergencies();
  const { data: ambulances = [] } = useAmbulances();
  const { data: hospitals = [] } = useHospitals();
  if (isLoading) return <LoadingState label="Loading operations data…" />;
  const a = buildAnalytics(emergencies, ambulances, hospitals);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard label="Total emergencies" value={a.total} icon={Activity} />
        <StatsCard label="Critical cases" value={a.critical} icon={Siren} tone="emergency" />
        <StatsCard label="Avg response" value={`${a.avgResponseMinutes} min`} icon={Clock} />
        <StatsCard
          label="Available ambulances"
          value={a.availableAmbulances}
          icon={AmbulanceIcon}
          tone="success"
        />
        <StatsCard
          label="Busy ambulances"
          value={a.busyAmbulances}
          icon={AmbulanceIcon}
          tone="warning"
        />
        <StatsCard label="Hospitals connected" value={a.hospitalsConnected} icon={HospitalIcon} />
      </div>
      <Button asChild>
        <Link to="/admin">Open operations center</Link>
      </Button>
    </div>
  );
}
