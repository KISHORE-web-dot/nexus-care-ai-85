/**
 * sosService.ts
 * ─────────────
 * Orchestrates the full automatic SOS pipeline:
 *   GPS → create emergency → AI priority → find ambulance → assign ambulance
 *   → find hospital → assign hospital → poll status
 *
 * All API calls use native fetch. No Supabase dependency.
 * Each step emits state updates via a callback so the UI can show live progress.
 */

import type { LocationData } from "@/types/location";
import type { AIAssessmentResult, EmergencyDetails, PublicEmergency } from "@/types/emergency";
import type { AmbulanceCandidate, AssignedAmbulance } from "@/types/ambulance";
import type { AssignedHospital, HospitalCandidate } from "@/types/hospital";
import { getCurrentLocation, describeLocation } from "@/services/locationService";

// ── Config ──────────────────────────────────────────────────────────────────

const API_BASE =
  ((import.meta.env as Record<string, unknown>)["VITE_API_URL"] as string | undefined) ??
  ((import.meta.env as Record<string, unknown>)["VITE_API_BASE_URL"] as string | undefined) ??
  "/api";

const TIMEOUT_MS = 15_000;

// ── Pipeline State ──────────────────────────────────────────────────────────

export type PipelineStep =
  | "gps"
  | "creating"
  | "assessing"
  | "dispatching"
  | "assigning_ambulance"
  | "hospital_search"
  | "assigning_hospital"
  | "active"
  | "polling";

export type StepStatus = "pending" | "active" | "done" | "failed" | "skipped";

export interface StepState {
  step: PipelineStep;
  status: StepStatus;
  error?: string | undefined;
  timestamp?: string | undefined;
}

export interface SOSPipelineState {
  steps: StepState[];
  currentStep: PipelineStep;

  // Data accumulated through the pipeline
  location?: LocationData | undefined;
  emergency?: PublicEmergency | undefined;
  aiAssessment?: AIAssessmentResult | undefined;
  ambulanceCandidates?: AmbulanceCandidate[] | undefined;
  assignedAmbulance?: AssignedAmbulance | undefined;
  hospitalCandidates?: HospitalCandidate[] | undefined;
  assignedHospital?: AssignedHospital | undefined;
  emergencyDetails?: EmergencyDetails | undefined;

  /** True when the full pipeline completed successfully. */
  completed: boolean;
  /** Overall fatal error (e.g. GPS permanently denied). */
  fatalError?: string | undefined;
}

// ── Step definitions in order ───────────────────────────────────────────────

const PIPELINE_STEPS: PipelineStep[] = [
  "gps",
  "creating",
  "assessing",
  "dispatching",
  "assigning_ambulance",
  "hospital_search",
  "assigning_hospital",
];

function initialSteps(): StepState[] {
  return PIPELINE_STEPS.map((step) => ({ step, status: "pending" as StepStatus }));
}

function initialState(): SOSPipelineState {
  return {
    steps: initialSteps(),
    currentStep: "gps",
    completed: false,
  };
}

// ── Fetch helper ────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: { method?: string | undefined; body?: unknown; signal?: AbortSignal | undefined } = {},
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  // Link external signal
  if (options.signal) {
    options.signal.addEventListener("abort", () => controller.abort());
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? "GET",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      if (response.status >= 500) {
        throw new Error("Service temporarily unavailable. Please try again.");
      }
      throw new Error(text || `Request failed (${response.status}).`);
    }

    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Pipeline Runner ─────────────────────────────────────────────────────────

/**
 * Run the full SOS pipeline. Calls `onUpdate` after every state change.
 * The caller can pass an AbortSignal to cancel the pipeline.
 */
