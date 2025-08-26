import type { Id } from "convex/_generated/dataModel";
import type { NavigateFunction } from "react-router-dom";

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
  stop: () => void;
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
  _id: Id<"playtimes">;
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

export type Segment = {
  key: string; // unique key
  label?: string; // shown in legend / aria
  value: number; // numeric value (>= 0)
  color?: string; // CSS color
};

export interface ScoreBarProps extends React.HTMLAttributes<HTMLDivElement> {
  // Option A: simple counts (preferred for your use case)
  correct?: number;
  incorrect?: number;
  skipped?: number;

  // Option B: custom segments array (overrides counts if provided)
  segments?: Segment[];

  // visuals
  height?: number | string; // px number or CSS value (default "12px")
  showPercentInside?: boolean; // show % inside each segment (default true)
  showLegend?: boolean; // show legend with counts (default true)
  animate?: boolean; // animate width changes (default true)
  rounded?: boolean; // rounded corners (default true)
  className?: string;
  style?: React.CSSProperties;
  // accessibility
  ariaLabel?: string; // default: "Score breakdown"
}
export type SoundPlayMode =
  | "once"
  | "interval"
  | "everyShake"
  | "countincrease";

export type NotificationBellProps = {
  hasUnread: boolean; // required: whether there's an unread notification
  unreadCount?: number; // optional: badge count
  onClick?: () => void; // click handler
  soundUrl?: string; // optional: notification sound URL
  playSound?: boolean; // default false
  shakeDuration?: number; // ms the shake animation runs (default 700)
  shakeInterval?: number; // ms between starts of shakes (default 2000)
  className?: string; // passthrough className
  ariaLabel?: string; // aria-label for button
  children?: React.ReactNode; // optional children to render inside button
  soundPlayMode?: SoundPlayMode; // "once" | "interval" | "everyShake"
  soundInterval?: number; // ms for "interval" mode (default 5000)
};

export type Size = "sm" | "md" | "lg" | number;

export interface GlowingTextProps {
  isPlaying: boolean;
  text?: string;
  glowColor?: string; // any CSS color (hex, rgb, named)
  pulseDuration?: number; // seconds (e.g. 1.2)
  size?: Size; // 'sm' | 'md' | 'lg' | numeric px
  className?: string;
  style?: React.CSSProperties;
  // If true the wrapper is fixed bottom center. If false, it will flow inline where placed.
  fixedBottom?: boolean;
}

export type ClapAudioProps = {
  /** Public URL or imported module path to audio (e.g. '/sounds/clap.mp3' or imported file) */
  src: string;
  /** how long to play in milliseconds */
  durationMs?: number;
  /** 0..1 */
  volume?: number;
  /** whether to attempt autoplay on mount */
  autoplay?: boolean;
  /** callback when audio stops (after duration or when manually stopped) */
  onEnd?: () => void;
};

export interface Room {
  host: {
    _id: Id<"users">;
    _creationTime: number;
    email?: string | undefined;
    fullname?: string | undefined;
    clerkId?: string | undefined;
    image?: string | undefined;
    username: string;
  } | null;
  _id: Id<"rooms">;
  noOfRiddles: number;
  code: string;
  name: string | undefined;
  hostId: Id<"users">;
  status: "public" | "private";
  maxPlayers: number;
  startUser: Id<"users"> | undefined;
  playing: boolean;
  noOfPlayers: number;
  ishost: boolean;
  request: string;
}

export type toast = (
  message?: string | undefined,
  type?: "success" | "error" | "info" | undefined,
  duration?: number | undefined
) => void;

export type navigate = NavigateFunction;

export type ALreadyRoomPlayer =
  | {
      ok: boolean;
      roomId: Id<"rooms">;
      message?: undefined;
    }
  | {
      ok: boolean;
      message: string;
      roomId?: undefined;
    }
  | null
  | undefined;
