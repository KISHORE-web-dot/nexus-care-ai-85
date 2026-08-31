import { Radio, X } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  kind: "ambulance" | "patient" | "hospital";
  /** Optional extra detail lines shown in the popover */
  detail?: string;
  onClick?: () => void;
}

const ICONS: Record<MapMarker["kind"], string> = {
  ambulance: "🚑",
  patient: "📍",
  hospital: "🏥",
};

const KIND_LABEL: Record<MapMarker["kind"], string> = {
  ambulance: "Ambulance",
  patient: "Patient",
  hospital: "Hospital",
};

/**
 * Simulated map surface. Coordinates are projected into a bounded viewport so the
 * prototype works without any external map provider key.
 * Markers are now clickable and show a floating detail popover.
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
  const selected = projected.find((p) => p.id === selectedId) ?? null;

  return (
    <div
      className={cn("card-surface relative overflow-hidden bg-navy", className)}
      style={{ height }}
      role="img"
      aria-label={caption ?? "Live emergency map"}
      onClick={(e) => {
        // Close popover when clicking the map background
        if (e.target === e.currentTarget) setSelectedId(null);
      }}
    >
      <svg className="absolute inset-0 size-full opacity-25" aria-hidden>
        <defs>
          <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="white" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
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

      {projected.map((m) => {
        const isSelected = m.id === selectedId;
        return (
          <button
            key={m.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedId(isSelected ? null : m.id);
              m.onClick?.();
            }}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-md px-1 text-center transition-transform focus:ring-2 focus:ring-white focus:outline-none",
              isSelected ? "scale-125 z-10" : "hover:scale-110",
            )}
            style={{ left: `${m.x}%`, top: `${m.y}%` }}
            aria-label={`${m.kind}: ${m.label}`}
            aria-pressed={isSelected}
          >
            <span className="block text-2xl leading-none drop-shadow">{ICONS[m.kind]}</span>
            <span
              className={cn(
                "mt-0.5 block rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-white",
                isSelected ? "bg-primary/80" : "bg-black/45",
              )}
            >
              {m.label}
            </span>
          </button>
        );
      })}

      {/* Floating popover for the selected marker */}
      {selected ? (
        <div
          className="absolute z-20 w-48 rounded-lg border border-white/20 bg-navy/95 p-3 shadow-xl backdrop-blur-sm"
          style={{
            left: `${Math.min(Math.max(selected.x, 10), 70)}%`,
            top: `${Math.max(selected.y - 28, 4)}%`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-[11px] font-semibold text-white/60 uppercase tracking-wide">
                {ICONS[selected.kind]} {KIND_LABEL[selected.kind]}
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-white">{selected.label}</p>
              {selected.detail ? (
                <p className="mt-1 text-xs text-white/70">{selected.detail}</p>
              ) : null}
              <p className="mt-1.5 text-[10px] font-mono text-white/50">
                {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="shrink-0 rounded p-0.5 text-white/60 hover:text-white focus:outline-none"
              aria-label="Close"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="absolute bottom-2 left-3 flex items-center gap-1.5 text-[11px] text-white/80">
        <Radio className="size-3 animate-pulse" aria-hidden />
        Live location updates · {new Date().toLocaleTimeString()}
      </div>
      {!markers.length ? (
        <p className="absolute inset-0 grid place-items-center text-sm text-white/70">
          No active map data
        </p>
      ) : null}
    </div>
  );
}
