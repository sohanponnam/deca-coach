import type { Scenario } from "@/lib/scenario";
import { formatSeconds, useCountdown } from "@/lib/timer";
import { useSpeechCapture } from "@/lib/speech-recognition";
import ScenarioPanel from "@/components/roleplay/ScenarioPanel";

export default function RecordingScreen({
  scenario,
  transcript,
  interimTranscript,
  useTextFallback,
  speechWarning,
  onTranscriptChange,
  onFatalMicError,
  onSpeechWarning,
  onEndPresentation,
}: {
  scenario: Scenario;
  transcript: string;
  interimTranscript: string;
  useTextFallback: boolean;
  speechWarning: string | null;
  onTranscriptChange: (transcript: string, interimTranscript: string) => void;
  onFatalMicError: (message: string) => void;
  onSpeechWarning: (message: string) => void;
  onEndPresentation: () => void;
}) {
  const secondsRemaining = useCountdown(scenario.presentationTimeSeconds, onEndPresentation);

  useSpeechCapture({
    active: !useTextFallback,
    onTranscript: ({ finalTranscript, interimTranscript }) =>
      onTranscriptChange(finalTranscript, interimTranscript),
    onError: (error) =>
      error.fatal ? onFatalMicError(error.message) : onSpeechWarning(error.message),
  });

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2 text-sm font-medium text-red-600">
          <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
          Recording — {formatSeconds(secondsRemaining)} remaining
        </div>
        {speechWarning ? <p className="text-xs text-amber-600">{speechWarning}</p> : null}
      </div>
      <ScenarioPanel scenario={scenario} />
      <div className="w-full max-w-2xl">
        {useTextFallback ? (
          <>
            <p className="text-xs text-zinc-500 mb-1">
              Speech recognition isn&apos;t available in this browser — type your presentation
              instead.
            </p>
            <textarea
              value={transcript}
              onChange={(e) => onTranscriptChange(e.target.value, "")}
              className="w-full min-h-32 rounded-md border border-zinc-300 dark:border-zinc-700 p-3 text-sm bg-transparent"
              placeholder="Type your presentation here..."
            />
          </>
        ) : (
          <>
            <p className="text-xs text-zinc-500 mb-1">Live transcript</p>
            <div className="w-full min-h-32 rounded-md border border-zinc-300 dark:border-zinc-700 p-3 text-sm whitespace-pre-wrap">
              {transcript}
              {interimTranscript ? (
                <span className="text-zinc-400"> {interimTranscript}</span>
              ) : null}
              {!transcript && !interimTranscript ? (
                <span className="text-zinc-400">
                  Start speaking — your words will appear here...
                </span>
              ) : null}
            </div>
          </>
        )}
      </div>
      <button
        onClick={onEndPresentation}
        className="rounded-full bg-foreground px-6 py-3 text-background font-medium"
      >
        End Presentation
      </button>
    </div>
  );
}
