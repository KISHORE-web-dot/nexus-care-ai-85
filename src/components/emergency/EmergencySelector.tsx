/**
 * EmergencySelector — first screen of the public /emergency flow.
 * Two large, mobile-friendly cards: I NEED HELP and HELP SOMEONE.
 */
import { Heart, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onSelect: (type: "patient" | "bystander") => void;
}

const OPTIONS = [
  {
    type: "patient" as const,
    icon: Heart,
    title: "I NEED HELP",
    description: "Request emergency assistance for yourself.",
    accent: "border-emergency/60 hover:border-emergency hover:bg-emergency/5 focus-visible:ring-emergency",
    iconBg: "bg-emergency/10 text-emergency",
  },
  {
    type: "bystander" as const,
    icon: Users,
    title: "HELP SOMEONE",
    description:
      "Request emergency assistance for someone who may be injured, unconscious, or unable to use their phone.",
    accent: "border-primary/60 hover:border-primary hover:bg-primary/5 focus-visible:ring-primary",
    iconBg: "bg-primary/10 text-primary",
  },
] as const;

export function EmergencySelector({ onSelect }: Props) {
  return (
    <div className="space-y-5">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Request Emergency Assistance</h1>
        <p className="text-sm text-muted-foreground">Who needs help?</p>
      </div>

      <div className="grid gap-4">
        {OPTIONS.map(({ type, icon: Icon, title, description, accent, iconBg }) => (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={cn(
              "card-surface flex items-start gap-5 rounded-2xl border-2 p-6 text-left transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              accent,
            )}
            aria-label={title}
          >
            <span className={cn("mt-0.5 grid size-12 shrink-0 place-items-center rounded-xl", iconBg)}>
              <Icon className="size-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-bold tracking-wide">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

