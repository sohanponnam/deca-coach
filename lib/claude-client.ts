import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import type { Scenario } from "@/lib/scenario";
import { FOLLOW_UP_QUESTION_COUNT } from "@/lib/questions-schema";

const MODEL = "claude-sonnet-5";

const client = new Anthropic();

export class ClaudeResponseError extends Error {}

const JUDGE_SYSTEM_PROMPT = `You are a strict but fair evaluator for a DECA Marketing Management Team Decision Making (MTDM) roleplay practice exercise.

Your only job in this version is to evaluate how well the student addressed 7 specific Performance Indicators (PIs) in their presentation and follow-up answers. Each PI is scored from 0 to 10.

For each PI:
- Judge whether the student actually addressed the PI's subject matter, not just whether they used related terminology.
- Judge whether the student applied the concept specifically to the business case described, not in generic terms that could apply to any case.
- Look for a specific, relevant recommendation where appropriate, and reasoning for why it makes sense given the facts of the case.
- Do not award points merely because the student mentioned a keyword or phrase associated with the PI. A student who names a term without demonstrating real understanding or applying it to the case should score low on that PI.
- If the student did not address a PI at all, score it 0 and leave the evidence field empty.
- Base every score strictly on the transcript provided (the presentation and the follow-up Q&A) — do not assume information the student didn't actually say.
- Be consistent: two similarly strong (or similarly weak) responses to the same case should receive similar scores.

You are NOT scoring professional skills, presentation delivery, or any judge-observed factors outside of these 7 PIs — do not factor those into scores.

You must call the provided tool with your scoring. Do not respond with plain text.`;

const QUESTIONS_SYSTEM_PROMPT = `You are helping a student rehearse for a DECA Marketing Management Team Decision Making (MTDM) roleplay. The student just delivered a presentation responding to a business scenario.

Generate exactly two follow-up questions that a judge might realistically ask next. Each question must be grounded in something specific the student actually said — a claim, recommendation, number, or omission from their presentation — not a generic question about the case that could have been written without hearing the presentation.

You must call the provided tool with your questions. Do not respond with plain text.`;

function buildScenarioContext(scenario: Scenario): string {
  const piList = scenario.performanceIndicators
    .map((pi) => `- [${pi.id}] ${pi.code}: ${pi.statement}`)
    .join("\n");
  return `BUSINESS SCENARIO:\n${scenario.prompt}\n\nPERFORMANCE INDICATORS TO EVALUATE:\n${piList}`;
}

function extractToolInput(response: Anthropic.Message, toolName: string): unknown {
  const block = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === toolName
  );
  if (!block) {
    throw new ClaudeResponseError(
      `Claude did not call the expected tool (${toolName}); stop_reason: ${response.stop_reason}`
    );
  }
  return block.input;
}

export async function generateFollowUpQuestions(
  scenario: Scenario,
  transcript: string
): Promise<unknown> {
  const toolName = "submit_followup_questions";

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: QUESTIONS_SYSTEM_PROMPT,
    tools: [
      {
        name: toolName,
        description: `Submit follow-up questions for the student, grounded in their presentation. The 'questions' array must contain exactly ${FOLLOW_UP_QUESTION_COUNT} items — no more, no fewer.`,
        strict: true,
        input_schema: {
          // Anthropic's strict-mode array validation only supports minItems/
          // maxItems of 0 or 1, so the exact count is enforced by
          // validateQuestionsResponse() after the call, not here.
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["questions"],
          additionalProperties: false,
        },
      },
    ],
    tool_choice: { type: "tool", name: toolName },
    messages: [
      {
        role: "user",
        content: `${buildScenarioContext(scenario)}\n\nSTUDENT'S PRESENTATION TRANSCRIPT:\n${transcript}`,
      },
    ],
  });

  return extractToolInput(response, toolName);
}

export function describeClaudeError(error: unknown): { status: number; message: string } {
  if (error instanceof ClaudeResponseError) {
    return {
      status: 502,
      message: "The AI coach returned an unexpected response. Please try again.",
    };
  }
  // Thrown synchronously by the SDK when no credentials are configured at
  // all (no ANTHROPIC_API_KEY, auth token, or profile) — a plain Error, not
  // an AuthenticationError, since no request was ever sent to reject.
  if (error instanceof Error && error.message.includes("Could not resolve authentication method")) {
    return {
      status: 500,
      message: "The AI coach is not configured correctly. Please contact your instructor.",
    };
  }
  if (error instanceof Anthropic.RateLimitError) {
    return {
      status: 503,
      message: "The AI coach is temporarily busy. Please try again in a moment.",
    };
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return {
      status: 500,
      message: "The AI coach is not configured correctly. Please contact your instructor.",
    };
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return {
      status: 503,
      message: "Could not reach the AI coach. Check your connection and try again.",
    };
  }
  if (error instanceof Anthropic.APIError) {
    return { status: 502, message: "The AI coach encountered an error. Please try again." };
  }
  return { status: 500, message: "An unexpected error occurred. Please try again." };
}

export async function scoreRoleplay(
  scenario: Scenario,
  transcript: string,
  qa: { question: string; answer: string }[]
): Promise<unknown> {
  const toolName = "submit_scoring";
  const piIds = scenario.performanceIndicators.map((pi) => pi.id) as [string, ...string[]];

  const qaText = qa
    .map(
      (item, i) =>
        `Q${i + 1}: ${item.question}\nA${i + 1}: ${item.answer.trim() || "(no answer given)"}`
    )
    .join("\n\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: JUDGE_SYSTEM_PROMPT,
    tools: [
      {
        name: toolName,
        description: `Submit the Performance Indicator scoring for this roleplay. The 'performanceIndicators' array must contain exactly ${piIds.length} entries — one per PI listed above, no more, no fewer. Each 'score' must be an integer from 0 to 10.`,
        strict: true,
        input_schema: {
          // Anthropic's strict-mode schema validation only supports array
          // minItems/maxItems of 0 or 1, and doesn't support numeric
          // minimum/maximum at all — the exact PI count and the 0-10 score
          // range are enforced by validateScoringResponse() after the call.
          type: "object",
          properties: {
            performanceIndicators: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", enum: piIds },
                  score: { type: "integer" },
                  evidence: { type: "string" },
                  feedback: { type: "string" },
                },
                required: ["id", "score", "evidence", "feedback"],
                additionalProperties: false,
              },
            },
            strengths: { type: "array", items: { type: "string" }, minItems: 1 },
            improvements: { type: "array", items: { type: "string" }, minItems: 1 },
          },
          required: ["performanceIndicators", "strengths", "improvements"],
          additionalProperties: false,
        },
      },
    ],
    tool_choice: { type: "tool", name: toolName },
    messages: [
      {
        role: "user",
        content: `${buildScenarioContext(scenario)}\n\nSTUDENT'S PRESENTATION TRANSCRIPT:\n${transcript}\n\nFOLLOW-UP QUESTIONS AND ANSWERS:\n${qaText}\n\nEach performance indicator entry you submit must use the exact id shown in brackets above (e.g. "${piIds[0]}").`,
      },
    ],
  });

  return extractToolInput(response, toolName);
}
