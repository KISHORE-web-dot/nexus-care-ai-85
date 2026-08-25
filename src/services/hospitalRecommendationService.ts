import { supabase } from "@/integrations/supabase/client";
import { distanceKm, type LatLng } from "@/lib/geo";
import type { Hospital, Priority } from "@/lib/types";

export interface HospitalRecommendation {
  hospital: Hospital;
  score: number;
  distanceKm: number;
  reasons: string[];
}

const TYPE_SPECIALIZATION: Record<string, string> = {
  "Road Accident": "Trauma",
  "Heart Problem": "Cardiology",
  "Chest Pain": "Cardiology",
  "Stroke Symptoms": "Neurology",
  "Heavy Bleeding": "Trauma",
  Unconscious: "Emergency Medicine",
  "Breathing Problem": "Emergency Medicine",
  Other: "Emergency Medicine",
};

export function requiredSpecialization(emergencyType: string): string {
  return TYPE_SPECIALIZATION[emergencyType] ?? "Emergency Medicine";
}

export async function listHospitals(): Promise<Hospital[]> {
  const { data, error } = await supabase.from("hospitals").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as unknown as Hospital[];
}

/** Suitability scoring — distance is only one input. */
export function rankHospitals(
  hospitals: Hospital[],
  location: LatLng,
  emergencyType: string,
  priority: Priority,
): HospitalRecommendation[] {
  const spec = requiredSpecialization(emergencyType);
  const needsIcu = priority === "CRITICAL" || priority === "HIGH";

  return hospitals
    .map((h) => {
      const km = distanceKm(location, h);
      const reasons: string[] = [];
      let score = 100;

      score -= Math.min(40, km * 4.5);
      reasons.push(`${km.toFixed(1)} km travel distance`);

      if (h.emergency_available) {
        score += 18;
        reasons.push("Emergency department accepting patients");
      } else {
        score -= 55;
        reasons.push("Emergency department unavailable");
      }

      if (h.specializations.includes(spec)) {
        score += 20;
        reasons.push(`${spec} specialisation available`);
      } else {
        score -= 12;
        reasons.push(`No dedicated ${spec} unit`);
      }

      if (needsIcu) {
        if (h.icu_beds > 0) {
          score += 22 + Math.min(8, h.icu_beds);
          reasons.push(`${h.icu_beds} ICU bed(s) free`);
        } else {
          score -= 45;
          reasons.push("No ICU capacity");
        }
      }

      if (h.available_beds > 0) {
        score += Math.min(10, h.available_beds / 4);
        reasons.push(`${h.available_beds} general bed(s) free`);
      } else {
        score -= 30;
        reasons.push("No general beds free");
      }

      if (h.status !== "ACTIVE") score -= 60;

      return { hospital: h, score: Math.round(score), distanceKm: km, reasons };
    })
    .sort((a, b) => b.score - a.score);
}

export const hospitalRecommendationService = { listHospitals, rankHospitals, requiredSpecialization };
