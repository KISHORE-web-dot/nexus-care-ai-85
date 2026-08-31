export type AppRole = "PATIENT" | "DRIVER" | "PARAMEDIC" | "DOCTOR" | "HOSPITAL" | "ADMIN";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AmbulanceStatus =
  | "AVAILABLE"
  | "BUSY"
  | "OFFLINE"
  | "EMERGENCY_ASSIGNED"
  | "GOING_TO_PATIENT"
  | "ARRIVED_AT_PATIENT"
  | "PATIENT_ONBOARD"
  | "GOING_TO_HOSPITAL"
  | "ARRIVED_AT_HOSPITAL"
  | "COMPLETED";

export type EmergencyStatus =
  | "CREATED"
  | "AI_ASSESSED"
  | "AMBULANCE_ASSIGNED"
  | "DRIVER_ACCEPTED"
  | "GOING_TO_PATIENT"
  | "ARRIVED_AT_PATIENT"
  | "PATIENT_ONBOARD"
  | "GOING_TO_HOSPITAL"
  | "ARRIVED_AT_HOSPITAL"
  | "COMPLETED"
  | "CANCELLED";

export type AmbulanceType = "NORMAL" | "ICU" | "ADVANCED_LIFE_SUPPORT";

export type TenantTier = "MUNICIPAL" | "HOSPITAL_NETWORK" | "ENTERPRISE";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  code: string;
  region: string;
  hotline: string;
  center_latitude: number;
  center_longitude: number;
  zoom?: number;
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
  tier?: TenantTier;
  badge_color?: string;
  description?: string;
  total_ambulances?: number;
  total_hospitals?: number;
  created_at?: string;
}

export interface Ambulance {
  id: string;
  tenant_id?: string;
  ambulance_number: string;
  driver_id: string | null;
  driver_name: string | null;
  latitude: number;
  longitude: number;
  status: string;
  ambulance_type: string;
  equipment: string[];
  traffic_score: number;
  current_case_id: string | null;
}

export interface Hospital {
  id: string;
  tenant_id?: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  available_beds: number;
  icu_beds: number;
  emergency_available: boolean;
  specializations: string[];
  status: string;
}

export interface EmergencyConditions {
  conscious?: boolean;
  breathingDifficulty?: boolean;
  heavyBleeding?: boolean;
  chestPain?: boolean;
  cardiacSymptoms?: boolean;
  accident?: boolean;
  severePain?: boolean;
  strokeSymptoms?: boolean;
  injuredCount?: number;
  age?: number | null;
  gender?: string;
  bloodGroup?: string;
  allergies?: string;
  medicalConditions?: string;
}

export interface Emergency {
  id: string;
  tenant_id?: string;
  patient_id: string | null;
  reported_by: string;
  patient_name: string | null;
  emergency_type: string;
  description: string | null;
  severity: string;
  ai_score: number | null;
  ai_reasons: string[];
  conditions: EmergencyConditions;
  latitude: number;
  longitude: number;
  address: string | null;
  ambulance_id: string | null;
  hospital_id: string | null;
  hospital_reasons: string[];
  eta_minutes: number | null;
  status: string;
  created_at: string;
  accepted_at: string | null;
  pickup_at: string | null;
  hospital_arrival_at: string | null;
  completed_at: string | null;
}

export interface TimelineEvent {
  id: string;
  emergency_id: string;
  tenant_id?: string;
  event: string;
  description: string | null;
  user_id: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  tenant_id?: string;
  user_id: string | null;
  role: AppRole | null;
  emergency_id: string | null;
  title: string;
  message: string | null;
  type: string;
  read: boolean;
  created_at: string;
}

export const EMERGENCY_TYPES = [
  "Road Accident",
  "Heart Problem",
  "Breathing Problem",
  "Unconscious",
  "Chest Pain",
  "Heavy Bleeding",
  "Stroke Symptoms",
  "Other",
] as const;
