import type { Scenario } from "@/lib/scenario";
import ScenarioPanel from "@/components/roleplay/ScenarioPanel";

export default function IntroScreen({
  scenario,
  useTextFallback,
  onStart,
}: {
  scenario: Scenario;
  useTextFallback: boolean;
  onStart: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6">
      <ScenarioPanel scenario={scenario} />
      {useTextFallback ? (
        <p className="text-xs text-zinc-500 text-center max-w-md">
          Speech recognition isn&apos;t available in this browser — you&apos;ll type your
          presentation and follow-up answers instead of speaking them.
        </p>
      ) : null}
      <button
        onClick={onStart}
        className="rounded-full bg-foreground px-6 py-3 text-background font-medium"
      >
        Start Preparation
      </button>
    </div>
  );
}
