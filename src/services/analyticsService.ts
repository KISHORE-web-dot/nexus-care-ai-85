import type { Ambulance, Emergency, Hospital } from "@/lib/types";

export interface Analytics {
  total: number;
  critical: number;
  active: number;
  completed: number;
  avgResponseMinutes: number;
  availableAmbulances: number;
  busyAmbulances: number;
  hospitalsConnected: number;
  byType: { name: string; value: number }[];
  byPriority: { name: string; value: number }[];
  perDay: { day: string; count: number; critical: number }[];
  responseTrend: { day: string; minutes: number }[];
  ambulanceUtilisation: { name: string; cases: number }[];
  hospitalUsage: { name: string; cases: number }[];
}

function dayKey(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function buildAnalytics(
  emergencies: Emergency[],
  ambulances: Ambulance[],
  hospitals: Hospital[],
): Analytics {
  const completed = emergencies.filter((e) => e.status === "COMPLETED");
  const responses = emergencies
    .filter((e) => e.accepted_at)
    .map((e) => (new Date(e.accepted_at!).getTime() - new Date(e.created_at).getTime()) / 60000)
    .filter((m) => m >= 0 && m < 240);

  const count = <T extends string>(items: T[]) => {
    const map = new Map<string, number>();
    items.forEach((i) => map.set(i, (map.get(i) ?? 0) + 1));
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  };

  const days: { day: string; count: number; critical: number }[] = [];
  const trend: { day: string; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const sameDay = emergencies.filter((e) => dayKey(e.created_at) === key);
    days.push({
      day: key,
      count: sameDay.length,
      critical: sameDay.filter((e) => e.severity === "CRITICAL").length,
    });
    const dayResponses = sameDay
      .filter((e) => e.accepted_at)
      .map((e) => (new Date(e.accepted_at!).getTime() - new Date(e.created_at).getTime()) / 60000);
    trend.push({
      day: key,
      minutes: dayResponses.length
        ? Number((dayResponses.reduce((a, b) => a + b, 0) / dayResponses.length).toFixed(1))
        : 0,
    });
  }

  return {
    total: emergencies.length,
    critical: emergencies.filter((e) => e.severity === "CRITICAL").length,
    active: emergencies.filter((e) => e.status !== "COMPLETED" && e.status !== "CANCELLED").length,
    completed: completed.length,
    avgResponseMinutes: responses.length
      ? Number((responses.reduce((a, b) => a + b, 0) / responses.length).toFixed(1))
      : 0,
    availableAmbulances: ambulances.filter((a) => a.status === "AVAILABLE").length,
    busyAmbulances: ambulances.filter((a) => a.status !== "AVAILABLE" && a.status !== "OFFLINE")
      .length,
    hospitalsConnected: hospitals.length,
    byType: count(emergencies.map((e) => e.emergency_type)),
    byPriority: count(emergencies.map((e) => e.severity)),
    perDay: days,
    responseTrend: trend,
    ambulanceUtilisation: ambulances.map((a) => ({
      name: a.ambulance_number,
      cases: emergencies.filter((e) => e.ambulance_id === a.id).length,
    })),
    hospitalUsage: hospitals.map((h) => ({
      name: h.name.split(" ")[0] ?? h.name,
      cases: emergencies.filter((e) => e.hospital_id === h.id).length,
    })),
  };
}

export const analyticsService = { buildAnalytics };
