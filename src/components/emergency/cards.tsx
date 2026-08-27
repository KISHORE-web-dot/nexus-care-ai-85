import { Ambulance as AmbulanceIcon, BedDouble, HeartPulse, MapPin, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Ambulance, Emergency, Hospital } from "@/lib/types";
import type { AmbulanceCandidate } from "@/services/ambulanceService";
import type { HospitalRecommendation } from "@/services/hospitalRecommendationService";
import { PriorityBadge, StatusBadge } from "./badges";

export function AmbulanceCard({
  candidate,
  onAssign,
  assigning,
  best,
}: {
  candidate: AmbulanceCandidate;
  onAssign?: () => void;
  assigning?: boolean;
  best?: boolean;
}) {
  const a = candidate.ambulance;
  return (
    <div className="card-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-semibold">
            <AmbulanceIcon className="size-4 text-primary" aria-hidden />
            {a.ambulance_number}
            {best ? (
              <span className="rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                BEST MATCH
              </span>
            ) : null}
          </p>
          <p className="text-xs text-muted-foreground">{a.ambulance_type.replace(/_/g, " ")}</p>
        </div>
        <StatusBadge status={a.status} />
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Distance</dt>
          <dd className="font-medium">{candidate.distanceKm.toFixed(1)} km</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">ETA</dt>
          <dd className="font-medium">{candidate.etaMinutes} min</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Suitability</dt>
          <dd className="font-medium">{candidate.score}</dd>
        </div>
      </dl>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {a.equipment.map((e) => (
          <li key={e} className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
            {e}
          </li>
        ))}
      </ul>
      {onAssign ? (
        <Button className="mt-4 w-full" onClick={onAssign} disabled={assigning}>
          {assigning ? "Assigning…" : "Assign ambulance"}
        </Button>
      ) : null}
    </div>
  );
}

export function HospitalCard({
  recommendation,
  onSelect,
  best,
}: {
  recommendation: HospitalRecommendation;
  onSelect?: () => void;
  best?: boolean;
}) {
  const h = recommendation.hospital;
  return (
    <div className="card-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">
            {h.name} {best ? <span aria-label="recommended">⭐</span> : null}
          </p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" aria-hidden /> {recommendation.distanceKm.toFixed(1)} km · {h.address}
          </p>
        </div>
        <StatusBadge status={h.emergency_available ? "AVAILABLE" : "BUSY"} />
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Beds</dt>
          <dd className="font-medium">{h.available_beds}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">ICU</dt>
          <dd className="font-medium">{h.icu_beds}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Score</dt>
          <dd className="font-medium">{recommendation.score}</dd>
        </div>
      </dl>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {h.specializations.map((s) => (
          <li key={s} className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
            {s}
          </li>
        ))}
      </ul>
      <ul className="mt-3 space-y-0.5 text-xs text-muted-foreground">
        {recommendation.reasons.slice(0, 4).map((r) => (
          <li key={r}>• {r}</li>
        ))}
      </ul>
      {onSelect ? (
        <Button variant="outline" className="mt-4 w-full" onClick={onSelect}>
          Select hospital
        </Button>
      ) : null}
    </div>
  );
}

export function EmergencyCard({
  emergency,
  ambulance,
  hospital,
  action,
}: {
  emergency: Emergency;
  ambulance?: Ambulance | null;
  hospital?: Hospital | null;
  action?: React.ReactNode;
}) {
  return (
    <article className="card-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-semibold">
            <HeartPulse className="size-4 text-emergency" aria-hidden />
            {emergency.emergency_type}
          </p>
          <p className="text-xs text-muted-foreground">
            Case {emergency.id.slice(0, 8).toUpperCase()} ·{" "}
            {new Date(emergency.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={emergency.severity} />
          <StatusBadge status={emergency.status} />
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">Patient</dt>
          <dd className="font-medium">{emergency.patient_name ?? "Unknown"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Ambulance</dt>
          <dd className="font-medium">{ambulance?.ambulance_number ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Hospital</dt>
          <dd className="truncate font-medium">{hospital?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">ETA</dt>
          <dd className="flex items-center gap-1 font-medium">
            <Timer className="size-3" aria-hidden /> {emergency.eta_minutes ?? "—"} min
          </dd>
        </div>
      </dl>
      {emergency.description ? (
        <p className="mt-3 text-sm text-muted-foreground">{emergency.description}</p>
      ) : null}
      {action ? <div className="mt-4 flex flex-wrap gap-2">{action}</div> : null}
    </article>
  );
}

export function ResourceStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
      <BedDouble className="size-4 text-primary" aria-hidden />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-semibold">{value}</span>
    </div>
  );
}
