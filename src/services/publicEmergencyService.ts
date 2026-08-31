/**
 * publicEmergencyService.ts
 * ─────────────────────────
 * REST client for the public emergency API.
 * Does NOT use Supabase — works with or without authentication.
 *
 * Base URL: VITE_API_BASE_URL env var, falls back to "/api".
 * Timeout:  15 seconds.
 * All errors are re-thrown as `Error` with human-readable messages.
 */

import type { PublicEmergency, PublicEmergencyPayload } from "@/types/emergency";

const API_BASE =
  ((import.meta.env as Record<string, unknown>)["VITE_API_BASE_URL"] as string | undefined) ??
  "/api";

// ── Human-readable error messages ──────────────────────────────────────────

function statusMessage(status: number): string {
  if (status >= 500)
    return "The emergency service is temporarily unavailable. Please try again, or call your local emergency number immediately.";
  if (status === 429) return "Too many requests — please wait a moment and try again.";
  if (status === 422 || status === 400)
    return "Some emergency details are missing or invalid. Please go back and review your information.";
  if (status === 401 || status === 403)
    return "Access denied. Please reload the page and try again.";
  return `Emergency service error (${status}). Please try again.`;
}

// ── Main service function ───────────────────────────────────────────────────

/**
 * Submit a new emergency to POST /api/emergencies.
 * Returns the backend-generated PublicEmergency (including the official ID).
 * Throws Error with a human-readable message on failure.
 */
export async function submitEmergency(payload: PublicEmergencyPayload): Promise<PublicEmergency> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  try {
    let response: Response;

    try {
      response = await fetch(`${API_BASE}/emergencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (networkErr) {
      if (networkErr instanceof Error && networkErr.name === "AbortError") {
        throw new Error(
          "The request timed out. Please check your internet connection and try again.",
        );
      }
      throw new Error(
        "Cannot connect to the emergency service. Please check your network connection, or call your local emergency number.",
      );
    }

    if (!response.ok) {
      throw new Error(statusMessage(response.status));
    }

    return (await response.json()) as PublicEmergency;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const publicEmergencyService = { submitEmergency };
