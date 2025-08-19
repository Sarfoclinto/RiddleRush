/** timeAgo.ts
 *  - Accepts Convex numeric timestamp (seconds or milliseconds).
 *  - Returns short relative age strings like "3min ago", "1hr ago", "just now".
 */

export type TimeAgoOptions = {
  /** Current time in ms (useful for testing). Defaults to Date.now(). */
  nowMs?: number;
  /** If true, omit the " ago" suffix (returns "3min", "1hr", ...). Default false. */
  short?: boolean;
  /** When true, future times will be returned as "in X" (default true). If false, future times return "0s ago". */
  allowFuture?: boolean;
};

export function timeAgo(
  creationTimeNumber: number,
  options: TimeAgoOptions = {}
): string {
  const { nowMs = Date.now(), short = false, allowFuture = true } = options;

  // Detect seconds vs milliseconds: timestamps in seconds will be < 1e12
  const timeMs =
    creationTimeNumber < 1_000_000_000_000
      ? creationTimeNumber * 1000
      : creationTimeNumber;

  let diffMs = nowMs - timeMs;
  const inFuture = diffMs < 0;
  if (inFuture) diffMs = Math.abs(diffMs);

  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY; // approximate
  const YEAR = 365 * DAY; // approximate

  const r = (n: number) => Math.round(n);

  let out: string;
  if (diffMs < 45 * SECOND) {
    out = "just now";
  } else if (diffMs < MINUTE) {
    out = `${r(diffMs / SECOND)}s`;
  } else if (diffMs < HOUR) {
    out = `${r(diffMs / MINUTE)}min`;
  } else if (diffMs < DAY) {
    out = `${r(diffMs / HOUR)}hr`;
  } else if (diffMs < WEEK) {
    out = `${r(diffMs / DAY)}day`;
  } else if (diffMs < MONTH) {
    out = `${r(diffMs / WEEK)}wk`;
  } else if (diffMs < YEAR) {
    out = `${r(diffMs / MONTH)}mo`;
  } else {
    out = `${r(diffMs / YEAR)}yr`;
  }

  // If we returned "just now", the suffix/prefix choices don't apply.
  if (out === "just now") return out;

  if (inFuture) {
    return allowFuture ? `in ${out}` : `${out}${short ? "" : " ago"}`;
  }
  return short ? out : `${out} ago`;
}

/**
 * const now = Date.now();

// created 3 minutes ago (milliseconds)
timeAgo(now - 3 * 60 * 1000);         // "3min ago"

// created 1 hour ago
timeAgo(now - 60 * 60 * 1000);        // "1hr ago"

// created 1 day ago
timeAgo(now - 24 * 60 * 60 * 1000);   // "1day ago"

// created 90 seconds ago
timeAgo(now - 90 * 1000);             // "2min ago"

// short output without suffix
timeAgo(now - 3 * 60 * 1000, { short: true }); // "3min"

// handles Convex seconds timestamps:
timeAgo(Math.floor(Date.now() / 1000) - 60); // "1min ago"

 */
