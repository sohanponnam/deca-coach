import type { SubmitPhase } from "@/types/session";

export default function SubmittingScreen({ submitPhase }: { submitPhase: SubmitPhase }) {
  return (
    <div className="text-center">
      <p className="text-sm text-zinc-500">
        {submitPhase === "scoring"
          ? "Claude is evaluating your Performance Indicators..."
          : "Submitting your presentation and answers..."}
      </p>
    </div>
  );
}
