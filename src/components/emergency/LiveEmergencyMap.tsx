/**
 * LiveEmergencyMap — honest map placeholder for the patient SOS dashboard.
 *
 * Shows the patient's location marker.
 * When ambulance GPS is available (via pipeline state), also shows the ambulance marker.
 * When tracking is not connected, shows an honest notice instead of fake movement.
 */
import { MapPin, Navigation } from "lucide-react";
import type { LocationData } from "@/types/location";
import type { AssignedAmbulance } from "@/types/ambulance";

interface Props {
  location: LocationData;
  ambulance?: AssignedAmbulance | undefined;
}

export function LiveEmergencyMap({ location, ambulance }: Props) {
  const hasAmbulanceGPS = ambulance?.latitude != null && ambulance.longitude != null;

  return (
    <div className="card-surface space-y-3 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Live Map
        </p>
        {hasAmbulanceGPS && (
          <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
            <span className="size-1.5 rounded-full bg-success animate-pulse" aria-hidden /> Live
          </span>
        )}
      </div>

      {/* Map placeholder with location markers */}
      <div
        className="relative flex h-48 items-center justify-center rounded-lg bg-muted/40 border border-border overflow-hidden"
        role="img"
        aria-label={`Map showing your location at ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
      >
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.3) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Patient marker (centre) */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="grid size-10 place-items-center rounded-full bg-emergency/20 border-2 border-emergency">
            <MapPin className="size-5 text-emergency" aria-hidden />
          </div>
          <span className="mt-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-semibold text-emergency">
            You
          </span>
        </div>

        {/* Ambulance marker (if GPS connected) */}
        {hasAmbulanceGPS && (
          <div className="absolute top-6 right-10 z-10 flex flex-col items-center animate-pulse">
            <div className="grid size-8 place-items-center rounded-full bg-primary/20 border-2 border-primary">
              <Navigation className="size-4 text-primary" aria-hidden />
            </div>
            <span className="mt-0.5 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              🚑
            </span>
          </div>
        )}
      </div>

      {/* Coordinates */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono">
          {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
        </span>
        {location.accuracy > 0 && <span>± {Math.round(location.accuracy)} m</span>}
      </div>

      {/* Tracking status */}
      {!hasAmbulanceGPS && (
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          Live ambulance tracking will be available when GPS tracking is connected.
        </p>
      )}
    </div>
  );
}
