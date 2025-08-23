import type { Segment } from "@/types/common";
import type { Id } from "myconvex/_generated/dataModel";

export const capitalize = (str: string): string => {
  // use regex
  return str.replace(/^[a-z]/, (match) => match.toUpperCase());
};

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export function defaultFormat(remainingSeconds: number) {
  return `${Math.ceil(remainingSeconds)}s`;
}

export function mmssFormat(remainingSeconds: number) {
  const s = Math.max(0, Math.ceil(remainingSeconds));
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

const defaultColors = {
  correct: "#16a34a", // green
  incorrect: "#ef4444", // red
  skipped: "#f59e0b", // amber
};

export function toSegmentsFromCounts(
  correct = 0,
  incorrect = 0,
  skipped = 0
): Segment[] {
  return [
    {
      key: "correct",
      label: "Correct",
      value: Math.max(0, Number(correct) || 0),
      color: defaultColors.correct,
    },
    {
      key: "incorrect",
      label: "Incorrect",
      value: Math.max(0, Number(incorrect) || 0),
      color: defaultColors.incorrect,
    },
    {
      key: "skipped",
      label: "Skipped",
      value: Math.max(0, Number(skipped) || 0),
      color: defaultColors.skipped,
    },
  ];
}

export function calcTotal(segments: Segment[]) {
  // ensure numeric conversion and avoid negative values:
  let total = 0;
  for (const s of segments) total += Math.max(0, Number(s.value) || 0);
  return total;
}

// types (match your schema)
type Result = "correct" | "incorrect" | "skipped" | "timedOut";

type PlayEntry = {
  riddleId: Id<"riddles">; // or string if you prefer
  done: boolean;
  playedBy: Id<"users">;
  turnIndex: number;
  result: Result;
};

type Scores = {
  correct: number;
  incorrect: number;
  skipped: number;
  timedOut: number;
  total: number; // sum of the four above (useful)
};

export function computeScores(
  plays?: PlayEntry[] | null,
  playedBy?: Id<"users">
): Scores {
  const initial: Scores = {
    correct: 0,
    incorrect: 0,
    skipped: 0,
    timedOut: 0,
    total: 0,
  };

  if (!plays || plays.length === 0) return initial;

  return plays.reduce((acc, p) => {
    // optionally filter by player
    if (playedBy && p.playedBy !== playedBy) return acc;

    switch (p.result) {
      case "correct":
        acc.correct++;
        break;
      case "incorrect":
        acc.incorrect++;
        break;
      case "skipped":
        acc.skipped++;
        break;
      case "timedOut":
        acc.timedOut++;
        break;
      default:
        // this should never happen if types are enforced, but safe-guard anyway
        break;
    }
    acc.total++;
    return acc;
  }, initial);
}
