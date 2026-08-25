import { cn } from "@/lib/utils";

const PRIORITY_STYLES: Record<string, string> = {
  CRITICAL: "bg-emergency text-emergency-foreground",
  HIGH: "bg-warning text-warning-foreground",
  MEDIUM: "bg-info text-info-foreground",
  LOW: "bg-success text-success-foreground",
};

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide uppercase",
        PRIORITY_STYLES[priority] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {priority}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: "bg-success/12 text-success border-success/30",
  COMPLETED: "bg-success/12 text-success border-success/30",
  OFFLINE: "bg-muted text-muted-foreground border-border",
  BUSY: "bg-warning/15 text-warning-foreground border-warning/40",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status] ?? "bg-primary/10 text-primary border-primary/25",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {status.replace(/_/g, " ")}
    </span>
  );
}
