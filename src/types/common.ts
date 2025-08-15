import type { Id } from "convex/_generated/dataModel";

type Category = "science" | "math" | "mystery" | "funny" | "logic" | "who-am-i";

export interface Riddle {
  riddle: string;
  answer: string;
  category: Category;
}

export type CatRiddle = Omit<Riddle, "category">;
export type StorageKeys = "playtime" | "playtimeForm" | "playtimeId";

export interface CatRiddles {
  riddlesArray: CatRiddle[];
  category: Category;
}

export interface PlaytimeForm {
  username: string;
  numberOfRiddles: number;
  category: Category;
  timeSpan: number;
}

export interface TimerProgressBarHandle {
  start: () => void;
  pause: () => void;
  reset: (newDurationSeconds?: number) => void;
  getRemaining: () => number;
}

export type FormatFn = (remainingSeconds: number) => string;

export interface TimerProgressBarProps {
  /** total time in seconds */
  duration: number;

  /** auto-start when mounted (default: true) */
  autoStart?: boolean;

  /** externally control play/pause (optional). If omitted, internal control via ref methods is used. */
  isPlaying?: boolean | null;

  /** called every animation frame-ish with remaining seconds (optional) */
  onTick?: (remainingSeconds: number) => void;

  /** called once when timer reaches 0 */
  onComplete?: () => void;

  /** show remaining time text on the bar */
  showTime?: boolean;

  /** height of the bar (CSS size) */
  height?: string;

  /** background track color */
  trackColor?: string;

  /** foreground / fill color */
  fillColor?: string;

  /** CSS class for outer container */
  className?: string;

  /** custom formatter for time text */
  format?: "s" | "mm:ss" | FormatFn;

  /** small visual smoothing: if true uses RAF updates (default true) */
  smooth?: boolean;

  /** When this prop changes the timer is reset (useful for restarting) */
  resetKey?: unknown;

  /* SOUND RELATED */
  tickSoundUrl?: string | null; // e.g. "/tick.mp3"
  tickVolume?: number; // 0..1, default 1
  muted?: boolean; // if true, don't play
  playOnEveryFraction?: boolean; // if true, plays on every RAF tick (not recommended) — default false (once per second)
}

export interface Playtime {
  _creationTime: number;
  corrects?: string[] | undefined;
  incorrects?: string[] | undefined;
  skipped?: string[] | undefined;
  current?: string | undefined;
  previous?: string | undefined;
  next?: string | undefined;
  riddles: {
    _id: Id<"riddles">;
    done: boolean;
  }[];
  userId: Id<"users">;
  playing: boolean;
  secondsPerRiddle: number;
}

export interface User {
  _id: Id<"users">;
  _creationTime: number;
  email?: string | undefined;
  clerkId?: string | undefined;
  image?: string | undefined;
  username: string;
}

export interface HeaderProps {
  playtime: HeaderPlaytime;
  showProgress: boolean;
}

export type HeaderPlaytime = Playtime & { user: User | null };

// export type HeaderPlaytime = {
//   _creationTime: number;
//   corrects?: string[] | undefined;
//   incorrects?: string[] | undefined;
//   skipped?: string[] | undefined;
//   current?: string | undefined;
//   previous?: string | undefined;
//   next?: string | undefined;
//   riddles: {
//     _id: Id<"riddles">;
//     done: boolean;
//   }[];
//   userId: Id<"users">;
//   playing: boolean;
//   secondsPerRiddle: number;
//   user: {
//     _id: Id<"users">;
//     _creationTime: number;
//     email?: string | undefined;
//     clerkId?: string | undefined;
//     image?: string | undefined;
//     username: string;
//   };
// };
