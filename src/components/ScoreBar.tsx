import useScreenSize from "@/hooks/useScreenSize";
import type { ScoreBarProps } from "@/types/common";
import { calcTotal, toSegmentsFromCounts } from "@/utils/fns";
import { forwardRef, memo } from "react";

const ScoreBar = forwardRef<HTMLDivElement, ScoreBarProps>((props, ref) => {
  const {
    correct,
    incorrect,
    skipped,
    segments: segmentsProp,
    height = "12px",
    showPercentInside = true,
    showLegend = true,
    animate = true,
    rounded = true,
    ariaLabel,
    className,
    style,
    ...rest
  } = props;
  const { isMd } = useScreenSize();

  const segments = Array.isArray(segmentsProp)
    ? segmentsProp.map((s) => ({
        ...s,
        value: Math.max(0, Number(s.value) || 0),
      }))
    : toSegmentsFromCounts(correct, incorrect, skipped);

  const total = calcTotal(segments);
  // prepare layout percentages (avoid division by zero)
  const withPct = segments.map((s) => {
    const pct = total === 0 ? 0 : (Number(s.value) / total) * 100;
    // round to one decimal to display nicely but keep raw for width math
    const displayPct = Math.round(pct * 10) / 10;
    return { ...s, pct: pct, displayPct };
  });

  // split into segments with nonzero or zero behaviour:
  const nonZeroSegments = withPct; // we render even zero segments (they will be width 0)

  const containerStyle: React.CSSProperties = {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    ...style,
  };

  const barStyle: React.CSSProperties = {
    display: "flex",
    height: typeof height === "number" ? `${height}px` : height,
    width: "100%",
    overflow: "hidden",
    borderRadius: rounded ? 9999 : 2,
    background: "rgba(0,0,0,0.06)",
    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.03)",
  };

  const segmentBaseStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
    fontSize: 12,
    color: "white",
    overflow: "hidden",
    textOverflow: "ellipsis",
    transition: animate ? "flex-basis 400ms ease, width 400ms ease" : undefined,
  };

  return (
    <div
      ref={ref}
      className={["scorebar-root", className].filter(Boolean).join(" ")}
      style={containerStyle}
      aria-label={ariaLabel ?? "Score breakdown"}
      {...rest}
    >
      <div
        role="img"
        aria-roledescription="progressbar"
        aria-label={ariaLabel ?? "Score breakdown"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(withPct[0]?.pct ?? 0)}
        className="scorebar-track"
        style={barStyle}
      >
        {nonZeroSegments.map((s) => {
          // ensure minimum width for tiny slices if you want (optional)
          const flexBasis = `${s.pct}%`;
          const labelText = `${s.label ?? s.key}: ${s.value} (${s.displayPct}%)`;

          return (
            <div
              key={s.key}
              className={`scorebar-segment scorebar-segment--${s.key}`}
              title={labelText}
              aria-label={labelText}
              role="presentation"
              style={{
                ...segmentBaseStyle,
                background: s.color ?? undefined,
                flexBasis,
                flexGrow: s.pct === 0 ? 0 : s.pct,
                flexShrink: 0,
                color: "white",
              }}
            >
              {showPercentInside && s.displayPct > 0
                ? `${s.displayPct}%`
                : null}
            </div>
          );
        })}
      </div>

      {showLegend ? (
        <div
          className="scorebar-legend"
          style={{
            display: "flex",
            gap: isMd ? 12 : 2,
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {withPct.map((s) => (
            <div
              key={s.key}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                fontSize: 13,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 12,
                  height: 12,
                  background: s.color ?? undefined,
                  borderRadius: 3,
                  display: "inline-block",
                }}
              />
              <span style={{ color: s.color ?? "inherit" }}>
                <strong>{s.label ?? s.key}</strong>{" "}
                <span style={{ color: "rgba(0,0,0,0.6)" }}>
                  {s.value} ({s.displayPct}%)
                </span>
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
});

ScoreBar.displayName = "ScoreBar";
export default memo(ScoreBar);
