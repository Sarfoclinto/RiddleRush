import type {
  FormatFn,
  TimerProgressBarHandle,
  TimerProgressBarProps,
} from "@/types/common";
import { clamp, defaultFormat, mmssFormat } from "@/utils/fns";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

/**
 * TimerProgressBar
 *
 * - duration: seconds
 * - forwards ref allows start/pause/reset/getRemaining
 */
export const TimerProgressBar = forwardRef<
  TimerProgressBarHandle,
  TimerProgressBarProps
>((props, ref) => {
  const {
    duration,
    autoStart = true,
    isPlaying = null,
    onTick,
    onComplete,
    showTime = true,
    height = "14px",
    trackColor = "#e6e6e6",
    fillColor = "#16a34a", // green-ish default
    className,
    format = "s",
    smooth = true,
    resetKey,

    tickSoundUrl = "/tick.mp3",
    tickVolume = 1,
    muted = false,
    playOnEveryFraction = false,
  } = props;

  // internal state: fraction elapsed [0..1]
  const [elapsedFraction, setElapsedFraction] = useState(0);
  // store remaining seconds for quick access
  const remainingRef = useRef<number>(duration);

  // refs for timing
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null); // DOMHighRes timestamp ms
  const pausedElapsedRef = useRef<number>(0); // seconds elapsed before pause
  const runningRef = useRef<boolean>(false);
  const lastOnTickRef = useRef<number>(0);

  // For tick-sound: remember the last whole-second we reported
  const lastSecondRef = useRef<number>(Math.ceil(duration));

  // Audio element ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // compute formatter
  const formatFn: FormatFn =
    typeof format === "function"
      ? format
      : format === "mm:ss"
        ? mmssFormat
        : defaultFormat;

  // helper to play tick sound (safe)
  const playTickSound = useCallback(() => {
    if (muted) return;
    const a = audioRef.current;
    if (!a) return;
    try {
      // reset to start so repeated ticks play cleanly
      a.currentTime = 0;
      const p = a.play();
      if (p && typeof p.then === "function") {
        p.catch(() => {
          // play rejected (common before user gesture) — ignore silently
        });
      }
    } catch {
      // ignore play errors
    }
  }, [muted]);

  // core tick function
  const tick = useCallback(
    (t: number) => {
      // t is DOMHighRes timestamp (ms)
      if (startTimeRef.current === null) startTimeRef.current = t;
      const elapsedMs = t - startTimeRef.current; // ms since start (excluding previous paused elapsed)
      const elapsedSec = pausedElapsedRef.current + elapsedMs / 1000;
      const fraction = clamp(elapsedSec / Math.max(0.000001, duration), 0, 1);
      const remaining = Math.max(0, duration - elapsedSec);

      remainingRef.current = remaining;
      setElapsedFraction(fraction);

      // call onTick at most ~60hz (RAF) but allow consumer to sample it
      if (onTick) {
        // avoid flooding if someone attaches heavy work: only call when frame advanced enough (but still ~60hz)
        if (t - lastOnTickRef.current > 0) {
          onTick(remaining);
          lastOnTickRef.current = t;
        }
      }

      // Play tick sound once per second crossing (unless playOnEveryFraction is true)
      if (tickSoundUrl && !muted) {
        if (playOnEveryFraction) {
          // play on every tick (not recommended; heavy)
          playTickSound();
        } else {
          // play when whole-second changed (countdown style)
          const sec = Math.ceil(Math.max(0, remaining));
          if (sec !== lastSecondRef.current) {
            // play only when second decreases (avoid double plays on small jitter)
            // We expect lastSecondRef.current >= sec; update to sec
            lastSecondRef.current = sec;
            if (remaining > 0) playTickSound();
          }
        }
      }

      if (fraction >= 1) {
        runningRef.current = false;
        startTimeRef.current = null;
        pausedElapsedRef.current = duration;
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        if (onComplete) onComplete();
        return;
      }

      // continue
      if (smooth) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // if smooth is false, still use RAF but throttle updates to e.g. 10fps (100ms)
        rafRef.current = requestAnimationFrame(tick);
      }
    },
    [
      duration,
      onTick,
      tickSoundUrl,
      muted,
      smooth,
      playOnEveryFraction,
      playTickSound,
      onComplete,
    ]
  );

  // start function
  const start = useCallback(() => {
    if (runningRef.current) return;
    // start/resume
    runningRef.current = true;
    startTimeRef.current = null; // will be set on first tick
    // ensure lastSecondRef uses current remaining so we only tick when next second crosses
    lastSecondRef.current = Math.ceil(remainingRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  // add this near your other callbacks (start/pause/reset)
  const stop = useCallback(() => {
    // cancel any scheduled frame
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    // mark as not running
    runningRef.current = false;
    // clear start timestamp so future start/resume behaves correctly
    startTimeRef.current = null;
    // freeze current elapsed state (so UI remains where it was)
    // derive from elapsedFraction to avoid drift
    pausedElapsedRef.current = elapsedFraction * duration;
    // do NOT call onComplete here
  }, [elapsedFraction, duration]);

  // pause function
  const pause = useCallback(() => {
    if (!runningRef.current) return;
    runningRef.current = false;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    // compute pausedElapsedRef from current state
    // we can use elapsedFraction * duration, but to avoid tiny drift, compute directly
    pausedElapsedRef.current = Math.min(
      duration,
      pausedElapsedRef.current +
        elapsedFraction * duration -
        pausedElapsedRef.current
    );
    // simpler: derive from elapsedFraction
    pausedElapsedRef.current = elapsedFraction * duration;
  }, [elapsedFraction, duration]);

  // reset function
  const reset = useCallback(
    (newDurationSeconds?: number) => {
      // stop
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      runningRef.current = false;
      startTimeRef.current = null;
      pausedElapsedRef.current = 0;
      const d =
        typeof newDurationSeconds === "number" ? newDurationSeconds : duration;
      remainingRef.current = d;
      setElapsedFraction(0);
      if (typeof newDurationSeconds === "number") {
        // if duration changed via reset, we don't mutate prop `duration` (caller must pass prop). This only updates internal remainingRef.
      }
      // autoStart behavior
      if (autoStart) {
        // small timeout so state update above is painted before starting
        rafRef.current = requestAnimationFrame(tick);
        runningRef.current = true;
      }
    },
    [duration, autoStart, tick]
  );

  // Expose imperative handle
  useImperativeHandle(
    ref,
    (): TimerProgressBarHandle => ({
      start,
      pause,
      reset,
      stop,
      getRemaining: () => remainingRef.current,
    }),
    [start, pause, reset, stop]
  );

  // preload audio if provided
  useEffect(() => {
    if (!tickSoundUrl) {
      audioRef.current = null;
      return;
    }
    try {
      const a = new Audio(tickSoundUrl);
      a.preload = "auto";
      a.volume = clamp(tickVolume, 0, 1);
      // Some browsers won't allow load()/play until a user gesture, but preload is harmless.
      a.load();
      audioRef.current = a;
    } catch {
      // ignore audio creation errors
      audioRef.current = null;
    }
    return () => {
      if (audioRef.current) {
        // release reference; don't call pause to avoid interfering with other audio
        audioRef.current = null;
      }
    };
  }, [tickSoundUrl, tickVolume]);

  // respond to isPlaying prop if set
  useEffect(() => {
    if (isPlaying === null) return; // uncontrolled
    if (isPlaying) {
      start();
    } else {
      pause();
    }
  }, [isPlaying, start, pause]);

  // when duration prop changes -> reset internally
  useEffect(() => {
    // reset internal timing data
    pausedElapsedRef.current = 0;
    remainingRef.current = duration;
    setElapsedFraction(0);
    startTimeRef.current = null;

    // if autoStart, start immediately after duration change
    if (autoStart) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      runningRef.current = true;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      // don't start
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      runningRef.current = false;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]); // intentionally only depend on duration

  // support resetKey to force reset when it changes
  useEffect(() => {
    // behave like reset + autoStart config
    pausedElapsedRef.current = 0;
    remainingRef.current = duration;
    setElapsedFraction(0);
    startTimeRef.current = null;

    startTimeRef.current = null;
    lastSecondRef.current = Math.ceil(duration);
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (autoStart) {
      runningRef.current = true;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      runningRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // compute left percent (remaining)
  const leftPercent = clamp(100 * (1 - elapsedFraction), 0, 100);

  const remainingSeconds = remainingRef.current;
  const timeText = formatFn(remainingSeconds);

  return (
    <div
      className={className}
      style={{
        width: "100%",
        background: trackColor,
        borderRadius: 6,
        overflow: "hidden",
        height,
        position: "relative",
        userSelect: "none",
      }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={Math.max(0, Math.round(remainingSeconds))}
      aria-label="Time remaining"
    >
      <div
        style={{
          width: `${leftPercent}%`,
          height: "100%",
          background: fillColor,
          transition: smooth ? undefined : "width 120ms linear",
          transformOrigin: "left center",
          willChange: "width",
        }}
      />
      {showTime && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.85em",
            fontWeight: 600,
            pointerEvents: "none",
            color: "", //"rgba(0,0,0,0.75)",
            textShadow: "0 1px 0 rgba(255,255,255,0.6)",
          }}
        >
          {timeText}
        </div>
      )}
    </div>
  );
});

export default TimerProgressBar;
