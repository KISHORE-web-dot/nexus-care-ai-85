import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: "default" | "emergency" | "success" | "warning";
}

const TONES: Record<string, string> = {
  default: "bg-primary/10 text-primary",
  emergency: "bg-emergency/12 text-emergency",
  success: "bg-success/12 text-success",
  warning: "bg-warning/20 text-warning-foreground",
};

export function StatsCard({ label, value, icon: Icon, hint, tone = "default" }: Props) {
  return (
    <div className="card-surface flex items-start gap-4 p-4">
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", TONES[tone])}>
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-semibold tracking-tight">{value}</p>
        {hint ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}
