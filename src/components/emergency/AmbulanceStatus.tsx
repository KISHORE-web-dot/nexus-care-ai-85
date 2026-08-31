/**
 * AmbulanceStatus — card showing assigned ambulance details.
 * Shows vehicle number, capability, ETA, and current dispatch status.
 */
import { Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssignedAmbulance } from "@/types/ambulance";

interface Props {
  ambulance: AssignedAmbulance;
}

const STATUS_LABELS: Record<string, string> = {
  DISPATCHED: "Dispatched",
  EN_ROUTE: "En Route",
  ARRIVED: "Arrived at Your Location",
  PATIENT_ONBOARD: "Patient Onboard",
  GOING_TO_HOSPITAL: "Going to Hospital",
  AT_HOSPITAL: "At Hospital",
  COMPLETED: "Completed",
};

export function AmbulanceStatus({ ambulance }: Props) {
  const statusLabel = STATUS_LABELS[ambulance.status] ?? ambulance.status;
  const isActive = ambulance.status === "EN_ROUTE" || ambulance.status === "DISPATCHED";

  return (
    <div className="card-surface space-y-4 rounded-xl p-5">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid size-10 place-items-center rounded-full",
            isActive ? "bg-primary/10" : "bg-success/10",
          )}
        >
          <Truck className={cn("size-5", isActive ? "text-primary" : "text-success")} aria-hidden />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ambulance
          </p>
          <p className="text-lg font-bold tracking-wide">{ambulance.vehicleNumber}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Status</dt>
          <dd className={cn("font-semibold", isActive ? "text-primary" : "text-success")}>
            {statusLabel}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Estimated Arrival</dt>
          <dd className="font-semibold">{ambulance.etaMinutes} min</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Distance</dt>
          <dd className="font-medium">{ambulance.distanceKm.toFixed(1)} km</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Capability</dt>
          <dd className="font-medium">{ambulance.capability}</dd>
        </div>
        {ambulance.driverName && (
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">Driver</dt>
            <dd className="font-medium">{ambulance.driverName}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
