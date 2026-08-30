/**
 * hospital.ts — Hospital recommendation types for the SOS pipeline.
 */

/**
 * Hospital candidate returned by POST /api/hospitals/recommend.
 * The suitability score accounts for: ER availability, ICU, distance,
 * travel time, specialisation match, and emergency capacity.
 */
export interface HospitalCandidate {
  id: string;
  name: string;
  distanceKm: number;
  address?: string;
  emergencyAvailable: boolean;
  icuAvailable: boolean;
  specializations?: string[];
  /** Estimated ambulance travel time in minutes. */
  travelMinutes?: number;
  /** Composite suitability score (higher = better). */
  score: number;
}

/**
 * Assigned hospital returned by POST /api/hospitals/assign.
 */
export interface AssignedHospital {
  id: string;
  name: string;
  distanceKm: number;
  address?: string;
  emergencyAvailable: boolean;
  icuAvailable: boolean;
  specializations?: string[];
  travelMinutes?: number;
  /** Hospital GPS position for map display (if provided by backend). */
  latitude?: number;
  longitude?: number;
}
