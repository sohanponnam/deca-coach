import type { ScoringResult } from "@/types/session";

export default function ResultsScreen({
  result,
  onStartOver,
}: {
  result: ScoringResult;
  onStartOver: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
      <div className="text-center">
        <p className="text-sm text-zinc-500">AI Practice Score</p>
        <p className="text-4xl font-semibold">
          {result.overallScore}/{result.maxScore}
        </p>
      </div>
      <p className="text-xs text-zinc-500 text-center">{result.disclaimer}</p>

      <div className="w-full space-y-3">
        {result.performanceIndicators.map((pi) => (
          <div
            key={pi.id}
            className="rounded-md border border-zinc-200 dark:border-zinc-800 p-4"
          >
            <div className="flex justify-between items-baseline">
              <span className="font-medium text-sm">{pi.name}</span>
              <span className="text-sm font-mono">
                {pi.score}/{pi.maxScore}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">{pi.evidence}</p>
            <p className="text-sm mt-2">{pi.feedback}</p>
          </div>
        ))}
      </div>

      <div className="w-full grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold mb-1">Strengths</h3>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {result.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-1">Improvements</h3>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {result.improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      <button
        onClick={onStartOver}
        className="rounded-full border border-zinc-300 dark:border-zinc-700 px-5 py-2 text-sm"
      >
        Start Over
      </button>
    </div>
  );
}
