import type { ClapAudioProps } from "@/types/common";
import { useEffect, useRef } from "react";

const ClapAudio: React.FC<ClapAudioProps> = ({
  src,
  durationMs = 3000,
  volume = 0.9,
  autoplay = true,
  onEnd,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.volume = volume;
    audio.preload = "auto";
    // do not loop — we'll stop after duration
    audio.loop = false;

    const play = async () => {
      try {
        // many browsers require gesture; attempt play and gracefully handle rejection
        await audio.play();
        // schedule stop
        timerRef.current = window.setTimeout(() => {
          try {
            audio.pause();
            audio.currentTime = 0;
          } catch (err) {
            console.error(err);
          }
          if (onEnd) onEnd();
        }, durationMs);
      } catch (err) {
        // autoplay blocked — silence failure (caller can show fallback UI)
        console.warn("ClapAudio: autoplay blocked or failed:", err);
        if (onEnd) {
          // if autoplay fails, still call onEnd after durationMs to keep timeline consistent
          timerRef.current = window.setTimeout(onEnd, durationMs);
        }
      }
    };

    if (autoplay) play();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (err) {
        console.error(err);
      }
      audioRef.current = null;
    };
    // We intentionally do not include onEnd in deps to avoid re-creating audio repeatedly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, durationMs, volume, autoplay]);

  // Expose nothing visually — you can add a small control if you want gesture fallback.
  return null;
};

export default ClapAudio;
