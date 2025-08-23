/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GlowingTextProps } from "@/types/common";
import "../glowingText.css";
import { useMemo } from "react";

const GlowingText = ({
  isPlaying,
  text = "You are playing",
  glowColor = "#7c3aed", // nice violet by default
  pulseDuration = 1.1,
  size = "md",
  className = "",
  style,
  fixedBottom = true,
}: GlowingTextProps) => {
  const fontSize = useMemo(() => {
    if (typeof size === "number") return `${size}px`;
    switch (size) {
      case "sm":
        return "14px";
      case "lg":
        return "20px";
      case "md":
      default:
        return "16px";
    }
  }, [size]);

  if (!isPlaying) return null;
  return (
    <div
      className={`glow-wrap ${fixedBottom ? "glow-fixed" : ""} ${className}`}
      // expose variables to CSS
      style={{
        ["--glow-color" as any]: glowColor,
        ["--pulse-dur" as any]: `${pulseDuration}s`,
        ["--font-size" as any]: fontSize,
        pointerEvents: "none", // allow clicking through unless user wants otherwise
        ...style,
      }}
      role="status"
      aria-live="polite"
    >
      <span className="glowing-text">{text}</span>
    </div>
  );
};
export default GlowingText;
