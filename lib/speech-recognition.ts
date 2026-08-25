"use client";

import { useEffect, useEffectEvent } from "react";

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function getSpeechRecognitionConstructor(): { new (): SpeechRecognition } | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export type SpeechCaptureError = {
  /** Recognition cannot continue (permission denied, no mic) — caller should stop the session. */
  fatal: boolean;
  message: string;
};

function describeError(error: string): SpeechCaptureError {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return {
        fatal: true,
        message:
          "Microphone access was denied. Grant microphone permission in your browser and try again.",
      };
    case "audio-capture":
      return {
        fatal: true,
        message: "No microphone could be found. Connect a microphone and try again.",
      };
    case "no-speech":
      return { fatal: false, message: "No speech detected — keep speaking." };
    case "network":
      return {
        fatal: false,
        message: "A network error interrupted speech recognition. Retrying...",
      };
    default:
      return { fatal: false, message: `Speech recognition error: ${error}` };
  }
}

/**
 * Starts speech recognition while `active` is true and stops it when `active`
 * becomes false or the component unmounts — callers rely on this to guarantee
 * the mic is never on outside the screen that owns it (e.g. PREP or between
 * follow-up questions).
 */
export function useSpeechCapture({
  active,
  onTranscript,
  onError,
}: {
  active: boolean;
  onTranscript: (result: { finalTranscript: string; interimTranscript: string }) => void;
  onError: (error: SpeechCaptureError) => void;
}) {
  const handleTranscript = useEffectEvent(onTranscript);
  const handleError = useEffectEvent(onError);

  useEffect(() => {
    if (!active) return;

    const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";
    let stoppedIntentionally = false;

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      handleTranscript({
        finalTranscript: finalTranscript.trim(),
        interimTranscript: interimTranscript.trim(),
      });
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return; // caused by our own stop(), not a real failure
      const error = describeError(event.error);
      if (error.fatal) stoppedIntentionally = true;
      handleError(error);
    };

    recognition.onend = () => {
      // Some browsers end recognition after a pause even with continuous=true;
      // restart unless we're intentionally tearing down or hit a fatal error.
      if (!stoppedIntentionally) {
        try {
          recognition.start();
        } catch {
          // already running or mid-teardown; ignore
        }
      }
    };

    recognition.start();

    return () => {
      stoppedIntentionally = true;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
    };
  }, [active]);
}
