import { supabase } from "@/integrations/supabase/client";
import type { Emergency, EmergencyConditions, Priority, TimelineEvent } from "@/lib/types";
import { addTimelineEvent } from "./timelineService";
import { notify, notifyMany } from "./notificationService";
import type { AmbulanceCandidate } from "./ambulanceService";
import type { HospitalRecommendation } from "./hospitalRecommendationService";
import type { AIAssessment } from "./aiPriorityService";

export interface CreateEmergencyInput {
  reportedBy: string;
  patientId?: string | null;
  patientName: string;
  emergencyType: string;
  description?: string;
  conditions: EmergencyConditions;
  latitude: number;
  longitude: number;
  address?: string;
  assessment: AIAssessment;
}

export async function createEmergency(input: CreateEmergencyInput): Promise<Emergency> {
  const { data, error } = await supabase
    .from("emergencies")
    .insert({
      reported_by: input.reportedBy,
      patient_id: input.patientId ?? null,
      patient_name: input.patientName,
      emergency_type: input.emergencyType,
      description: input.description ?? null,
      conditions: input.conditions,
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address ?? null,
      severity: input.assessment.priority,
      ai_score: input.assessment.score,
      ai_reasons: input.assessment.reasons,
      status: "AI_ASSESSED",
    } as never)
    .select()
    .single();
  if (error) throw error;
  const emergency = data as unknown as Emergency;

  await addTimelineEvent(emergency.id, "SOS_RECEIVED", `${input.emergencyType} reported`, input.reportedBy);
  await addTimelineEvent(
    emergency.id,
    "AI_ASSESSMENT",
    `AI priority ${input.assessment.priority} (score ${input.assessment.score})`,
    input.reportedBy,
  );
  await notify({
    role: "ADMIN",
    emergencyId: emergency.id,
    title: `New ${input.assessment.priority} emergency`,
    message: `${input.emergencyType} — ${input.patientName}`,
    type: input.assessment.priority === "CRITICAL" ? "CRITICAL" : "WARNING",
  });
  return emergency;
}

export async function assignAmbulance(emergency: Emergency, candidate: AmbulanceCandidate) {
  const { error } = await supabase
    .from("emergencies")
    .update({
      ambulance_id: candidate.ambulance.id,
      eta_minutes: candidate.etaMinutes,
      status: "AMBULANCE_ASSIGNED",
    } as never)
    .eq("id", emergency.id);
  if (error) throw error;

  await supabase
    .from("ambulances")
    .update({ status: "EMERGENCY_ASSIGNED", current_case_id: emergency.id } as never)
    .eq("id", candidate.ambulance.id);

  await addTimelineEvent(
    emergency.id,
    "AMBULANCE_ASSIGNED",
    `${candidate.ambulance.ambulance_number} (${candidate.ambulance.ambulance_type}) dispatched — ${candidate.distanceKm.toFixed(1)} km, ETA ${candidate.etaMinutes} min`,
  );
  await notifyMany([
    {
      role: "DRIVER",
      emergencyId: emergency.id,
      title: "New emergency request received",
      message: `${emergency.emergency_type} — ${emergency.severity} priority`,
      type: "CRITICAL",
    },
    {
      userId: emergency.reported_by,
      emergencyId: emergency.id,
      title: "Ambulance assigned",
      message: `${candidate.ambulance.ambulance_number} is being dispatched. ETA ${candidate.etaMinutes} min.`,
      type: "SUCCESS",
    },
  ]);
}

export async function assignHospital(emergency: Emergency, rec: HospitalRecommendation) {
  const { error } = await supabase
    .from("emergencies")
    .update({ hospital_id: rec.hospital.id, hospital_reasons: rec.reasons } as never)
    .eq("id", emergency.id);
  if (error) throw error;

  await addTimelineEvent(
    emergency.id,
    "HOSPITAL_SELECTED",
    `${rec.hospital.name} recommended (suitability ${rec.score})`,
  );
  await notifyMany([
    {
      role: "HOSPITAL",
      emergencyId: emergency.id,
      title: `Incoming ${emergency.severity} patient`,
      message: `${emergency.emergency_type} arriving at ${rec.hospital.name}`,
      type: emergency.severity === "CRITICAL" ? "CRITICAL" : "WARNING",
    },
    {
      role: "DOCTOR",
      emergencyId: emergency.id,
      title: "New incoming patient",
      message: `${emergency.emergency_type} — ${emergency.severity}`,
      type: "WARNING",
    },
    {
      userId: emergency.reported_by,
      emergencyId: emergency.id,
      title: "Hospital selected",
      message: rec.hospital.name,
      type: "INFO",
    },
  ]);
}

