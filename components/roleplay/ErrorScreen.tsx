import type { SessionError } from "@/types/session";

export default function ErrorScreen({
  error,
  onStartOver,
}: {
  error: SessionError;
  onStartOver: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 text-center max-w-md">
      <p className="text-sm font-semibold text-red-600">Something went wrong</p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{error.message}</p>
      <button
        onClick={onStartOver}
        className="rounded-full bg-foreground px-6 py-3 text-background font-medium"
      >
        Start Over
      </button>
    </div>
  );
}
