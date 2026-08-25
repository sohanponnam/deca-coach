import type { SessionAction, SessionState } from "@/types/session";

export const initialSessionState: SessionState = {
  status: "INTRO",
  transcript: "",
  interimTranscript: "",
  useTextFallback: false,
  speechWarning: null,
  followUpQuestions: [],
  questionsPhase: "loading",
  currentQuestionIndex: 0,
  submitPhase: "submitting",
  scoringResult: null,
  error: null,
};

export function sessionReducer(
  state: SessionState,
  action: SessionAction
): SessionState {
  switch (action.type) {
    case "START_PREP":
      if (state.status !== "INTRO") return state;
      return { ...state, status: "PREP" };

    case "PREP_COMPLETE":
      if (state.status !== "PREP") return state;
      return {
        ...state,
        status: "RECORDING",
        transcript: "",
        interimTranscript: "",
        speechWarning: null,
      };

    case "MIC_ERROR":
      return {
        ...state,
        status: "ERROR",
        error: { code: "MIC_ERROR", message: action.message },
      };

    case "SPEECH_UNSUPPORTED":
      return { ...state, useTextFallback: true };

    case "SPEECH_WARNING": {
      const isAnswering =
        state.status === "QUESTIONS" && state.questionsPhase === "answering";
      if (state.status !== "RECORDING" && !isAnswering) return state;
      return { ...state, speechWarning: action.message };
    }

    case "TRANSCRIPT_UPDATE":
      if (state.status !== "RECORDING") return state;
      return {
        ...state,
        transcript: action.transcript,
        interimTranscript: action.interimTranscript,
        speechWarning: null,
      };

    case "END_PRESENTATION":
      if (state.status !== "RECORDING") return state;
      if (!state.transcript.trim()) {
        return {
          ...state,
          status: "ERROR",
          error: {
            code: "EMPTY_TRANSCRIPT",
            message:
              "No speech was captured during your presentation, so there is nothing to evaluate.",
          },
        };
      }
      return {
        ...state,
        status: "QUESTIONS",
        questionsPhase: "loading",
        currentQuestionIndex: 0,
        followUpQuestions: [],
      };

    case "QUESTIONS_LOADED":
      if (state.status !== "QUESTIONS" || state.questionsPhase !== "loading")
        return state;
      return {
        ...state,
        questionsPhase: "ready",
        followUpQuestions: action.questions.map((question) => ({
          question,
          answer: "",
        })),
      };

    case "QUESTIONS_LOAD_FAILED":
      if (state.status !== "QUESTIONS") return state;
      return {
        ...state,
        status: "ERROR",
        error: { code: "QUESTIONS_FAILED", message: action.message },
      };

    case "START_ANSWERING":
      if (state.status !== "QUESTIONS" || state.questionsPhase !== "ready")
        return state;
      return {
        ...state,
        questionsPhase: "answering",
        interimTranscript: "",
        speechWarning: null,
      };

    case "ANSWER_TRANSCRIPT_UPDATE":
      if (state.status !== "QUESTIONS" || state.questionsPhase !== "answering")
        return state;
      return {
        ...state,
        followUpQuestions: state.followUpQuestions.map((qa, index) =>
          index === state.currentQuestionIndex
            ? { ...qa, answer: action.transcript }
            : qa
        ),
        interimTranscript: action.interimTranscript,
        speechWarning: null,
      };

    case "SUBMIT_ANSWER": {
      if (state.status !== "QUESTIONS" || state.questionsPhase !== "answering")
        return state;
      const followUpQuestions = state.followUpQuestions.map((qa, index) =>
        index === state.currentQuestionIndex
          ? { ...qa, answer: action.answer }
          : qa
      );
      const isLastQuestion =
        state.currentQuestionIndex >= followUpQuestions.length - 1;
      if (isLastQuestion) {
        return {
          ...state,
          followUpQuestions,
          questionsPhase: "done",
          status: "SUBMITTING",
          submitPhase: "submitting",
        };
      }
      return {
        ...state,
        followUpQuestions,
        questionsPhase: "ready",
        currentQuestionIndex: state.currentQuestionIndex + 1,
        interimTranscript: "",
      };
    }

    case "SCORE_SUCCESS":
      if (state.status !== "SUBMITTING") return state;
      return { ...state, status: "RESULTS", scoringResult: action.result };

    case "SCORE_FAILURE":
      if (state.status !== "SUBMITTING") return state;
      return {
        ...state,
        status: "ERROR",
        error: { code: "SCORING_FAILED", message: action.message },
      };

    case "RESET":
      return { ...initialSessionState };

    default:
      return state;
  }
}
