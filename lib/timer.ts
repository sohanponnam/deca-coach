import { useEffect, useEffectEvent, useRef, useState } from "react";

/**
 * Ticks are driven off an absolute end/start timestamp rather than decrementing
 * a counter, so a throttled/backgrounded tab self-corrects the moment it ticks
 * again instead of drifting. The visibilitychange/focus listeners just make the
 * correction happen immediately when the tab regains focus, for a snappier UI.
 */
const TICK_INTERVAL_MS = 250;

/**
 * Counts down from durationSeconds, starting when the component mounts, and
 * calls onComplete exactly once when it reaches zero. Intended to be mounted
 * only while its screen is active — unmounting (leaving that state) is what
 * stops it, which the state machine already guarantees by rendering one
 * screen at a time.
 */
export function useCountdown(durationSeconds: number, onComplete: () => void): number {
  const [secondsRemaining, setSecondsRemaining] = useState(durationSeconds);
  const endTimeRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  const handleTick = useEffectEvent(() => {
    if (endTimeRef.current === null) {
      endTimeRef.current = Date.now() + durationSeconds * 1000;
    }
    const remainingMs = endTimeRef.current - Date.now();
    const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
    setSecondsRemaining(remainingSeconds);
    if (remainingMs <= 0 && !firedRef.current) {
      firedRef.current = true;
      onComplete();
    }
  });

  useEffect(() => {
    handleTick();
    const intervalId = setInterval(handleTick, TICK_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleTick);
    window.addEventListener("focus", handleTick);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleTick);
      window.removeEventListener("focus", handleTick);
    };
  }, []);

  return secondsRemaining;
}

export function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
