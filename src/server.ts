/**
 * server.ts — SSR entry + prototype API routes.
 *
 * Intercepts /api/* requests and returns simulated emergency-response data.
 * All other requests are forwarded to the TanStack Start SSR handler.
 *
 * This is a PROTOTYPE simulation layer — clearly separated from the SSR
 * handler so it can be swapped for a real backend when available.
 */

import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

// ── Prototype API handlers ────────────────────────────────────────────────────

let emergencyCounter = 0;

interface StoredEmergency {
  id: string;
  source: string;
  emergencyType: string;
  conscious: boolean | null;
  peopleAffected: number;
  description: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  priority: string | null;
  status: string;
  createdAt: string;
}

const emergencies = new Map<string, StoredEmergency>();

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function parseBody(request: Request): Promise<any> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

/** Try to handle as an API request. Returns null if not an API route. */
async function handleApiRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;

  // ── POST /api/emergencies ─────────────────────────────────────────────────
  if (path === "/api/emergencies" && request.method === "POST") {
    const body = await parseBody(request);
    emergencyCounter++;
    const year = new Date().getFullYear();
    const id = `EMG-${year}-${String(emergencyCounter).padStart(5, "0")}`;

    const emergency: StoredEmergency = {
      id,
      source: String(body.source ?? "PATIENT"),
      emergencyType: String(body.emergencyType ?? "UNKNOWN"),
      conscious: body.conscious as boolean | null,
      peopleAffected: Number(body.peopleAffected ?? 1),
      description: String(body.description ?? ""),
      latitude: Number(body.latitude ?? 0),
      longitude: Number(body.longitude ?? 0),
      accuracy: Number(body.accuracy ?? 0),
      priority: null,
      status: "CREATED",
      createdAt: new Date().toISOString(),
    };
    emergencies.set(id, emergency);
    return json(emergency, 201);
  }

  // ── POST /api/emergencies/:id/assess ──────────────────────────────────────
  const assessMatch = path.match(/^\/api\/emergencies\/([^/]+)\/assess$/);
  if (assessMatch && request.method === "POST") {
    const id = assessMatch[1]!;
    const emergency = emergencies.get(id);
    if (!emergency) return json({ error: "Emergency not found" }, 404);

    // Simulate AI assessment
    const priorities = ["HIGH", "CRITICAL", "MEDIUM", "HIGH"] as const;
    const priority = priorities[emergencyCounter % priorities.length]!;
    const confidence = 0.85 + Math.random() * 0.12;

    emergency.priority = priority;
    emergency.status = "PRIORITY_ASSIGNED";

    return json({
      priority,
      confidence: Math.round(confidence * 100) / 100,
      fallback: false,
    });
  }

  // ── POST /api/dispatch/find-ambulance ─────────────────────────────────────
  if (path === "/api/dispatch/find-ambulance" && request.method === "POST") {
    // consume body so it doesn't hang
    await parseBody(request);

    const candidates = [
      {
        id: "AMB-001",
        vehicleNumber: "TN-38-AX-1234",
        distanceKm: Math.round((1.2 + Math.random() * 0.5) * 10) / 10,
        etaMinutes: 5 + Math.floor(Math.random() * 3),
        capability: "ADVANCED",
        driverName: "Raj Kumar",
        score: 95,
      },
      {
        id: "AMB-002",
        vehicleNumber: "TN-38-BZ-5678",
        distanceKm: Math.round((2.4 + Math.random() * 0.8) * 10) / 10,
        etaMinutes: 8 + Math.floor(Math.random() * 4),
        capability: "BASIC",
        driverName: "Suresh M",
        score: 78,
      },
      {
        id: "AMB-003",
        vehicleNumber: "TN-38-CY-9012",
        distanceKm: Math.round((3.1 + Math.random() * 1.0) * 10) / 10,
        etaMinutes: 12 + Math.floor(Math.random() * 3),
        capability: "ICU",
        driverName: "Vikram S",
        score: 72,
      },
    ];

    return json({ candidates });
  }

  // ── POST /api/dispatch/assign ─────────────────────────────────────────────
  if (path === "/api/dispatch/assign" && request.method === "POST") {
    const body = await parseBody(request);
    const emergencyId = String(body.emergencyId ?? "");
    const emergency = emergencies.get(emergencyId);
    if (emergency) {
      emergency.status = "AMBULANCE_ASSIGNED";
    }

    return json({
      id: String(body.ambulanceId ?? "AMB-001"),
      vehicleNumber: "TN-38-AX-1234",
      capability: "ADVANCED",
      driverName: "Raj Kumar",
      etaMinutes: 7,
      distanceKm: 1.4,
      status: "EN_ROUTE",
    });
  }

  // ── POST /api/hospitals/recommend ─────────────────────────────────────────
  if (path === "/api/hospitals/recommend" && request.method === "POST") {
    // consume body so it doesn't hang
    await parseBody(request);

    const candidates = [
      {
        id: "HSP-001",
        name: "KMCH Hospital",
        distanceKm: 3.2,
        address: "Avinashi Road, Coimbatore, Tamil Nadu 641014",
        emergencyAvailable: true,
        icuAvailable: true,
        specializations: ["Trauma", "Cardiology", "Neurology"],
        travelMinutes: 8,
        score: 94,
      },
      {
        id: "HSP-002",
        name: "PSG Hospitals",
        distanceKm: 4.1,
        address: "Peelamedu, Coimbatore, Tamil Nadu 641004",
        emergencyAvailable: true,
        icuAvailable: true,
        specializations: ["Trauma", "Orthopedics"],
        travelMinutes: 11,
        score: 88,
      },
      {
        id: "HSP-003",
        name: "Sri Ramakrishna Hospital",
        distanceKm: 2.8,
        address: "Siddhapudur, Coimbatore, Tamil Nadu 641044",
        emergencyAvailable: true,
        icuAvailable: false,
        specializations: ["General", "Pediatrics"],
        travelMinutes: 7,
        score: 75,
      },
    ];

    return json({ candidates });
  }

  // ── POST /api/hospitals/assign ────────────────────────────────────────────
  if (path === "/api/hospitals/assign" && request.method === "POST") {
    const body = await parseBody(request);
    const emergencyId = String(body.emergencyId ?? "");
    const emergency = emergencies.get(emergencyId);
    if (emergency) {
      emergency.status = "HOSPITAL_ASSIGNED";
    }

    return json({
      id: String(body.hospitalId ?? "HSP-001"),
      name: "KMCH Hospital",
      distanceKm: 3.2,
      address: "Avinashi Road, Coimbatore, Tamil Nadu 641014",
      emergencyAvailable: true,
      icuAvailable: true,
      specializations: ["Trauma", "Cardiology", "Neurology"],
      travelMinutes: 8,
      latitude: 11.0168,
      longitude: 76.9722,
    });
  }

  // ── GET /api/emergencies/:id ──────────────────────────────────────────────
  const getMatch = path.match(/^\/api\/emergencies\/([^/]+)$/);
  if (getMatch && request.method === "GET") {
    const id = getMatch[1]!;
    const emergency = emergencies.get(id);
    if (!emergency) return json({ error: "Emergency not found" }, 404);
    return json(emergency);
  }

  // ── GET /api/emergencies/:id/timeline ─────────────────────────────────────
  const timelineMatch = path.match(/^\/api\/emergencies\/([^/]+)\/timeline$/);
  if (timelineMatch && request.method === "GET") {
    const id = timelineMatch[1]!;
    const emergency = emergencies.get(id);
    if (!emergency) return json({ error: "Emergency not found" }, 404);

    return json({
      events: [
        { status: "CREATED", timestamp: emergency.createdAt, label: "Emergency created" },
        { status: "PRIORITY_ASSIGNED", timestamp: new Date().toISOString(), label: "Priority assessed" },
      ],
    });
  }

  // Not an API route
  return null;
}

// ── SSR entry ─────────────────────────────────────────────────────────────────

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // Try API routes first
      const apiResponse = await handleApiRequest(request);
      if (apiResponse) return apiResponse;

      // Fall through to SSR
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
