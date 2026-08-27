import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Ambulance,
  BellRing,
  BrainCircuit,
  Building2,
  ClipboardList,
  Hospital,
  MapPin,
  Radio,
  ShieldCheck,
  Siren,
  Stethoscope,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartResponse — AI Emergency Response & Ambulance Management" },
      {
        name: "description",
        content:
          "Connecting patients, ambulances, paramedics, hospitals and doctors through intelligent emergency coordination. Educational prototype.",
      },
      { property: "og:title", content: "SmartResponse — AI Emergency Response" },
      {
        property: "og:description",
        content:
          "AI triage, smart ambulance dispatch, live tracking and hospital recommendation in one coordinated emergency platform.",
      },
    ],
  }),
  component: Landing,
});

const STEPS = [
  { icon: Siren, title: "SOS", text: "One press captures GPS location and emergency details." },
  { icon: BrainCircuit, title: "AI Assessment", text: "Deterministic triage engine assigns case priority." },
  { icon: Ambulance, title: "Smart Dispatch", text: "Weighted scoring picks the most suitable ambulance." },
  { icon: Radio, title: "Live Tracking", text: "Patients and family follow every status change." },
  { icon: Hospital, title: "Hospital Match", text: "Beds, ICU and specialisation decide the destination." },
  { icon: Stethoscope, title: "Medical Handover", text: "Doctors see history, vitals context and timeline." },
];

const FEATURES = [
  { icon: BrainCircuit, title: "AI Emergency Priority", text: "Explainable LOW → CRITICAL scoring with reasons." },
  { icon: Ambulance, title: "Smart Ambulance Dispatch", text: "Distance, traffic, capability and severity weighted." },
  { icon: MapPin, title: "GPS Tracking", text: "Browser geolocation with manual fallback entry." },
  { icon: Building2, title: "Hospital Recommendation", text: "ICU, beds, specialisation and travel time." },
  { icon: BellRing, title: "Real-Time Notifications", text: "Role-targeted alerts with unread counts." },
  { icon: ClipboardList, title: "Emergency Timeline", text: "Every action audited from SOS to handover." },
  { icon: Hospital, title: "Hospital Availability", text: "Staff update capacity; dispatch reacts instantly." },
  { icon: Activity, title: "Analytics", text: "Operations dashboard with live charts and tables." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <span className="grid size-9 place-items-center rounded-lg bg-emergency text-emergency-foreground">
            <Siren className="size-5" aria-hidden />
          </span>
          <span className="font-semibold">SmartResponse</span>
          <nav className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth" search={{ demo: "1" }}>
                View demo
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" aria-hidden /> Educational prototype · simulated data
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              AI-Powered Smart Emergency Response
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Connecting patients, ambulances, paramedics, hospitals and doctors through intelligent
              emergency coordination.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="destructive">
                <Link to="/auth" search={{ demo: "1" }}>
                  <Siren className="size-5" aria-hidden /> Request emergency assistance
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">Login</Link>
              </Button>
            </div>
          </div>

          <div className="card-surface space-y-3 p-5">
            <p className="text-sm font-medium text-muted-foreground">Live case walkthrough</p>
            {[
              { label: "SOS received", meta: "Road accident · Coimbatore", tone: "bg-emergency" },
              { label: "AI priority: CRITICAL", meta: "Unconscious · heavy bleeding", tone: "bg-warning" },
              { label: "TN38AB1234 dispatched", meta: "ICU ambulance · ETA 7 min", tone: "bg-primary" },
              { label: "Hospital selected", meta: "Trauma + ICU available", tone: "bg-success" },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <span className={`size-2.5 rounded-full ${row.tone}`} aria-hidden />
                <div>
                  <p className="text-sm font-medium">{row.label}</p>
                  <p className="text-xs text-muted-foreground">{row.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/60">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="card-surface p-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <s.icon className="size-5" aria-hidden />
                  </span>
                  <p className="font-medium">
                    {i + 1}. {s.title}
                  </p>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Platform features</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-surface p-5">
              <f.icon className="size-5 text-primary" aria-hidden />
              <p className="mt-3 font-medium">{f.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-10 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Disclaimer</p>
          <p>
            Prototype for educational and demonstration purposes. AI recommendations are decision support
            and do not replace professional medical judgment. This system is not a certified emergency
            dispatch service — in a real emergency, call your local emergency number.
          </p>
        </div>
      </footer>
    </div>
  );
}
