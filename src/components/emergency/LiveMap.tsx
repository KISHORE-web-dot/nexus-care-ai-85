import { Radio } from "lucide-react";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  kind: "ambulance" | "patient" | "hospital";
  onClick?: () => void;
}

const ICONS: Record<MapMarker["kind"], string> = {
  ambulance: "🚑",
  patient: "📍",
  hospital: "🏥",
};

/**
 * Simulated map surface. Coordinates are projected into a bounded viewport so the
 * prototype works without any external map provider key.
 */
export function LiveMap({
  markers,
  className,
  height = 320,
  caption,
}: {
  markers: MapMarker[];
  className?: string;
  height?: number;
  caption?: string;
}) {
  const projected = useMemo(() => {
    if (!markers.length) return [];
    const lats = markers.map((m) => m.latitude);
    const lngs = markers.map((m) => m.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const padLat = Math.max(0.004, (maxLat - minLat) * 0.35);
    const padLng = Math.max(0.004, (maxLng - minLng) * 0.35);
    const spanLat = maxLat - minLat + padLat * 2;
    const spanLng = maxLng - minLng + padLng * 2;
    return markers.map((m) => ({
      ...m,
      x: ((m.longitude - (minLng - padLng)) / spanLng) * 100,
      y: 100 - ((m.latitude - (minLat - padLat)) / spanLat) * 100,
    }));
  }, [markers]);

  const path = projected.filter((p) => p.kind !== "patient" || true);

  return (
    <div
      className={cn("card-surface relative overflow-hidden bg-navy", className)}
      style={{ height }}
      role="img"
      aria-label={caption ?? "Live emergency map"}
    >
      <svg className="absolute inset-0 size-full opacity-25" aria-hidden>
        <defs>
          <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="white" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {path.length > 1 ? (
          <polyline
            points={path.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="white"
            strokeOpacity="0.4"
            strokeWidth="0.5"
            strokeDasharray="2 2"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </svg>

      {projected.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={m.onClick}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-md px-1 text-center transition-transform hover:scale-110 focus:ring-2 focus:ring-white focus:outline-none"
          style={{ left: `${m.x}%`, top: `${m.y}%` }}
          aria-label={`${m.kind}: ${m.label}`}
        >
          <span className="block text-2xl leading-none drop-shadow">{ICONS[m.kind]}</span>
          <span className="mt-0.5 block rounded bg-black/45 px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-white">
            {m.label}
          </span>
        </button>
      ))}

      <div className="absolute bottom-2 left-3 flex items-center gap-1.5 text-[11px] text-white/80">
        <Radio className="size-3 animate-pulse" aria-hidden />
        Live location updates · {new Date().toLocaleTimeString()}
      </div>
      {!markers.length ? (
        <p className="absolute inset-0 grid place-items-center text-sm text-white/70">No active map data</p>
      ) : null}
    </div>
  );
}
