import type { Scenario } from "@/lib/scenario";
import { PREP_SECONDS } from "@/lib/scenario";
import { formatSeconds, useCountdown } from "@/lib/timer";
import ScenarioPanel from "@/components/roleplay/ScenarioPanel";

export default function PrepScreen({
  scenario,
  onComplete,
}: {
  scenario: Scenario;
  onComplete: () => void;
}) {
  const secondsRemaining = useCountdown(PREP_SECONDS, onComplete);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-sm text-zinc-500">Preparation time remaining</p>
        <p className="text-4xl font-mono font-semibold">
          {formatSeconds(secondsRemaining)}
        </p>
        <p className="text-xs text-zinc-500 mt-1">Microphone is off.</p>
      </div>
      <ScenarioPanel scenario={scenario} />
      <button
        onClick={onComplete}
        className="rounded-full bg-foreground px-6 py-3 text-background font-medium"
      >
        I&apos;m Ready — Begin Presentation
      </button>
    </div>
  );
}
