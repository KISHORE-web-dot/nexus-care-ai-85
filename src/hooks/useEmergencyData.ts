import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { handleFirestoreError, OperationType } from "@/lib/firestoreErrors";
import type { Ambulance, Emergency, Hospital, TimelineEvent } from "@/lib/types";
import { listAmbulances } from "@/services/ambulanceService";
import { listHospitals } from "@/services/hospitalRecommendationService";
import { getTimeline, listEmergencies } from "@/services/emergencyService";
import { useTenant } from "@/hooks/useTenant";

export function useEmergencies(tenantOverride?: string | null) {
  const { activeTenantId, isAllTenants } = useTenant();
  const filterTenantId =
    tenantOverride !== undefined
      ? tenantOverride || undefined
      : isAllTenants
        ? undefined
        : activeTenantId;

  return useQuery<Emergency[]>({
    queryKey: ["emergencies", filterTenantId ?? "all"],
    queryFn: () => listEmergencies(filterTenantId),
  });
}

export function useAmbulances(tenantOverride?: string | null) {
  const { activeTenantId, isAllTenants } = useTenant();
  const filterTenantId =
    tenantOverride !== undefined
      ? tenantOverride || undefined
      : isAllTenants
        ? undefined
        : activeTenantId;

  return useQuery<Ambulance[]>({
    queryKey: ["ambulances", filterTenantId ?? "all"],
    queryFn: () => listAmbulances(filterTenantId),
  });
}

export function useHospitals(tenantOverride?: string | null) {
  const { activeTenantId, isAllTenants } = useTenant();
  const filterTenantId =
    tenantOverride !== undefined
      ? tenantOverride || undefined
      : isAllTenants
        ? undefined
        : activeTenantId;

  return useQuery<Hospital[]>({
    queryKey: ["hospitals", filterTenantId ?? "all"],
    queryFn: () => listHospitals(filterTenantId),
  });
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
      if (!userId) return null;
      try {
        const snap = await getDoc(doc(db, "patients", userId));
        if (snap.exists()) {
          return snap.data() as {
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
        }
        return null;
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.GET, `patients/${userId}`);
        } catch {
          return null;
        }
      }
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
