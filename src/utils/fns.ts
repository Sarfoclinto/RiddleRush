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