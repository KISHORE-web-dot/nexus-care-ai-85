export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Haversine distance in kilometres. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Rough ETA in minutes given a distance and a demo traffic score (1 = clear, 10 = gridlock). */
export function etaMinutes(km: number, trafficScore = 5): number {
  const baseSpeed = 45; // km/h with sirens on open roads
  const speed = Math.max(14, baseSpeed - trafficScore * 2.6);
  return Math.max(2, Math.round((km / speed) * 60) + 1);
}

/** Move `from` towards `to` by a fraction of the remaining distance. */
export function stepToward(from: LatLng, to: LatLng, fraction: number): LatLng {
  return {
    latitude: from.latitude + (to.latitude - from.latitude) * fraction,
    longitude: from.longitude + (to.longitude - from.longitude) * fraction,
  };
}

export function formatCoord(value: number): string {
  return value.toFixed(5);
}
