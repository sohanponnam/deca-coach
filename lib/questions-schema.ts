export const FOLLOW_UP_QUESTION_COUNT = 2;

export type QuestionsValidationResult =
  | { ok: true; questions: string[] }
  | { ok: false; reason: string };

/**
 * Validates the raw follow-up-questions payload before it's trusted anywhere
 * else in the app — Claude's output must not be able to hand the client a
 * malformed or wrong-length question list.
 */
export function validateQuestionsResponse(data: unknown): QuestionsValidationResult {
  if (typeof data !== "object" || data === null) {
    return { ok: false, reason: "Response was not an object." };
  }

  const questions = (data as Record<string, unknown>).questions;
  if (!Array.isArray(questions)) {
    return { ok: false, reason: "Missing or invalid 'questions' array." };
  }
  if (questions.length !== FOLLOW_UP_QUESTION_COUNT) {
    return {
      ok: false,
      reason: `Expected exactly ${FOLLOW_UP_QUESTION_COUNT} questions, got ${questions.length}.`,
    };
  }

  const cleaned: string[] = [];
  for (const question of questions) {
    if (typeof question !== "string" || !question.trim()) {
      return { ok: false, reason: "Each question must be a non-empty string." };
    }
    cleaned.push(question.trim());
  }

  return { ok: true, questions: cleaned };
}
