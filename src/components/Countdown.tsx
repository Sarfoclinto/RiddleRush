import { useEffect, useMemo, useState } from "react";
import "../countdown.css";

const Countdown = ({
  seconds,
  targetTimestampMs,
  onComplete,
  fullscreen = true,
  className,
}: CountdownProps) => {
  // Helper: is this value plausibly an absolute ms since epoch?
  const isPlausibleAbsoluteMs = (v?: number) => {
    if (typeof v !== "number") return false;
    // If it's larger than e12 it's almost certainly milliseconds (Date.now() ~ 1.7e12 in 2025).
    // Use a lower bound slightly below current epoch to be tolerant of client clocks.
    return v > 1e11; // > 100 billion (safety threshold)
  };

  // Resolve target timestamp: if seconds provided, create one from now.
  const initialTarget = useMemo(() => {
    // If a plausible absolute timestamp is given, use it.
    if (isPlausibleAbsoluteMs(targetTimestampMs)) {
      return targetTimestampMs as number;
    }

    // If targetTimestampMs is present but small (e.g. 50) treat it as seconds from now.
    if (typeof targetTimestampMs === "number") {
      // assume it's *seconds* count (common mistake) -> convert to ms
      return Date.now() + Math.round(targetTimestampMs * 1000);
    }

    // If seconds is provided, use it.
    if (typeof seconds === "number") {
      return Date.now() + seconds * 1000;
    }

    // default: immediate (so remaining will be 0 and nothing renders)
    return Date.now();
  }, [seconds, targetTimestampMs]);

  const [target, setTarget] = useState<number>(initialTarget);
  const [remaining, setRemaining] = useState<number>(() =>
    Math.max(0, Math.ceil((initialTarget - Date.now()) / 1000))
  );

  // If props change, update target sensibly
  useEffect(() => {
    // recalc same logic as initialTarget (keeps consistent behavior if parent changes props)
    let newTarget = initialTarget;
    // if caller provided a plausible absolute timestamp after mount, prefer it
    if (isPlausibleAbsoluteMs(targetTimestampMs)) {
      newTarget = targetTimestampMs as number;
    } else if (typeof targetTimestampMs === "number") {
      newTarget = Date.now() + Math.round(targetTimestampMs * 1000);
    } else if (typeof seconds === "number") {
      newTarget = Date.now() + seconds * 1000;
    }
    setTarget(newTarget);
    setRemaining(Math.max(0, Math.ceil((newTarget - Date.now()) / 1000)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, targetTimestampMs]);

  useEffect(() => {
    let cancelled = false;

    function tick() {
      if (cancelled) return;
      const rem = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      setRemaining((prev) => {
        if (rem !== prev) return rem;
        return prev;
      });
      if (rem === 0) {
        onComplete?.();
      }
    }

    tick();
    const id = window.setInterval(tick, 150);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [target, onComplete]);

  // If remaining is 0, nothing to animate/show (parent may unmount this)
  if (remaining <= 0) return null;

  // By keying the number with `remaining` we restart CSS animation each tick.
  const numericNode = (
    <div className="count-number" key={remaining} aria-live="assertive">
      {remaining}
    </div>
  );

  if (fullscreen) {
    return (
      <div className={`countdown-overlay ${className ?? ""}`}>
        {numericNode}
      </div>
    );
  }

  return (
    <div className={`countdown-inline ${className ?? ""}`}>{numericNode}</div>
  );
};
export default Countdown;

type CountdownProps = {
  /** Number of seconds to count down locally (mutually exclusive with targetTimestampMs) */
  seconds?: number;
  /** Target timestamp in ms since epoch (server-provided recommended for multiplayer sync)
   * /**
   * Target timestamp in ms since epoch OR a small number that should be interpreted as "seconds from now".
   * If you pass an absolute timestamp, it must be a millis-since-1970 value (e.g. Date.now() + 5000).
   */
  targetTimestampMs?: number;
  /** Called when countdown reaches zero */
  onComplete?: () => void;
  /** Optional: whether to render full-screen overlay (default true) */
  fullscreen?: boolean;
  /** Optional: className for the outer wrapper */
  className?: string;
};
