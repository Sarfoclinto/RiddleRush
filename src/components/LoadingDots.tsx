import React, { forwardRef, memo } from "react";

export type LoadingDotsVariant = "wave" | "bounce" | "fade";

export interface LoadingDotsProps {
  size?: number | string; // px number or CSS value like "0.5rem" (default 8)
  color?: string; // dot color (default: currentColor)
  dotCount?: number; // number of dots (default 3)
  gap?: number | string; // space between dots (px number or CSS value) (default 6)
  speed?: number; // animation duration in seconds (default 0.8)
  variant?: LoadingDotsVariant; // "wave" | "bounce" | "fade" (default "wave")
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string; // aria label e.g. "Loading"
  text?: string; // optional visible text next to loader
  inline?: boolean; // if true, display inline-flex (default false)
  center?: boolean; // if true, justify-center / align-center (default true)
  titleId?: string; // optional id for accessible text
}

/**
 * Reusable loading dots component.
 */
const LoadingDots = forwardRef<HTMLDivElement, LoadingDotsProps>(
  (props, ref) => {
    const {
      size = 8,
      color = "currentColor",
      dotCount = 3,
      gap = 6,
      speed = 0.8,
      variant = "wave",
      className,
      style,
      ariaLabel,
      text,
      inline = false,
      center = true,
      titleId,
      ...rest
    } = props;

    const sizeCss = typeof size === "number" ? `${size}px` : size;
    const gapCss = typeof gap === "number" ? `${gap}px` : gap;
    const animationDuration = `${speed}s`;

    const containerStyle: React.CSSProperties = {
      display: inline ? "inline-flex" : "flex",
      alignItems: "center",
      justifyContent: center ? "center" : "flex-start",
      gap: gapCss,
      ...style,
    };

    const dots = Array.from({ length: Math.max(1, dotCount) });

    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        aria-label={ariaLabel ?? text ?? "Loading"}
        className={["loading-dots__root", className].filter(Boolean).join(" ")}
        style={containerStyle}
        {...rest}
      >
        <div
          id={titleId}
          style={{ display: "inline-flex", alignItems: "center", gap: gapCss }}
        >
          {dots.map((_, i) => (
            <span
              key={i}
              className={`loading-dots__dot loading-dots__${variant}`}
              aria-hidden="true"
              style={{
                width: sizeCss,
                height: sizeCss,
                backgroundColor: color,
                borderRadius: "50%",
                display: "inline-block",
                animationDuration,
                // stagger the animation a bit
                animationDelay: `${(i * speed) / Math.max(1, dotCount)}s`,
              }}
            />
          ))}
        </div>

        {text ? (
          // Put a small spacing so text doesn't collide with dots (keyboard / screen reader friendly)
          <span
            style={{ marginLeft: 8 }}
            className="loading-dots__text"
            aria-hidden={false}
          >
            {text}
          </span>
        ) : null}
      </div>
    );
  }
);

LoadingDots.displayName = "LoadingDots";
export default memo(LoadingDots);
