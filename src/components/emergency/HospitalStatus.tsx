/**
 * HospitalStatus — card showing assigned hospital details.
 * Shows name, emergency/ICU availability, distance, and optional address.
 */
import { Building2, CheckCircle2, XCircle } from "lucide-react";
import type { AssignedHospital } from "@/types/hospital";

interface Props {
  hospital: AssignedHospital;
}

function Avail({ available, label }: { available: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      {available ? (
        <CheckCircle2 className="size-4 text-success" aria-hidden />
      ) : (
        <XCircle className="size-4 text-emergency" aria-hidden />
      )}
      <span className="font-medium">{label}</span>
      <span
        className={
          available ? "text-success text-xs font-semibold" : "text-emergency text-xs font-semibold"
        }
      >
        {available ? "Available" : "Full"}
      </span>
    </div>
  );
}

export function HospitalStatus({ hospital }: Props) {
  return (
    <div className="card-surface space-y-4 rounded-xl p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-primary/10">
          <Building2 className="size-5 text-primary" aria-hidden />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Destination Hospital
          </p>
          <p className="text-lg font-bold">{hospital.name}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Avail available={hospital.emergencyAvailable} label="Emergency" />
        <Avail available={hospital.icuAvailable} label="ICU" />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Distance</dt>
          <dd className="font-medium">{hospital.distanceKm.toFixed(1)} km</dd>
        </div>
        {hospital.travelMinutes != null && (
          <div>
            <dt className="text-xs text-muted-foreground">Travel Time</dt>
            <dd className="font-medium">{hospital.travelMinutes} min</dd>
          </div>
        )}
        {hospital.address && (
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">Address</dt>
            <dd className="font-medium leading-snug">{hospital.address}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
