import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Ambulance as AmbulanceIcon,
  Building2,
  Check,
  ExternalLink,
  Hospital as HospitalIcon,
  Layers,
  MapPin,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/layout/AppShell";
import { PriorityBadge, StatusBadge } from "@/components/emergency/badges";
import { LiveMap, type MapMarker } from "@/components/emergency/LiveMap";
import { StatsCard } from "@/components/emergency/StatsCard";
import { LoadingState } from "@/components/emergency/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAmbulances, useEmergencies, useHospitals } from "@/hooks/useEmergencyData";
import { useTenant } from "@/hooks/useTenant";
import { buildAnalytics } from "@/services/analyticsService";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin operations — SmartResponse" },
      {
        name: "description",
        content: "System-wide analytics, live fleet map and full emergency operations table.",
      },
      { property: "og:title", content: "Admin operations — SmartResponse" },
      {
        property: "og:description",
        content: "Response times, fleet utilisation and live emergency oversight.",
      },
    ],
  }),
  component: AdminPage,
  pendingComponent: () => (
    <AppShell title="Admin operations">
      <LoadingState label="Loading operations data…" />
    </AppShell>
  ),
});

const PIE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function AdminPage() {
  const { data: emergencies = [], isLoading } = useEmergencies();
  const { data: ambulances = [] } = useAmbulances();
  const { data: hospitals = [] } = useHospitals();
  const { tenants, activeTenant, activeTenantId, switchTenant, isAllTenants, setAllTenantsView } =
    useTenant();

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return emergencies;
    return emergencies.filter((e) => {
      const ambNum = ambulances.find((x) => x.id === e.ambulance_id)?.ambulance_number ?? "";
      const hospName = hospitals.find((h) => h.id === e.hospital_id)?.name ?? "";
      return (
        e.id.toLowerCase().includes(q) ||
        e.emergency_type.toLowerCase().includes(q) ||
        e.severity.toLowerCase().includes(q) ||
        e.status.toLowerCase().includes(q) ||
        ambNum.toLowerCase().includes(q) ||
        hospName.toLowerCase().includes(q)
      );
    });
  }, [emergencies, ambulances, hospitals, query]);

  if (isLoading) {
    return (
      <AppShell title="Admin operations">
        <LoadingState label="Loading operations data…" />
      </AppShell>
    );
  }

  const a = buildAnalytics(emergencies, ambulances, hospitals);

  const markers: MapMarker[] = [
    ...ambulances.map<MapMarker>((amb) => ({
      id: amb.id,
      latitude: amb.latitude,
      longitude: amb.longitude,
      label: amb.ambulance_number,
      kind: "ambulance",
      detail: `Status: ${amb.status.replace(/_/g, " ")}`,
    })),
    ...hospitals.map<MapMarker>((h) => ({
      id: h.id,
      latitude: h.latitude,
      longitude: h.longitude,
      label: h.name.split(" ")[0]!,
      kind: "hospital",
      detail: `Beds: ${h.available_beds} · ICU: ${h.icu_beds}`,
    })),
    ...emergencies
      .filter((e) => e.status !== "COMPLETED" && e.status !== "CANCELLED")
      .map<MapMarker>((e) => ({
        id: e.id,
        latitude: e.latitude,
        longitude: e.longitude,
        label: e.emergency_type,
        kind: "patient",
        detail: `Priority: ${e.severity} · ${e.status.replace(/_/g, " ")}`,
      })),
  ];

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AppShell title="Admin operations">
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Total emergencies" value={a.total} icon={Activity} />
          <StatsCard label="Active now" value={a.active} icon={Activity} tone="emergency" />
          <StatsCard
            label="Avg response"
            value={`${a.avgResponseMinutes} min`}
            icon={Timer}
            tone="warning"
          />
          <StatsCard
            label="Available ambulances"
            value={a.availableAmbulances}
            icon={AmbulanceIcon}
            tone="success"
          />
        </div>

        {/* Multi-Tenancy Healthcare Organizations & Regional Zones */}
        <section className="card-surface p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Building2 className="size-4 text-primary" />
                Healthcare Networks & Municipal EMS Tenants
              </h2>
              <p className="text-xs text-muted-foreground">
                Multi-tenant regional data isolation, isolated dispatch fleets, and designated
                trauma hubs.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isAllTenants ? "default" : "outline"}
                size="sm"
                onClick={() => setAllTenantsView(!isAllTenants)}
                className="text-xs h-8"
              >
                <Layers className="mr-1.5 size-3.5" />
                {isAllTenants ? "Showing All Networks" : "Cross-Tenant Aggregate"}
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tenants.map((t) => {
              const isSelected = !isAllTenants && t.id === activeTenantId;
              const tenantAmbulances = ambulances.filter((amb) => amb.tenant_id === t.id);
              const tenantHospitals = hospitals.filter((h) => h.tenant_id === t.id);
              const activeCalls = emergencies.filter(
                (e) => e.tenant_id === t.id && e.status !== "COMPLETED" && e.status !== "CANCELLED",
              ).length;

              return (
                <div
                  key={t.id}
                  className={`group relative flex flex-col justify-between rounded-xl border p-4 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                      : "border-border bg-card/60 hover:bg-muted/40 hover:border-border/80"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="grid size-6 place-items-center rounded bg-muted text-[11px] font-bold font-mono">
                          {t.code || t.slug.slice(0, 4).toUpperCase()}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[9px] uppercase tracking-wider font-semibold"
                        >
                          {t.tier?.replace(/_/g, " ") || "NETWORK"}
                        </Badge>
                      </div>
                      {isSelected && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] gap-1 px-1.5 py-0">
                          <Check className="size-3" /> Active
                        </Badge>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xs font-bold line-clamp-1">{t.name}</h3>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="size-3 shrink-0" />
                        <span className="truncate">{t.region}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-1 rounded-lg bg-background/80 p-2 text-center text-xs border border-border/40">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Fleet</p>
                        <p className="font-semibold text-foreground">
                          {tenantAmbulances.length || t.total_ambulances || 3}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Hospitals</p>
                        <p className="font-semibold text-foreground">
                          {tenantHospitals.length || t.total_hospitals || 3}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Live SOS</p>
                        <p className="font-semibold text-emergency">{activeCalls}</p>
                      </div>
                    </div>

                    <p className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                      <Phone className="size-3 text-emergency" />
                      {t.hotline}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-border/40">
                    <Button
                      variant={isSelected ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => switchTenant(t.id)}
                      className="w-full text-xs h-7"
                    >
                      {isSelected ? "Current Network" : "Switch to Tenant"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <LiveMap markers={markers} height={320} />

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card-surface p-5">
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
              Emergencies per day
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={a.perDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--color-chart-1)" radius={4} />
                <Bar dataKey="critical" fill="var(--color-emergency)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className="card-surface p-5">
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
              Average response time (min)
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={a.responseTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </section>

          <section className="card-surface p-5">
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Cases by priority</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={a.byPriority} dataKey="value" nameKey="name" outerRadius={80} label>
                  {a.byPriority.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </section>

          <section className="card-surface p-5">
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
              Ambulance utilisation
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={a.ambulanceUtilisation}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="cases" fill="var(--color-chart-3)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </div>

        <section className="card-surface p-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <HospitalIcon className="size-4" aria-hidden /> All emergencies
            </h2>
            <span className="text-xs text-muted-foreground">
              {filtered.length} of {emergencies.length} case{emergencies.length !== 1 ? "s" : ""}
            </span>
            <div className="relative ml-auto w-full sm:w-64">
              <Search
                className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                placeholder="Search cases…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-8 text-sm h-8"
                aria-label="Search emergencies"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2">Case</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Ambulance</th>
                  <th>Hospital</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pageRows.length ? (
                  pageRows.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-border/60 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-2 font-mono text-xs">{e.id.slice(0, 8).toUpperCase()}</td>
                      <td>{e.emergency_type}</td>
                      <td>
                        <PriorityBadge priority={e.severity} />
                      </td>
                      <td>
                        <StatusBadge status={e.status} />
                      </td>
                      <td>
                        {ambulances.find((x) => x.id === e.ambulance_id)?.ambulance_number ?? "—"}
                      </td>
                      <td>{hospitals.find((h) => h.id === e.hospital_id)?.name ?? "—"}</td>
                      <td className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(e.created_at).toLocaleString()}
                      </td>
                      <td>
                        <Button asChild size="sm" variant="ghost">
                          <Link to="/emergency/$id" params={{ id: e.id }}>
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                      No emergencies match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-2 text-sm">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const pageNum =
                    totalPages <= 7
                      ? i + 1
                      : page <= 4
                        ? i + 1
                        : page >= totalPages - 3
                          ? totalPages - 6 + i
                          : page - 3 + i;
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? "default" : "outline"}
                      size="sm"
                      className="hidden sm:inline-flex w-8 px-0"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
