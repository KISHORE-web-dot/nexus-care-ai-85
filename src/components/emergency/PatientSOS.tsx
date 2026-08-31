/**
 * PatientSOS — confirmation card for the "I NEED HELP" patient flow.
 * Designed to look like an overlay dialog within the page layout.
 */
import { AlertTriangle, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onConfirm: () => void;
  onCancel: () => void;
}

export function PatientSOS({ onConfirm, onCancel }: Props) {
  return (
    <div className="space-y-5">
      <div className="card-surface space-y-5 rounded-2xl p-7 text-center">
        {/* Icon */}
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-emergency/10">
          <AlertTriangle className="size-8 text-emergency" aria-hidden />
        </span>

        {/* Heading */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Request Emergency Assistance?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Emergency assistance will be requested using your current location.
            <br />
            Please only proceed if this is a genuine emergency.
          </p>
        </div>

        {/* Safety note */}
        <p className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-xs text-warning-foreground">
          This is an educational prototype. In a real emergency, always call your local emergency
          number (112 / 911).
        </p>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            onClick={onCancel}
            className="sm:min-w-28"
            aria-label="Cancel — go back"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="animate-sos gap-2 sm:min-w-48"
            aria-label="Yes, send SOS emergency request"
          >
            <Siren className="size-4" aria-hidden />
            YES, SEND SOS
          </Button>
        </div>
      </div>
    </div>
  );
}
