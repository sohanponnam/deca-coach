import { NextResponse } from "next/server";
import { getScenario } from "@/lib/scenario";
import { describeClaudeError, generateFollowUpQuestions } from "@/lib/claude-client";
import { validateQuestionsResponse } from "@/lib/questions-schema";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { scenarioId, transcript } = (body ?? {}) as {
    scenarioId?: unknown;
    transcript?: unknown;
  };

  if (typeof scenarioId !== "string") {
    return NextResponse.json({ error: "Missing or invalid 'scenarioId'." }, { status: 400 });
  }
  if (typeof transcript !== "string" || !transcript.trim()) {
    return NextResponse.json({ error: "Missing or empty 'transcript'." }, { status: 400 });
  }

  const scenario = getScenario(scenarioId);
  if (!scenario) {
    return NextResponse.json({ error: "Unknown scenario." }, { status: 400 });
  }

  try {
    const raw = await generateFollowUpQuestions(scenario, transcript);
    const validated = validateQuestionsResponse(raw);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.reason }, { status: 502 });
    }
    return NextResponse.json({ questions: validated.questions });
  } catch (error) {
    const { status, message } = describeClaudeError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
