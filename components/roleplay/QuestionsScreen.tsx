import type { FollowUpQA, QuestionsPhase } from "@/types/session";
import { useSpeechCapture } from "@/lib/speech-recognition";

export default function QuestionsScreen({
  questionsPhase,
  followUpQuestions,
  currentQuestionIndex,
  interimTranscript,
  useTextFallback,
  speechWarning,
  onStartAnswering,
  onAnswerTranscriptChange,
  onFatalMicError,
  onSpeechWarning,
  onSubmitAnswer,
}: {
  questionsPhase: QuestionsPhase;
  followUpQuestions: FollowUpQA[];
  currentQuestionIndex: number;
  interimTranscript: string;
  useTextFallback: boolean;
  speechWarning: string | null;
  onStartAnswering: () => void;
  onAnswerTranscriptChange: (transcript: string, interimTranscript: string) => void;
  onFatalMicError: (message: string) => void;
  onSpeechWarning: (message: string) => void;
  onSubmitAnswer: (answer: string) => void;
}) {
  useSpeechCapture({
    active: questionsPhase === "answering" && !useTextFallback,
    onTranscript: ({ finalTranscript, interimTranscript }) =>
      onAnswerTranscriptChange(finalTranscript, interimTranscript),
    onError: (error) =>
      error.fatal ? onFatalMicError(error.message) : onSpeechWarning(error.message),
  });

  if (questionsPhase === "loading") {
    return (
      <div className="text-center">
        <p className="text-sm text-zinc-500">
          Generating follow-up questions based on your presentation...
        </p>
      </div>
    );
  }

  const current = followUpQuestions[currentQuestionIndex];

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
      <p className="text-sm text-zinc-500">
        Follow-up question {currentQuestionIndex + 1} of {followUpQuestions.length}
      </p>
      <p className="text-lg font-medium text-center">{current?.question}</p>

      {questionsPhase === "ready" && (
        <button
          onClick={onStartAnswering}
          className="rounded-full bg-foreground px-6 py-3 text-background font-medium"
        >
          Start Answering
        </button>
      )}

      {questionsPhase === "answering" && (
        <div className="w-full flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-red-600">
            <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
            Recording answer
          </div>
          {speechWarning ? <p className="text-xs text-amber-600">{speechWarning}</p> : null}
          {useTextFallback ? (
            <textarea
              value={current?.answer ?? ""}
              onChange={(e) => onAnswerTranscriptChange(e.target.value, "")}
              className="w-full min-h-24 rounded-md border border-zinc-300 dark:border-zinc-700 p-3 text-sm bg-transparent"
              placeholder="Type your answer here..."
            />
          ) : (
            <div className="w-full min-h-24 rounded-md border border-zinc-300 dark:border-zinc-700 p-3 text-sm whitespace-pre-wrap">
              {current?.answer}
              {interimTranscript ? (
                <span className="text-zinc-400"> {interimTranscript}</span>
              ) : null}
            </div>
          )}
          <button
            onClick={() => onSubmitAnswer(current?.answer ?? "")}
            className="rounded-full bg-foreground px-6 py-3 text-background font-medium"
          >
            Done Answering
          </button>
        </div>
      )}
    </div>
  );
}
