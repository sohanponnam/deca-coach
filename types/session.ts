export type AppStatus =
  | "INTRO"
  | "PREP"
  | "RECORDING"
  | "QUESTIONS"
  | "SUBMITTING"
  | "RESULTS"
  | "ERROR";

export type QuestionsPhase = "loading" | "ready" | "answering" | "done";

export type SubmitPhase = "submitting" | "scoring";

export type FollowUpQA = {
  question: string;
  answer: string;
};

export type PerformanceIndicatorResult = {
  id: string;
  name: string;
  score: number;
  maxScore: 10;
  evidence: string;
  feedback: string;
};

export type ScoringResult = {
  scenarioId: string;
  overallScore: number;
  maxScore: 70;
  performanceIndicators: PerformanceIndicatorResult[];
  strengths: string[];
  improvements: string[];
  disclaimer: string;
};

export type ErrorCode =
  | "MIC_ERROR"
  | "EMPTY_TRANSCRIPT"
  | "QUESTIONS_FAILED"
  | "SCORING_FAILED"
  | "MALFORMED_RESPONSE"
  | "UNKNOWN";

export type SessionError = {
  code: ErrorCode;
  message: string;
};

export type SessionState = {
  status: AppStatus;

  transcript: string;
  interimTranscript: string;

  /** True once speech recognition is confirmed unsupported/unavailable — falls back to manual text entry. */
  useTextFallback: boolean;
  /** Non-fatal speech recognition hiccup (e.g. no-speech, network) shown inline, doesn't interrupt the session. */
  speechWarning: string | null;

  followUpQuestions: FollowUpQA[];
  questionsPhase: QuestionsPhase;
  currentQuestionIndex: number;

  submitPhase: SubmitPhase;

  scoringResult: ScoringResult | null;
  error: SessionError | null;
};

export type SessionAction =
  | { type: "START_PREP" }
  | { type: "PREP_COMPLETE" }
  | { type: "MIC_ERROR"; message: string }
  | { type: "SPEECH_UNSUPPORTED" }
  | { type: "SPEECH_WARNING"; message: string }
  | { type: "TRANSCRIPT_UPDATE"; transcript: string; interimTranscript: string }
  | { type: "END_PRESENTATION" }
  | { type: "QUESTIONS_LOADED"; questions: string[] }
  | { type: "QUESTIONS_LOAD_FAILED"; message: string }
  | { type: "START_ANSWERING" }
  | { type: "ANSWER_TRANSCRIPT_UPDATE"; transcript: string; interimTranscript: string }
  | { type: "SUBMIT_ANSWER"; answer: string }
  | { type: "SCORE_SUCCESS"; result: ScoringResult }
  | { type: "SCORE_FAILURE"; message: string }
  | { type: "RESET" };
