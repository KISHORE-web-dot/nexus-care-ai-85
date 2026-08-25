import { supabase } from "@/integrations/supabase/client";
import { distanceKm, etaMinutes, type LatLng } from "@/lib/geo";
import type { Ambulance, Priority } from "@/lib/types";

export interface AmbulanceCandidate {
  ambulance: Ambulance;
  distanceKm: number;
  etaMinutes: number;
  score: number;
  reasons: string[];
}

const TYPE_RANK: Record<string, number> = {
  NORMAL: 1,
  ICU: 2,
  ADVANCED_LIFE_SUPPORT: 3,
};

export async function listAmbulances(): Promise<Ambulance[]> {
  const { data, error } = await supabase.from("ambulances").select("*").order("ambulance_number");
  if (error) throw error;
  return (data ?? []) as unknown as Ambulance[];
}

/**
 * Weighted dispatch scoring — deliberately NOT "nearest wins".
 * Considers distance, traffic, vehicle capability vs. severity and availability.
 */
export function rankAmbulances(
  ambulances: Ambulance[],
  location: LatLng,
  priority: Priority,
): AmbulanceCandidate[] {
  const needsAdvanced = priority === "CRITICAL" || priority === "HIGH";

  return ambulances
    .filter((a) => a.status === "AVAILABLE")
    .map((a) => {
      const km = distanceKm(location, a);
      const eta = etaMinutes(km, a.traffic_score);
      const reasons: string[] = [];

      let score = 100;
      score -= Math.min(45, km * 7);
      reasons.push(`${km.toFixed(1)} km away`);

      score -= a.traffic_score * 2;
      if (a.traffic_score <= 4) reasons.push("Light traffic on route");
      else if (a.traffic_score >= 7) reasons.push("Heavy traffic on route");

      const rank = TYPE_RANK[a.ambulance_type] ?? 1;
      if (needsAdvanced) {
        score += (rank - 1) * 16;
        if (rank > 1) reasons.push(`${a.ambulance_type.replace(/_/g, " ")} capability matches severity`);
        else reasons.push("Basic vehicle — limited for severe cases");
      } else {
        score += rank === 1 ? 8 : 0;
        if (rank === 1) reasons.push("Basic transport is sufficient");
      }

      if (priority === "CRITICAL" && a.equipment.includes("Ventilator")) {
        score += 8;
        reasons.push("Ventilator on board");
      }

      return { ambulance: a, distanceKm: km, etaMinutes: eta, score: Math.round(score), reasons };
    })
    .sort((a, b) => b.score - a.score);
}

export async function updateAmbulance(id: string, patch: Partial<Ambulance>) {
  const { error } = await supabase
    .from("ambulances")
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}

export async function pushLocation(ambulanceId: string, point: LatLng) {
  await supabase.from("ambulances").update(point as never).eq("id", ambulanceId);
  await supabase.from("ambulance_locations").insert({ ambulance_id: ambulanceId, ...point } as never);
}

export async function claimAmbulanceForDriver(userId: string, driverName: string) {
  const { data } = await supabase.from("ambulances").select("*").eq("driver_id", userId).maybeSingle();
  if (data) return data as unknown as Ambulance;
  const { data: free } = await supabase
    .from("ambulances")
    .select("*")
    .is("driver_id", null)
    .order("ambulance_number")
    .limit(1)
    .maybeSingle();
  if (!free) return null;
  await supabase
    .from("ambulances")
    .update({ driver_id: userId, driver_name: driverName } as never)
    .eq("id", (free as { id: string }).id);
  return { ...(free as unknown as Ambulance), driver_id: userId, driver_name: driverName };
}

export const ambulanceService = {
  listAmbulances,
  rankAmbulances,
  updateAmbulance,
  pushLocation,
  claimAmbulanceForDriver,
};
