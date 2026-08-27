import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Ambulance, Emergency, Hospital, TimelineEvent } from "@/lib/types";
import { listAmbulances } from "@/services/ambulanceService";
import { listHospitals } from "@/services/hospitalRecommendationService";
import { getTimeline, listEmergencies } from "@/services/emergencyService";

export function useEmergencies() {
  return useQuery<Emergency[]>({ queryKey: ["emergencies"], queryFn: listEmergencies });
}

export function useAmbulances() {
  return useQuery<Ambulance[]>({ queryKey: ["ambulances"], queryFn: listAmbulances });
}

export function useHospitals() {
  return useQuery<Hospital[]>({ queryKey: ["hospitals"], queryFn: listHospitals });
}

export function useTimeline(emergencyId?: string | null) {
  return useQuery<TimelineEvent[]>({
    queryKey: ["timeline", emergencyId],
    enabled: !!emergencyId,
    queryFn: () => getTimeline(emergencyId!),
  });
}

export function usePatientProfile(userId?: string) {
  return useQuery({
    queryKey: ["patient", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("patients").select("*").eq("user_id", userId!).maybeSingle();
      return data as null | {
        id: string;
        name: string;
        age: number | null;
        gender: string | null;
        blood_group: string | null;
        phone: string | null;
        emergency_contact: string | null;
        medical_history: string | null;
        allergies: string | null;
      };
    },
  });
}

export function activeEmergencyOf(emergencies: Emergency[] | undefined, userId?: string) {
  return (
    emergencies?.find(
      (e) => e.reported_by === userId && e.status !== "COMPLETED" && e.status !== "CANCELLED",
    ) ?? null
  );
}