const STATUS_FLOW: Record<string, { ambulance: string; label: string; stamp?: keyof Emergency }> = {
  DRIVER_ACCEPTED: { ambulance: "GOING_TO_PATIENT", label: "Driver accepted the request", stamp: "accepted_at" },
  GOING_TO_PATIENT: { ambulance: "GOING_TO_PATIENT", label: "Ambulance en route to patient" },
  ARRIVED_AT_PATIENT: { ambulance: "ARRIVED_AT_PATIENT", label: "Ambulance reached the patient" },
  PATIENT_ONBOARD: { ambulance: "PATIENT_ONBOARD", label: "Patient picked up", stamp: "pickup_at" },
  GOING_TO_HOSPITAL: { ambulance: "GOING_TO_HOSPITAL", label: "Transporting patient to hospital" },
  ARRIVED_AT_HOSPITAL: {
    ambulance: "ARRIVED_AT_HOSPITAL",
    label: "Patient reached the hospital",
    stamp: "hospital_arrival_at",
  },
  COMPLETED: { ambulance: "AVAILABLE", label: "Emergency case completed", stamp: "completed_at" },
};

export async function advanceStatus(emergency: Emergency, nextStatus: string, userId?: string) {
  const flow = STATUS_FLOW[nextStatus];
  const patch: Record<string, unknown> = { status: nextStatus };
  if (flow?.stamp) patch[flow.stamp] = new Date().toISOString();

  const { error } = await supabase.from("emergencies").update(patch as never).eq("id", emergency.id);
  if (error) throw error;

  if (emergency.ambulance_id && flow) {
    await supabase
      .from("ambulances")
      .update({
        status: flow.ambulance,
        current_case_id: nextStatus === "COMPLETED" ? null : emergency.id,
      } as never)
      .eq("id", emergency.ambulance_id);
  }

  await addTimelineEvent(emergency.id, nextStatus, flow?.label ?? nextStatus, userId);
  await notifyMany([
    {
      userId: emergency.reported_by,
      emergencyId: emergency.id,
      title: flow?.label ?? "Emergency updated",
      message: `Case ${emergency.id.slice(0, 8).toUpperCase()} status: ${nextStatus.replace(/_/g, " ")}`,
      type: nextStatus === "COMPLETED" ? "SUCCESS" : "INFO",
    },
    {
      role: "HOSPITAL",
      emergencyId: emergency.id,
      title: flow?.label ?? "Emergency updated",
      message: `${emergency.emergency_type} — ${nextStatus.replace(/_/g, " ")}`,
      type: "INFO",
    },
  ]);
}

export async function rejectAssignment(emergency: Emergency, ambulanceId: string) {
  await supabase
    .from("ambulances")
    .update({ status: "AVAILABLE", current_case_id: null } as never)
    .eq("id", ambulanceId);
  await supabase
    .from("emergencies")
    .update({ ambulance_id: null, eta_minutes: null, status: "AI_ASSESSED" } as never)
    .eq("id", emergency.id);
  await addTimelineEvent(emergency.id, "AMBULANCE_REJECTED", "Driver unavailable — searching next ambulance");
}

export async function listEmergencies(): Promise<Emergency[]> {
  const { data, error } = await supabase
    .from("emergencies")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Emergency[];
}

export async function getEmergency(id: string): Promise<Emergency | null> {
  const { data, error } = await supabase.from("emergencies").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as unknown as Emergency) ?? null;
}

export async function getTimeline(id: string): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from("emergency_timeline")
    .select("*")
    .eq("emergency_id", id)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as unknown as TimelineEvent[];
}

export function isActive(e: Emergency) {
  return e.status !== "COMPLETED" && e.status !== "CANCELLED";
}

export function priorityOf(e: Emergency): Priority {
  return e.severity as Priority;
}

export const emergencyService = {
  createEmergency,
  assignAmbulance,
  assignHospital,
  advanceStatus,
  rejectAssignment,
  listEmergencies,
  getEmergency,
  getTimeline,
  isActive,
};
