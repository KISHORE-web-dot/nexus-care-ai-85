import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { EmptyState, LoadingState } from "@/components/emergency/states";
import { Button } from "@/components/ui/button";
import type { AppNotification } from "@/lib/types";
import { listNotifications, markAllRead, markRead } from "@/services/notificationService";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — SmartResponse" },
      { name: "description", content: "Every dispatch, status change and hospital alert in one feed." },
      { property: "og:title", content: "Notifications — SmartResponse" },
      { property: "og:description", content: "Real-time emergency alerts for your role." },
    ],
  }),
  component: NotificationsPage,
});

const TONE: Record<string, string> = {
  CRITICAL: "border-emergency/50 bg-emergency/10",
  WARNING: "border-warning/50 bg-warning/10",
  SUCCESS: "border-success/50 bg-success/10",
  INFO: "border-border bg-card",
};

function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useQuery<AppNotification[]>({
    queryKey: ["notifications"],
    queryFn: listNotifications,
  });

  const unread = items.filter((n) => !n.read);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });

  return (
    <AppShell title="Notifications">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{unread.length} unread</p>
          <Button
            variant="outline"
            disabled={!unread.length}
            onClick={async () => {
              await markAllRead(unread.map((n) => n.id));
              refresh();
            }}
          >
            Mark all as read
          </Button>
        </div>

        {isLoading ? <LoadingState label="Loading notifications…" /> : null}

        {!isLoading && !items.length ? (
          <EmptyState title="No notifications yet" description="Alerts appear here as emergencies progress." />
        ) : null}

        <ul className="space-y-3">
          {items.map((n) => (
            <li key={n.id} className={`rounded-lg border p-4 ${TONE[n.type] ?? TONE["INFO"]}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-medium">
                    <Bell className="size-4" aria-hidden />
                    {n.title}
                    {!n.read ? <span className="size-2 rounded-full bg-primary" aria-label="unread" /> : null}
                  </p>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  {n.emergency_id ? (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/emergency/$id" params={{ id: n.emergency_id }}>
                        View case
                      </Link>
                    </Button>
                  ) : null}
                  {!n.read ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await markRead(n.id);
                        refresh();
                      }}
                    >
                      Mark read
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
