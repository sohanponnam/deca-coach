"use client";

import { useEffect, useReducer } from "react";
import { HARDCODED_SCENARIO } from "@/lib/scenario";
import { initialSessionState, sessionReducer } from "@/lib/session-reducer";
import { isSpeechRecognitionSupported } from "@/lib/speech-recognition";
import type { ScoringResult } from "@/types/session";
import IntroScreen from "@/components/roleplay/IntroScreen";
import PrepScreen from "@/components/roleplay/PrepScreen";
import RecordingScreen from "@/components/roleplay/RecordingScreen";
import QuestionsScreen from "@/components/roleplay/QuestionsScreen";
import SubmittingScreen from "@/components/roleplay/SubmittingScreen";
import ResultsScreen from "@/components/roleplay/ResultsScreen";
import ErrorScreen from "@/components/roleplay/ErrorScreen";

const GENERIC_NETWORK_ERROR = "Could not reach the server. Check your connection and try again.";

export default function RoleplaySession() {
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);

  useEffect(() => {
    if (!isSpeechRecognitionSupported()) {
      dispatch({ type: "SPEECH_UNSUPPORTED" });
    }
  }, []);

  // Once QUESTIONS enters "loading", ask the server for follow-up questions
  // grounded in the presentation transcript.
  useEffect(() => {
    if (state.status !== "QUESTIONS" || state.questionsPhase !== "loading") {
      return;
    }
    const controller = new AbortController();
    fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: HARDCODED_SCENARIO.id,
        transcript: state.transcript,
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          dispatch({
            type: "QUESTIONS_LOAD_FAILED",
            message: data.error ?? "Failed to generate follow-up questions.",
          });
          return;
        }
        dispatch({ type: "QUESTIONS_LOADED", questions: data.questions });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        dispatch({ type: "QUESTIONS_LOAD_FAILED", message: GENERIC_NETWORK_ERROR });
      });
    return () => controller.abort();
  }, [state.status, state.questionsPhase, state.transcript]);

  // Once SUBMITTING starts, send the transcript + Q&A to the server for scoring.
  useEffect(() => {
    if (state.status !== "SUBMITTING") return;
    const controller = new AbortController();
    fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: HARDCODED_SCENARIO.id,
        transcript: state.transcript,
        qa: state.followUpQuestions,
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          dispatch({
            type: "SCORE_FAILURE",
            message: data.error ?? "Failed to score your roleplay.",
          });
          return;
        }
        dispatch({ type: "SCORE_SUCCESS", result: data as ScoringResult });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        dispatch({ type: "SCORE_FAILURE", message: GENERIC_NETWORK_ERROR });
      });
    return () => controller.abort();
  }, [state.status, state.transcript, state.followUpQuestions]);

  switch (state.status) {
    case "INTRO":
      return (
        <IntroScreen
          scenario={HARDCODED_SCENARIO}
          useTextFallback={state.useTextFallback}
          onStart={() => dispatch({ type: "START_PREP" })}
        />
      );

    case "PREP":
      return (
        <PrepScreen
          scenario={HARDCODED_SCENARIO}
          onComplete={() => dispatch({ type: "PREP_COMPLETE" })}
        />
      );

    case "RECORDING":
      return (
        <RecordingScreen
          scenario={HARDCODED_SCENARIO}
          transcript={state.transcript}
          interimTranscript={state.interimTranscript}
          useTextFallback={state.useTextFallback}
          speechWarning={state.speechWarning}
          onTranscriptChange={(transcript, interimTranscript) =>
            dispatch({ type: "TRANSCRIPT_UPDATE", transcript, interimTranscript })
          }
          onFatalMicError={(message) => dispatch({ type: "MIC_ERROR", message })}
          onSpeechWarning={(message) => dispatch({ type: "SPEECH_WARNING", message })}
          onEndPresentation={() => dispatch({ type: "END_PRESENTATION" })}
        />
      );

    case "QUESTIONS":
      return (
        <QuestionsScreen
          questionsPhase={state.questionsPhase}
          followUpQuestions={state.followUpQuestions}
          currentQuestionIndex={state.currentQuestionIndex}
          interimTranscript={state.interimTranscript}
          useTextFallback={state.useTextFallback}
          speechWarning={state.speechWarning}
          onStartAnswering={() => dispatch({ type: "START_ANSWERING" })}
          onAnswerTranscriptChange={(transcript, interimTranscript) =>
            dispatch({ type: "ANSWER_TRANSCRIPT_UPDATE", transcript, interimTranscript })
          }
          onFatalMicError={(message) => dispatch({ type: "MIC_ERROR", message })}
          onSpeechWarning={(message) => dispatch({ type: "SPEECH_WARNING", message })}
          onSubmitAnswer={(answer) => dispatch({ type: "SUBMIT_ANSWER", answer })}
        />
      );

    case "SUBMITTING":
      return <SubmittingScreen submitPhase={state.submitPhase} />;

    case "RESULTS":
      return state.scoringResult ? (
        <ResultsScreen
          result={state.scoringResult}
          onStartOver={() => dispatch({ type: "RESET" })}
        />
      ) : null;

    case "ERROR":
      return state.error ? (
        <ErrorScreen
          error={state.error}
          onStartOver={() => dispatch({ type: "RESET" })}
        />
      ) : null;

    default:
      return null;
  }
}
