import type { NotificationBellProps } from "@/types/common";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { BellDotIcon, BellIcon } from "lucide-react";
import noteSound from "/notification.mp3";

export function NotificationBell({
  hasUnread,
  unreadCount,
  onClick,
  soundUrl = noteSound,
  playSound = false,
  shakeDuration = 700,
  shakeInterval = 2000,
  className,
  ariaLabel = "Notifications",
  soundPlayMode = "interval",
  soundInterval = 100000,
}: NotificationBellProps) {
  const [isShaking, setIsShaking] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef<boolean>(false); // for optional autoplay unlocking

  // Track whether we've played the "once" sound for the current unread session
  const playedOnceRef = useRef(false);
  // Track last time sound was played (ms since epoch) for "interval" mode
  const lastPlayedAtRef = useRef<number>(0);

  // Track previous unread count to detect increases
  const prevCountRef = useRef<number>(unreadCount ?? 0);

  // Prepare audio element once
  useEffect(() => {
    if (playSound && soundUrl) {
      audioRef.current = new Audio(soundUrl);
      audioRef.current.preload = "auto";
      // don't call play() here — browsers often require user gesture
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [playSound, soundUrl]);

  // Cleanup helpers
  const clearTimers = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const tryPlaySound = () => {
    if (!playSound || !audioRef.current) return;
    const p = audioRef.current.play();
    if (p instanceof Promise) {
      p.catch(() => {
        // autoplay blocked — silently ignore
      });
    }
  };

  // This decides whether to play sound according to mode and timing.
  const playSoundAccordingToMode = () => {
    if (!playSound || !audioRef.current) return;

    const now = Date.now();

    if (soundPlayMode === "everyShake") {
      tryPlaySound();
      lastPlayedAtRef.current = now;
      return;
    }

    if (soundPlayMode === "once") {
      // play only once per unread session (when unread appears)
      if (!playedOnceRef.current) {
        tryPlaySound();
        playedOnceRef.current = true;
        lastPlayedAtRef.current = now;
      }
      return;
    }

    if (soundPlayMode === "interval") {
      // play at most once per soundInterval ms
      if (now - lastPlayedAtRef.current >= Math.max(0, soundInterval)) {
        tryPlaySound();
        lastPlayedAtRef.current = now;
      }
      return;
    }
  };

  // Function to trigger a single shake (and optional sound)
  const triggerShake = () => {
    // set shaking true
    setIsShaking(true);
    // turn off after duration
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setIsShaking(false);
      timeoutRef.current = null;
    }, shakeDuration);

    // play sound if available
    // if (playSound && audioRef.current) {
    //   // try to play; catch rejected promise (autoplay blocked)
    //   const audio = audioRef.current;
    //   const p = audio.play();
    //   if (p instanceof Promise) {
    //     p.catch(() => {
    //       // autoplay blocked — ignore silently
    //       // optionally you can show UI to ask user to enable sounds
    //     });
    //   }
    // }
    // Sound behavior is handled here (but note "once" mode may also be triggered
    // from the hasUnread transition effect below to ensure immediate play on
    // unread arrival).
    if (soundPlayMode !== "once") {
      // for "everyShake" and "interval", decide here
      playSoundAccordingToMode();
    }
  };

  // Start/stop interval when hasUnread changes
  useEffect(() => {
    clearTimers();
    if (hasUnread) {
      // If mode === "once" we want to play immediately on the transition from false -> true.
      // We'll also trigger a shake immediately.
      triggerShake();

      if (soundPlayMode === "once") {
        // If not already played for this unread session, play now.
        playSoundAccordingToMode();
      }

      intervalRef.current = window.setInterval(() => {
        triggerShake();
      }, shakeInterval);
    } else {
      // reset "once" state when everything is read so a future unread can trigger sound again
      playedOnceRef.current = false;
      lastPlayedAtRef.current = 0;
      setIsShaking(false);
    }

    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasUnread,
    shakeDuration,
    shakeInterval,
    playSound,
    soundPlayMode,
    soundInterval,
  ]);

  // Watch unreadCount for increases — if it increases and mode === "countincrease", play sound.
  useEffect(() => {
    const prev = prevCountRef.current;
    const current = unreadCount ?? 0;

    if (playSound && soundPlayMode === "countincrease" && current > prev) {
      // immediate ring on count increase
      tryPlaySound();
      lastPlayedAtRef.current = Date.now();
      // optionally trigger a visual shake for the increase as well:
      // setIsShaking(true);
      // window.setTimeout(() => setIsShaking(false), shakeDuration);
    }

    // keep prev updated for next change
    prevCountRef.current = current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadCount, playSound, soundPlayMode, shakeDuration]);

  // Optional: a small helper you can call on first user gesture to "unlock" audio
  // (browsers usually allow audio after a user interacts). You may want to call
  // this from some high-level click handler in your app.
  const unlockAudioOnUserGesture = () => {
    if (audioRef.current && !unlockedRef.current) {
      // try to play silently then pause to acquire gesture-permission
      audioRef.current.muted = true;
      audioRef.current
        .play()
        .then(() => {
          audioRef.current!.pause();
          audioRef.current!.muted = false;
          unlockedRef.current = true;
        })
        .catch(() => {
          // ignore
          if (audioRef.current) audioRef.current.muted = false;
        });
    }
  };

  // optional: expose unlocking via a data attribute so parent can call it
  // or just call unlockAudioOnUserGesture() from your top-level click handler.

  return (
    <button
      type="button"
      onClick={() => {
        // try to unlock audio if user clicks the button
        unlockAudioOnUserGesture();
        if (onClick) onClick();
      }}
      aria-label={ariaLabel}
      aria-live="polite"
      className={clsx(
        "notification-bell p-2 rounded-full hover:bg-primary/10 bg-primary/20 cursor-pointer",
        className,
        {
          "is-shaking": isShaking,
          "has-unread": hasUnread,
        }
      )}
      style={{
        // basic reset; prefer to move styles into CSS file in prod
        border: "none",
        background: "transparent",
        cursor: "pointer",
        position: "relative",
      }}
    >
      {/* You can replace SVG with your icon set */}
      {hasUnread ? <BellDotIcon color={"red"} /> : <BellIcon />}

      {/* badge */}
      {unreadCount !== undefined && unreadCount > 0 ? (
        <span
          className="badge"
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            background: "#e11d48",
            color: "white",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            padding: "0 4px",
            lineHeight: 1,
          }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}

      {/* Inline styles for the shake animation — move to CSS file if you prefer */}
      <style>{`
        @keyframes bell-shake {
          0% { transform: translateY(0) rotate(0deg); }
          15% { transform: translateY(-3px) rotate(-10deg); }
          30% { transform: translateY(0) rotate(8deg); }
          45% { transform: translateY(-2px) rotate(-6deg); }
          60% { transform: translateY(0) rotate(4deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        .notification-bell.is-shaking svg {
          animation: bell-shake ${shakeDuration}ms ease-in-out;
        }
      `}</style>
    </button>
  );
}
