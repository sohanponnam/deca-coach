import type { Scenario } from "@/lib/scenario";

export default function ScenarioPanel({ scenario }: { scenario: Scenario }) {
  return (
    <div className="w-full max-w-2xl rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
      <h2 className="text-lg font-semibold mb-2">{scenario.title}</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap mb-4">
        {scenario.prompt}
      </p>
      <h3 className="text-sm font-semibold mb-2">Performance Indicators</h3>
      <ul className="list-disc pl-5 space-y-1">
        {scenario.performanceIndicators.map((pi) => (
          <li key={pi.id} className="text-sm">
            <span className="font-mono text-xs text-zinc-500">{pi.code}</span>{" "}
            {pi.statement}
          </li>
        ))}
      </ul>
    </div>
  );
}
