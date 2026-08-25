import { NextResponse } from "next/server";
import { getScenario } from "@/lib/scenario";
import { describeClaudeError, scoreRoleplay } from "@/lib/claude-client";
import { buildScoringResult, validateScoringResponse } from "@/lib/scoring-schema";
import { FOLLOW_UP_QUESTION_COUNT } from "@/lib/questions-schema";

type QaInput = { question: string; answer: string };

function isValidQaArray(value: unknown): value is QaInput[] {
  return (
    Array.isArray(value) &&
    value.length === FOLLOW_UP_QUESTION_COUNT &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Record<string, unknown>).question === "string" &&
        typeof (item as Record<string, unknown>).answer === "string"
    )
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { scenarioId, transcript, qa } = (body ?? {}) as {
    scenarioId?: unknown;
    transcript?: unknown;
    qa?: unknown;
  };

  if (typeof scenarioId !== "string") {
    return NextResponse.json({ error: "Missing or invalid 'scenarioId'." }, { status: 400 });
  }
  if (typeof transcript !== "string" || !transcript.trim()) {
    return NextResponse.json({ error: "Missing or empty 'transcript'." }, { status: 400 });
  }
  if (!isValidQaArray(qa)) {
    return NextResponse.json(
      {
        error: `Missing or invalid 'qa' — expected ${FOLLOW_UP_QUESTION_COUNT} question/answer pairs.`,
      },
      { status: 400 }
    );
  }

  const scenario = getScenario(scenarioId);
  if (!scenario) {
    return NextResponse.json({ error: "Unknown scenario." }, { status: 400 });
  }

  try {
    const raw = await scoreRoleplay(scenario, transcript, qa);
    const validated = validateScoringResponse(scenario, raw);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.reason }, { status: 502 });
    }
    return NextResponse.json(buildScoringResult(scenario, validated.value));
  } catch (error) {
    const { status, message } = describeClaudeError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
