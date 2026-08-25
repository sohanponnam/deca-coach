import type { Scenario } from "@/lib/scenario";
import type { PerformanceIndicatorResult, ScoringResult } from "@/types/session";

export const PI_MAX_SCORE = 10 as const;
export const TOTAL_MAX_SCORE = 70 as const;

export const AI_SCORE_DISCLAIMER =
  "This score evaluates the Performance Indicator portion of your roleplay. The official DECA evaluation also includes additional points for professional skills and other judge-observed factors that are not evaluated by this version of the AI coach.";

export type RawPiScore = {
  id: string;
  score: number;
  evidence: string;
  feedback: string;
};

export type RawScoringResponse = {
  performanceIndicators: RawPiScore[];
  strengths: string[];
  improvements: string[];
};

export type ScoringValidationResult =
  | { ok: true; value: RawScoringResponse }
  | { ok: false; reason: string };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

/**
 * Validates Claude's raw scoring output against the scenario's actual PIs.
 * Deliberately narrow: only id/score/evidence/feedback per PI plus
 * strengths/improvements. name, per-PI maxScore, overallScore, the top-level
 * maxScore, and the disclaimer are never taken from Claude — see
 * buildScoringResult.
 */
export function validateScoringResponse(
  scenario: Scenario,
  data: unknown
): ScoringValidationResult {
  if (typeof data !== "object" || data === null) {
    return { ok: false, reason: "Response was not an object." };
  }
  const record = data as Record<string, unknown>;

  const rawPis = record.performanceIndicators;
  if (!Array.isArray(rawPis)) {
    return { ok: false, reason: "Missing or invalid 'performanceIndicators' array." };
  }
  if (rawPis.length !== scenario.performanceIndicators.length) {
    return {
      ok: false,
      reason: `Expected ${scenario.performanceIndicators.length} performance indicators, got ${rawPis.length}.`,
    };
  }

  const expectedIds = new Set(scenario.performanceIndicators.map((pi) => pi.id));
  const seenIds = new Set<string>();
  const performanceIndicators: RawPiScore[] = [];

  for (const entry of rawPis) {
    if (typeof entry !== "object" || entry === null) {
      return { ok: false, reason: "Each performance indicator entry must be an object." };
    }
    const { id, score, evidence, feedback } = entry as Record<string, unknown>;

    if (typeof id !== "string" || !expectedIds.has(id)) {
      return { ok: false, reason: `Unrecognized performance indicator id: ${String(id)}.` };
    }
    if (seenIds.has(id)) {
      return { ok: false, reason: `Duplicate performance indicator id: ${id}.` };
    }
    seenIds.add(id);

    if (
      typeof score !== "number" ||
      !Number.isInteger(score) ||
      score < 0 ||
      score > PI_MAX_SCORE
    ) {
      return {
        ok: false,
        reason: `Score for ${id} must be an integer between 0 and ${PI_MAX_SCORE}.`,
      };
    }

    // Evidence may legitimately be empty when the student never addressed the PI.
    if (typeof evidence !== "string") {
      return { ok: false, reason: `Evidence for ${id} must be a string.` };
    }
    if (!isNonEmptyString(feedback)) {
      return { ok: false, reason: `Feedback for ${id} must be a non-empty string.` };
    }

    performanceIndicators.push({ id, score, evidence, feedback: feedback.trim() });
  }

  if (seenIds.size !== expectedIds.size) {
    return { ok: false, reason: "Performance indicator ids did not match the scenario's PIs." };
  }

  const strengths = record.strengths;
  if (!isStringArray(strengths) || strengths.length === 0) {
    return { ok: false, reason: "'strengths' must be a non-empty array of strings." };
  }

  const improvements = record.improvements;
  if (!isStringArray(improvements) || improvements.length === 0) {
    return { ok: false, reason: "'improvements' must be a non-empty array of strings." };
  }

  return { ok: true, value: { performanceIndicators, strengths, improvements } };
}

/**
 * Builds the ScoringResult sent to the client from an already-validated raw
 * response. overallScore is recomputed here (never trusted from Claude), and
 * name/maxScore/disclaimer are always injected from our own data.
 */
export function buildScoringResult(
  scenario: Scenario,
  validated: RawScoringResponse
): ScoringResult {
  const piById = new Map(scenario.performanceIndicators.map((pi) => [pi.id, pi]));

  const performanceIndicators: PerformanceIndicatorResult[] = validated.performanceIndicators.map(
    (result) => {
      const pi = piById.get(result.id);
      if (!pi) {
        throw new Error(`Unexpected performance indicator id after validation: ${result.id}`);
      }
      return {
        id: pi.id,
        name: `${pi.code} — ${pi.statement}`,
        score: result.score,
        maxScore: PI_MAX_SCORE,
        evidence: result.evidence,
        feedback: result.feedback,
      };
    }
  );

  const overallScore = performanceIndicators.reduce((sum, pi) => sum + pi.score, 0);

  return {
    scenarioId: scenario.id,
    overallScore,
    maxScore: TOTAL_MAX_SCORE,
    performanceIndicators,
    strengths: validated.strengths,
    improvements: validated.improvements,
    disclaimer: AI_SCORE_DISCLAIMER,
  };
}
