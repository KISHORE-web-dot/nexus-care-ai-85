import type { EmergencyConditions, Priority } from "@/lib/types";

export interface AIAssessment {
  priority: Priority;
  score: number;
  reasons: string[];
  confidence: number;
  engine: "demo-rules" | "external";
}

interface AssessmentInput {
  emergencyType: string;
  conditions: EmergencyConditions;
  description?: string;
}

const CRITICAL_TYPES = ["Unconscious", "Heavy Bleeding", "Stroke Symptoms"];
const HIGH_TYPES = ["Heart Problem", "Chest Pain", "Breathing Problem", "Road Accident"];

/**
 * Deterministic decision-support engine used by the prototype.
 * If an external AI endpoint is configured it can be swapped in behind the same
 * interface — the rule engine remains the guaranteed fallback.
 */
export function assessEmergency(input: AssessmentInput): AIAssessment {
  const c = input.conditions ?? {};
  const reasons: string[] = [];
  let score = 5;

  if (c.conscious === false) {
    score += 40;
    reasons.push("Unconsciousness detected");
  }
  if (c.breathingDifficulty) {
    score += 25;
    reasons.push("Breathing difficulty detected");
  }
  if (c.heavyBleeding) {
    score += 25;
    reasons.push("Heavy bleeding detected");
  }
  if (c.cardiacSymptoms) {
    score += 22;
    reasons.push("Cardiac symptoms reported");
  }
  if (c.strokeSymptoms) {
    score += 20;
    reasons.push("Suspected stroke symptoms");
  }
  if (c.chestPain) {
    score += 15;
    reasons.push("Chest pain reported");
  }
  if (c.accident) {
    score += 14;
    reasons.push("Accident reported");
  }
  if (c.severePain) {
    score += 8;
    reasons.push("Severe pain reported");
  }
  if ((c.injuredCount ?? 1) > 1) {
    score += Math.min(15, (c.injuredCount ?? 1) * 3);
    reasons.push(`${c.injuredCount} injured people reported`);
  }
  if (CRITICAL_TYPES.includes(input.emergencyType)) {
    score += 20;
    reasons.push(`High-risk emergency type: ${input.emergencyType}`);
  } else if (HIGH_TYPES.includes(input.emergencyType)) {
    score += 12;
    reasons.push(`Time-sensitive emergency type: ${input.emergencyType}`);
  }
  if ((c.age ?? 0) >= 65) {
    score += 6;
    reasons.push("Elderly patient — elevated risk");
  }
  if ((c.age ?? 99) <= 5) {
    score += 6;
    reasons.push("Paediatric patient — elevated risk");
  }

  score = Math.min(100, score);

  let priority: Priority = "LOW";
  if (score >= 65) priority = "CRITICAL";
  else if (score >= 40) priority = "HIGH";
  else if (score >= 20) priority = "MEDIUM";

  if (reasons.length === 0) reasons.push("No high-risk indicators reported");

  const confidence = Math.min(0.96, 0.62 + reasons.length * 0.06);

  return { priority, score, reasons, confidence, engine: "demo-rules" };
}

export const aiPriorityService = { assessEmergency };
