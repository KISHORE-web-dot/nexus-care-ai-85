/**
 * ambulance.ts — Ambulance types for the SOS dispatch pipeline.
 */

/** Equipment / care capability level of an ambulance unit. */
export type AmbulanceCapability = "BASIC" | "ADVANCED" | "ICU";

/** Live operational status of a dispatched ambulance. */
export type AmbulanceDispatchStatus =
  | "DISPATCHED"
  | "EN_ROUTE"
  | "ARRIVED"
  | "PATIENT_ONBOARD"
  | "GOING_TO_HOSPITAL"
  | "AT_HOSPITAL"
  | "COMPLETED";

/**
 * Ambulance candidate returned by POST /api/dispatch/find-ambulance.
 * Includes a suitability score so the frontend can show ranking.
 */
export interface AmbulanceCandidate {
  id: string;
  vehicleNumber: string;
  distanceKm: number;
  etaMinutes: number;
  capability: AmbulanceCapability;
  driverName?: string;
  /** Composite suitability score (higher = better).
   *  Computed by backend from: availability, distance, ETA, capability, priority match. */
  score: number;
}

/**
 * Assigned ambulance returned by POST /api/dispatch/assign.
 * Contains live status and optional GPS if tracking is connected.
 */
export interface AssignedAmbulance {
  id: string;
  vehicleNumber: string;
  capability: AmbulanceCapability;
  driverName?: string;
  etaMinutes: number;
  distanceKm: number;
  status: AmbulanceDispatchStatus;
  /** Real-time GPS — present only when ambulance tracking is connected. */
  latitude?: number;
  longitude?: number;
}
