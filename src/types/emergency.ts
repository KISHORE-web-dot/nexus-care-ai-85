// ─── Public Emergency Module Types ───────────────────────────────────────────
// Separate from src/lib/types.ts which is Supabase-specific.
// These types serve the public /emergency route (no auth required).

export type EmergencySource = "PATIENT" | "BYSTANDER";

export type ConsciousnessStatus = "YES" | "NO" | "UNKNOWN";

export type EmergencyPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type EmergencyStatus =
  | "CREATED"
  | "AI_ASSESSING"
  | "PRIORITY_ASSIGNED"
  | "DISPATCHING"
  | "AMBULANCE_ASSIGNED"
  | "AMBULANCE_EN_ROUTE"
  | "AMBULANCE_ARRIVED"
  | "PATIENT_ONBOARD"
  | "HOSPITAL_ASSIGNED"
  | "HOSPITAL_ARRIVED"
  | "COMPLETED"
  | "CANCELLED";

/** Captured GPS or manually-entered coordinates. */
export interface LocationCapture {
  latitude: number;
  longitude: number;
  /** Browser-reported accuracy in metres; 0 for manual entry. */
  accuracy: number;
  /** Human-readable address from reverse geocoding. */
  address?: string;
  source: "gps" | "manual";
}

/** Data collected from the bystander question flow. */
export interface BystanderFormData {
  consciousness: ConsciousnessStatus;
  emergencyType: string;
  peopleAffected: number;
  description: string;
}

/** Payload sent to POST /api/emergencies */
export interface PublicEmergencyPayload {
  source: EmergencySource;
  emergencyType: string;
  /** true = conscious, false = unconscious, null = unknown */
  conscious: boolean | null;
  peopleAffected: number;
  description: string;
  latitude: number;
  longitude: number;
  accuracy: number;
}

/** Response from POST /api/emergencies (backend-generated). */
export interface PublicEmergency {
  id: string; // e.g. "EMG-2026-00001"
  source: EmergencySource;
  emergencyType: string;
  conscious: boolean | null;
  peopleAffected: number;
  description: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  priority: EmergencyPriority | null;
  status: EmergencyStatus;
  createdAt: string; // ISO-8601
}

// ─── SOS Pipeline Types ─────────────────────────────────────────────────────

/** AI priority assessment result from POST /api/emergencies/:id/assess */
export interface AIAssessmentResult {
  priority: EmergencyPriority;
  confidence: number; // 0–1
  /** true when AI was unavailable and fallback rules were used */
  fallback: boolean;
}

/** Full emergency detail returned by GET /api/emergencies/:id */
export interface EmergencyDetails extends PublicEmergency {
  aiAssessment?: AIAssessmentResult;
  ambulanceId?: string;
  ambulanceNumber?: string;
  ambulanceEta?: number;
  hospitalId?: string;
  hospitalName?: string;
  updatedAt?: string;
}
