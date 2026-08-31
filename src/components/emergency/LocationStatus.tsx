/**
 * LocationStatus — GPS detection step with retry and manual fallback.
 * Uses the existing locationService (getCurrentLocation, describeLocation).
 *
 * States: detecting → success | error
 * Error state provides: Retry Location + Enter Location Manually options.
 */
import { MapPin, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState, ErrorState } from "@/components/emergency/states";
import { cn } from "@/lib/utils";
import { getCurrentLocation, describeLocation } from "@/services/locationService";
import type { LocationCapture } from "@/types/emergency";

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onLocationCaptured: (location: LocationCapture) => void;
  onBack: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

type DetectState = "detecting" | "success" | "error";

export function LocationStatus({ onLocationCaptured, onBack }: Props) {
  const [detectState, setDetectState] = useState<DetectState>("detecting");
  const [location, setLocation] = useState<LocationCapture | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);

  // Manual entry state
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [manualLatErr, setManualLatErr] = useState(false);
  const [manualLngErr, setManualLngErr] = useState(false);

  // ── GPS detection ──────────────────────────────────────────────────────────

  const detect = useCallback(async () => {
    setDetectState("detecting");
    setGpsError(null);
    setManualMode(false);

    try {
      const result = await getCurrentLocation();
      const address = await describeLocation(result);
      const captured: LocationCapture = {
        latitude: result.latitude,
        longitude: result.longitude,
        accuracy: result.accuracy ?? 0,
        ...(address ? { address } : {}),
        source: "gps",
      };
      setLocation(captured);
      setDetectState("success");
    } catch (err) {
      setGpsError(
        err instanceof Error
          ? err.message
          : "Unable to detect your location. Please ensure location permission is granted.",
      );
      setDetectState("error");
    }
  }, []);

  useEffect(() => {
    void detect();
  }, [detect]);

  // ── Manual entry submission ────────────────────────────────────────────────

  const handleManualSubmit = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    const latOk = !isNaN(lat) && lat >= -90 && lat <= 90;
    const lngOk = !isNaN(lng) && lng >= -180 && lng <= 180;

    setManualLatErr(!latOk);
    setManualLngErr(!lngOk);

    if (!latOk || !lngOk) return;

    onLocationCaptured({
      latitude: lat,
      longitude: lng,
      accuracy: 0,
      source: "manual",
    });
  };

  // ── Render: Detecting ──────────────────────────────────────────────────────

  if (detectState === "detecting") {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Getting your location</h2>
        <LoadingState label="Requesting GPS permission…" />
        <p className="rounded-lg border border-info/40 bg-info/10 px-4 py-3 text-xs text-muted-foreground">
          Your browser may ask for permission to access your location. Please allow this so
          emergency responders can find you quickly.
        </p>
      </div>
    );
  }

  // ── Render: Success ────────────────────────────────────────────────────────

  if (detectState === "success" && location) {
    return (
      <div className="space-y-5">
        <h2 className="text-xl font-bold tracking-tight">Location detected</h2>

        <div className="card-surface space-y-4 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-success/10">
              <MapPin className="size-5 text-success" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-success">📍 Current location detected</p>
              <p className="text-xs text-muted-foreground">
                Emergency responders will use this location.
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Latitude</dt>
              <dd className="font-mono font-medium">{location.latitude.toFixed(5)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Longitude</dt>
              <dd className="font-mono font-medium">{location.longitude.toFixed(5)}</dd>
            </div>
            {location.accuracy > 0 && (
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Accuracy</dt>
                <dd className="font-medium">± {Math.round(location.accuracy)} metres</dd>
              </div>
            )}
            {location.address && (
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Approximate address</dt>
                <dd className="font-medium leading-snug">{location.address}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} aria-label="Back">
            Back
          </Button>
          <Button
            className="flex-1"
            onClick={() => onLocationCaptured(location)}
            aria-label="Confirm location and continue"
          >
            Confirm Location &amp; Continue
          </Button>
        </div>
      </div>
    );
  }

  // ── Render: Error / Manual entry ───────────────────────────────────────────

  if (manualMode) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Enter Location Manually</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Accurate location is important for emergency response. Enter your coordinates below.
          </p>
        </div>

        <div className="card-surface space-y-4 rounded-xl p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="manual-lat">
                Latitude <span className="text-emergency">*</span>
              </Label>
              <Input
                id="manual-lat"
                type="number"
                step="any"
                placeholder="e.g. 10.9876"
                value={manualLat}
                onChange={(e) => {
                  setManualLat(e.target.value);
                  setManualLatErr(false);
                }}
                aria-invalid={manualLatErr}
                className={cn(manualLatErr && "border-emergency focus-visible:ring-emergency")}
                aria-describedby={manualLatErr ? "lat-error" : undefined}
              />
              {manualLatErr && (
                <p id="lat-error" className="text-xs text-emergency">
                  Enter a valid latitude (−90 to 90).
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manual-lng">
                Longitude <span className="text-emergency">*</span>
              </Label>
              <Input
                id="manual-lng"
                type="number"
                step="any"
                placeholder="e.g. 76.9558"
                value={manualLng}
                onChange={(e) => {
                  setManualLng(e.target.value);
                  setManualLngErr(false);
                }}
                aria-invalid={manualLngErr}
                className={cn(manualLngErr && "border-emergency focus-visible:ring-emergency")}
                aria-describedby={manualLngErr ? "lng-error" : undefined}
              />
              {manualLngErr && (
                <p id="lng-error" className="text-xs text-emergency">
                  Enter a valid longitude (−180 to 180).
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Tip: You can find your coordinates using Google Maps → long press on your location →
            copy the coordinates.
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setManualMode(false)}>
            Back
          </Button>
          <Button
            className="flex-1"
            onClick={handleManualSubmit}
            aria-label="Submit manually entered location"
          >
            Use This Location
          </Button>
        </div>
      </div>
    );
  }

  // GPS error state
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Unable to detect your location</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Accurate location is important so emergency responders can find you quickly.
        </p>
      </div>

      <ErrorState
        message={gpsError ?? "Location permission was denied or is unavailable."}
        onRetry={detect}
      />

      <div className="grid gap-3">
        <Button
          onClick={detect}
          variant="outline"
          className="w-full gap-2"
          aria-label="Retry GPS location detection"
        >
          <RefreshCw className="size-4" aria-hidden />
          Retry Location
        </Button>
        <Button
          onClick={() => setManualMode(true)}
          variant="secondary"
          className="w-full"
          aria-label="Enter location coordinates manually"
        >
          Enter Location Manually
        </Button>
        <Button variant="ghost" onClick={onBack} className="w-full">
          Back
        </Button>
      </div>
    </div>
  );
}
