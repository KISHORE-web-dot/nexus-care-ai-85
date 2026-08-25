import type { LatLng } from "@/lib/geo";

export interface LocationResult extends LatLng {
  accuracy?: number;
  address?: string;
  source: "gps" | "manual" | "fallback";
}

export const FALLBACK_LOCATION: LatLng = { latitude: 11.0168, longitude: 76.9558 };

export function getCurrentLocation(timeoutMs = 10000): Promise<LocationResult> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: "gps",
        }),
      (err) => reject(new Error(err.message || "Unable to detect location.")),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 },
    );
  });
}

/** Reverse geocoding via OpenStreetMap; silently degrades to coordinates. */
export async function describeLocation(point: LatLng): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${point.latitude}&lon=${point.longitude}&zoom=16`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) throw new Error("reverse geocode failed");
    const json = (await res.json()) as { display_name?: string };
    return json.display_name ?? `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`;
  } catch {
    return `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`;
  }
}

export const locationService = { getCurrentLocation, describeLocation, FALLBACK_LOCATION };
