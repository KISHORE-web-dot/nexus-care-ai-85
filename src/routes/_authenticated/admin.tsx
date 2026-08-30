import { Link, createFileRoute } from "@tanstack/react-router";
import { Activity, Ambulance as AmbulanceIcon, Hospital as HospitalIcon, Search, Timer } from "lucide-react";
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
import { useAmbulances, useEmergencies, useHospitals } from "@/hooks/useEmergencyData";
import { buildAnalytics } from "@/services/analyticsService";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin operations — SmartResponse" },
      { name: "description", content: "System-wide analytics, live fleet map and full emergency operations table." },
      { property: "og:title", content: "Admin operations — SmartResponse" },
      { property: "og:description", content: "Response times, fleet utilisation and live emergency oversight." },
    ],
  }),
  component: AdminPage,
  pendingComponent: () => (
    <AppShell title="Admin operations">
      <LoadingState label="Loading operations data…" />
    </AppShell>
  ),
});

const PIE_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

function AdminPage() {
  const { data: emergencies = [], isLoading } = useEmergencies();
  const { data: ambulances = [] } = useAmbulances();
  const { data: hospitals = [] } = useHospitals();

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AppShell title="Admin operations">
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Total emergencies" value={a.total} icon={Activity} />
          <StatsCard label="Active now" value={a.active} icon={Activity} tone="emergency" />
          <StatsCard label="Avg response" value={`${a.avgResponseMinutes} min`} icon={Timer} tone="warning" />
          <StatsCard label="Available ambulances" value={a.availableAmbulances} icon={AmbulanceIcon} tone="success" />
        </div>

        <LiveMap markers={markers} height={320} />

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card-surface p-5">
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Emergencies per day</h2>
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
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Average response time (min)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={a.responseTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="minutes" stroke="var(--color-chart-2)" strokeWidth={2} />
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
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Ambulance utilisation</h2>
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
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                type="search"
                placeholder="Search cases…"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
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
                    <tr key={e.id} className="border-b border-border/60 hover:bg-muted/30 transition-colors">
                      <td className="py-2 font-mono text-xs">{e.id.slice(0, 8).toUpperCase()}</td>
                      <td>{e.emergency_type}</td>
                      <td>
                        <PriorityBadge priority={e.severity} />
                      </td>
                      <td>
                        <StatusBadge status={e.status} />
                      </td>
                      <td>{ambulances.find((x) => x.id === e.ambulance_id)?.ambulance_number ?? "—"}</td>
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
                  const pageNum = totalPages <= 7
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
