import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Ambulance,
  ArrowLeft,
  Bell,
  Building2,
  ClipboardList,
  Gauge,
  History,
  Hospital,
  LogOut,
  Menu,
  Radio,
  Siren,
  Stethoscope,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeSync } from "@/hooks/useRealtime";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/types";
import { listNotifications } from "@/services/notificationService";
import { TenantSwitcher } from "./TenantSwitcher";
import { ThemeToggle } from "./ThemeToggle";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const COMMON: NavItem[] = [
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/history", label: "Emergency History", icon: History },
  { to: "/profile", label: "Profile", icon: UserRound },
];

const NAV: Record<AppRole, NavItem[]> = {
  PATIENT: [
    { to: "/dashboard", label: "Dashboard", icon: Gauge },
    { to: "/sos", label: "Emergency SOS", icon: Siren },
    { to: "/live", label: "Live Emergency", icon: Radio },
    { to: "/hospitals", label: "Hospitals", icon: Hospital },
    ...COMMON,
  ],
  DRIVER: [
    { to: "/dashboard", label: "Dashboard", icon: Gauge },
    { to: "/requests", label: "Emergency Requests", icon: ClipboardList },
    { to: "/live", label: "Active Emergency", icon: Ambulance },
    { to: "/hospitals", label: "Hospitals", icon: Hospital },
    ...COMMON,
  ],
  PARAMEDIC: [
    { to: "/dashboard", label: "Dashboard", icon: Gauge },
    { to: "/requests", label: "Emergency Requests", icon: ClipboardList },
    { to: "/live", label: "Active Emergency", icon: Ambulance },
    ...COMMON,
  ],
  HOSPITAL: [
    { to: "/dashboard", label: "Dashboard", icon: Gauge },
    { to: "/hospital-center", label: "Emergency Control", icon: Building2 },
    { to: "/hospitals", label: "Hospital Network", icon: Hospital },
    ...COMMON,
  ],
  DOCTOR: [
    { to: "/dashboard", label: "Dashboard", icon: Gauge },
    { to: "/doctor", label: "Incoming Patients", icon: Stethoscope },
    ...COMMON,
  ],
  ADMIN: [
    { to: "/dashboard", label: "Dashboard", icon: Gauge },
    { to: "/admin", label: "Operations Center", icon: Activity },
    { to: "/hospitals", label: "Hospitals", icon: Hospital },
    ...COMMON,
  ],
};

function NavList({ role, onNavigate }: { role: AppRole; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1" aria-label="Main navigation">
      {(NAV[role] ?? NAV.PATIENT).map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-3 py-4">
      <span className="grid size-9 place-items-center rounded-lg bg-emergency text-emergency-foreground">
        <Siren className="size-5" aria-hidden />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-sidebar-foreground">SmartResponse</p>
        <p className="text-[11px] text-sidebar-foreground/60">Emergency Coordination</p>
      </div>
    </div>
  );
}

export function AppShell({
  title,
  showBack,
  backTo,
  children,
}: {
  title: string;
  showBack?: boolean;
  backTo?: string;
  children: ReactNode;
}) {
  useRealtimeSync();
  const { role, name, signOut } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const activeRole = (role ?? "PATIENT") as AppRole;

  const isDetailPage = showBack ?? (pathname !== "/dashboard" && pathname !== "/");

  const handleBack = () => {
    if (backTo) {
      navigate({ to: backTo });
    } else if (window.history.length > 1) {
      router.history.back();
    } else {
      navigate({ to: "/dashboard" });
    }
  };

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: listNotifications,
  });
  const unread = notifications.filter((n) => !n.read).length;

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar p-3 lg:flex">
        <Brand />
        <div className="mb-3 px-1">
          <TenantSwitcher className="w-full bg-sidebar-accent/50 border-sidebar-border" />
        </div>
        <NavList role={activeRole} />
        <div className="mt-auto space-y-2 p-2">
          <p className="rounded-md bg-sidebar-accent px-3 py-2 text-[11px] text-sidebar-accent-foreground/80">
            Educational prototype — not a real dispatch service.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur">
          {isDetailPage ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-8 w-8 shrink-0 rounded-lg hover:bg-accent"
              aria-label="Go back"
            >
              <ArrowLeft className="size-4" />
            </Button>
          ) : null}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden shrink-0"
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-3">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Brand />
              <div className="mb-3 px-1">
                <TenantSwitcher className="w-full bg-sidebar-accent/50 border-sidebar-border" />
              </div>
              <NavList role={activeRole} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold sm:text-lg">{title}</h1>
            <p className="truncate text-xs text-muted-foreground">
              {name} · {activeRole}
            </p>
          </div>

          <div className="hidden md:flex ml-4 max-w-xs">
            <TenantSwitcher />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Notifications"
            >
              <Link to="/notifications">
                <Bell className="size-5" />
                {unread > 0 ? (
                  <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-emergency px-1 text-[10px] font-semibold text-emergency-foreground">
                    {unread}
                  </span>
                ) : null}
              </Link>
            </Button>
            {activeRole === "PATIENT" ? (
              <Button asChild variant="destructive" size="sm" className="hidden sm:inline-flex">
                <Link to="/sos">
                  <Siren className="size-4" aria-hidden /> SOS
                </Link>
              </Button>
            ) : null}
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
              <LogOut className="size-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
