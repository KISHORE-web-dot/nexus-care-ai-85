/**
 * location.ts — GPS and location capture types for the SOS pipeline.
 * Separate from LocationCapture in emergency.ts (adds GPS timestamp field).
 */

export interface GPSResult {
  latitude: number;
  longitude: number;
  accuracy: number; // metres; 0 for manual
  timestamp: string; // ISO-8601
}

/** Full location data used throughout the SOS pipeline. */
export interface LocationData extends GPSResult {
  /** Reverse-geocoded human-readable address (if available). */
  address?: string | undefined;
  source: "gps" | "manual";
}