export async function runSOSPipeline(
  onUpdate: (state: SOSPipelineState) => void,
  signal?: AbortSignal,
): Promise<void> {
  const state = initialState();

  function emit() {
    onUpdate({ ...state, steps: state.steps.map((s) => ({ ...s })) });
  }

  function markStep(step: PipelineStep, status: StepStatus, error?: string) {
    const s = state.steps.find((ss) => ss.step === step);
    if (s) {
      s.status = status;
      s.error = error;
      if (status === "done" || status === "failed") {
        s.timestamp = new Date().toISOString();
      }
    }
    state.currentStep = step;
    emit();
  }

  function checkAbort() {
    if (signal?.aborted) {
      throw new Error("Emergency request cancelled.");
    }
  }

  try {
    // ── Step 1: GPS ─────────────────────────────────────────────────────
    markStep("gps", "active");
    checkAbort();

    try {
      const result = await getCurrentLocation(10_000);
      const address = await describeLocation(result).catch(() => undefined);
      state.location = {
        latitude: result.latitude,
        longitude: result.longitude,
        accuracy: result.accuracy ?? 0,
        timestamp: new Date().toISOString(),
        ...(address ? { address } : {}),
        source: "gps",
      };
      markStep("gps", "done");
    } catch (gpsErr) {
      const msg = gpsErr instanceof Error ? gpsErr.message : "Unable to detect location.";
      markStep("gps", "failed", msg);
      state.fatalError = msg;
      emit();
      return; // GPS failure is fatal — UI shows retry / manual entry
    }

    // ── Step 2: Create emergency ────────────────────────────────────────
    markStep("creating", "active");
    checkAbort();

    try {
      state.emergency = await apiFetch<PublicEmergency>("/emergencies", {
        method: "POST",
        body: {
          source: "PATIENT",
          emergencyType: "UNKNOWN",
          conscious: true,
          peopleAffected: 1,
          description: "",
          latitude: state.location.latitude,
          longitude: state.location.longitude,
          accuracy: state.location.accuracy,
        },
        signal,
      });
      markStep("creating", "done");
    } catch (err) {
      markStep(
        "creating",
        "failed",
        err instanceof Error ? err.message : "Failed to create emergency.",
      );
      state.fatalError =
        "Cannot connect to the emergency service. Please check your network connection, or call your local emergency number.";
      emit();
      return;
    }

    // ── Step 3: AI priority assessment ──────────────────────────────────
    markStep("assessing", "active");
    checkAbort();

    try {
      state.aiAssessment = await apiFetch<AIAssessmentResult>(
        `/emergencies/${state.emergency.id}/assess`,
        { method: "POST", signal },
      );
      markStep("assessing", "done");
    } catch {
      // AI failure is non-fatal — continue with fallback
      state.aiAssessment = { priority: "HIGH", confidence: 0, fallback: true };
      markStep(
        "assessing",
        "skipped",
        "AI assessment temporarily unavailable. Emergency coordination is continuing.",
      );
    }

    // ── Step 4: Find ambulance candidates ───────────────────────────────
    markStep("dispatching", "active");
    checkAbort();

    try {
      const result = await apiFetch<{ candidates: AmbulanceCandidate[] }>(
        "/dispatch/find-ambulance",
        {
          method: "POST",
          body: {
            emergencyId: state.emergency.id,
            latitude: state.location.latitude,
            longitude: state.location.longitude,
            priority: state.aiAssessment?.priority ?? "HIGH",
          },
          signal,
        },
      );
      state.ambulanceCandidates = result.candidates;
      markStep("dispatching", "done");
    } catch (err) {
      markStep(
        "dispatching",
        "failed",
        err instanceof Error ? err.message : "Failed to find ambulances.",
      );
      state.fatalError = err instanceof Error ? err.message : "Unable to locate ambulances.";
      emit();
      return;
    }

    // ── Step 5: Assign best ambulance ───────────────────────────────────
    markStep("assigning_ambulance", "active");
    checkAbort();

    try {
      state.assignedAmbulance = await apiFetch<AssignedAmbulance>("/dispatch/assign", {
        method: "POST",
        body: {
          emergencyId: state.emergency.id,
          ambulanceId: state.ambulanceCandidates?.[0]?.id,
        },
        signal,
      });
      markStep("assigning_ambulance", "done");
    } catch (err) {
      markStep(
        "assigning_ambulance",
        "failed",
        err instanceof Error ? err.message : "Failed to assign ambulance.",
      );
      state.fatalError = err instanceof Error ? err.message : "Unable to assign ambulance.";
      emit();
      return;
    }

    // ── Step 6: Find hospital candidates ────────────────────────────────
    markStep("hospital_search", "active");
    checkAbort();

    try {
      const result = await apiFetch<{ candidates: HospitalCandidate[] }>("/hospitals/recommend", {
        method: "POST",
        body: {
          emergencyId: state.emergency.id,
          latitude: state.location.latitude,
          longitude: state.location.longitude,
          priority: state.aiAssessment?.priority ?? "HIGH",
        },
        signal,
      });
      state.hospitalCandidates = result.candidates;
      markStep("hospital_search", "done");
    } catch (err) {
      markStep(
        "hospital_search",
        "failed",
        err instanceof Error ? err.message : "Failed to find hospitals.",
      );
      state.fatalError = err instanceof Error ? err.message : "Unable to locate hospitals.";
      emit();
      return;
    }

    // ── Step 7: Assign hospital ─────────────────────────────────────────
    markStep("assigning_hospital", "active");
    checkAbort();

    try {
      state.assignedHospital = await apiFetch<AssignedHospital>("/hospitals/assign", {
        method: "POST",
        body: {
          emergencyId: state.emergency.id,
          hospitalId: state.hospitalCandidates?.[0]?.id,
        },
        signal,
      });
      markStep("assigning_hospital", "done");
    } catch (err) {
      markStep(
        "assigning_hospital",
        "failed",
        err instanceof Error ? err.message : "Failed to assign hospital.",
      );
      state.fatalError = err instanceof Error ? err.message : "Unable to assign hospital.";
      emit();
      return;
    }

    // ── Complete ────────────────────────────────────────────────────────
    state.completed = true;
    state.currentStep = "active";
    emit();
  } catch (err) {
    // Catch-all for unexpected errors or user cancellation
    if (err instanceof Error && err.message === "Emergency request cancelled.") {
      return;
    }
    state.fatalError = err instanceof Error ? err.message : "An unexpected error occurred.";
    emit();
  }
}

/** Step labels for display in the UI. */
export const STEP_LABELS: Record<PipelineStep, string> = {
  gps: "Detecting your location",
  creating: "Creating emergency case",
  assessing: "AI priority assessment",
  dispatching: "Finding available ambulances",
  assigning_ambulance: "Assigning ambulance",
  hospital_search: "Finding suitable hospitals",
  assigning_hospital: "Assigning hospital",
  active: "Emergency active",
  polling: "Monitoring status",
};
