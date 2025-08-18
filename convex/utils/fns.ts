"use node";

import type { Id } from "../_generated/dataModel";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Browser / Deno (Web Crypto)
export async function hashString(
  input: string,
  opts?: {
    encoding?: "hex" | "base64" | "base64url";
    truncateBytes?: number; // optional: keep only first N bytes of the digest
  }
): Promise<string> {
  const encoding = opts?.encoding ?? "base64url";
  const truncateBytes = opts?.truncateBytes;

  const enc = new TextEncoder();
  const data = enc.encode(input);
  const fullBuf = await (
    crypto.subtle || (globalThis as any).crypto.subtle
  ).digest("SHA-256", data);
  let bytes = new Uint8Array(fullBuf);

  if (typeof truncateBytes === "number") {
    if (truncateBytes <= 0) throw new Error("truncateBytes must be > 0");
    bytes = bytes.slice(0, truncateBytes);
  }

  if (encoding === "hex") {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // convert bytes -> binary string in chunks (safe for large arrays)
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const b64 = btoa(binary); // standard base64 with padding

  if (encoding === "base64") {
    return b64;
  }

  // base64url: replace chars and remove padding
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function computePointersFromIndex(
  arr: { _id: string; done: boolean }[],
  idx: number | null
) {
  if (idx === null || idx < 0 || idx >= arr.length) {
    return {
      previous: undefined,
      current: undefined,
      next: undefined,
      currentIndex: undefined,
    };
  }
  const current = arr[idx]._id as string;
  const previous = idx - 1 >= 0 ? arr[idx - 1]._id : undefined;
  const next = idx + 1 < arr.length ? arr[idx + 1]._id : undefined;
  return { previous, current, next, currentIndex: idx };
}

export async function generateRoomCode(opts: GenOpts = {}): Promise<string> {
  const { length = 6, maxAttempts = 10, existing = null, prefix = "" } = opts;

  const existingSet: Set<string> | null = existing
    ? Array.isArray(existing)
      ? new Set(existing)
      : existing instanceof Set
        ? existing
        : null
    : null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = await makeCode(length);
    const full = prefix ? `${prefix}${code}` : code;
    if (!existingSet || !existingSet.has(full)) {
      return full;
    }
    // otherwise retry
  }

  throw new Error(
    `Unable to generate a unique room code after ${maxAttempts} attempts. ` +
      `Consider increasing length or maxAttempts, or check your existing set.`
  );
}

type GenOpts = {
  length?: number;
  maxAttempts?: number;
  existing?: Set<string> | string[] | null;
  prefix?: string;
};

const SAFE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // excluded: 0, O, 1, I, L

async function getRandomBytes(n: number): Promise<Uint8Array> {
  // Browser (Web Crypto)
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.crypto?.getRandomValues === "function"
  ) {
    const arr = new Uint8Array(n);
    globalThis.crypto.getRandomValues(arr);
    return arr;
  }

  // Node.js
  try {
    const crypto = await import("crypto");
    if (crypto && typeof crypto.randomBytes === "function") {
      return new Uint8Array(crypto.randomBytes(n));
    }
  } catch {
    // ignore if require is not available (e.g., in browser)
  }

  // Fallback (not cryptographically secure)
  const arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) arr[i] = Math.floor(Math.random() * 256);
  return arr;
}

// function randomInt(max: number): number {
//   // simple uniform random using getRandomBytes, small modulo bias negligible for our use
//   const b = getRandomBytes(1)[0];
//   return b % max;
// }

/**
 * Generate a single code of given length using SAFE_CHARS
 */
async function makeCode(length: number): Promise<string> {
  const chars = SAFE_CHARS;
  const n = chars.length;
  let out = "";
  // consume a small random buffer for efficiency
  const bytes = await getRandomBytes(length);
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i] % n];
  }
  return out;
}

export function computeUserPointersFromIndex(
  arr: { userId: Id<"users"> }[],
  idx: number | null
) {
  if (idx === null || idx < 0 || idx >= arr.length) {
    return {
      previousUser: undefined,
      currentUser: undefined,
      nextUser: undefined,
      currentIndex: undefined,
    };
  }
  const currentUser = arr[idx].userId as Id<"users">;
  const previousUser = idx - 1 >= 0 ? arr[idx - 1].userId : undefined;
  const nextUser = idx + 1 < arr.length ? arr[idx + 1].userId : undefined;
  return { previousUser, currentUser, nextUser, currentIndex: idx };
}
export function computeRiddlePointersFromIndex(
  arr: { _id: Id<"riddles">; done: boolean }[],
  idx: number | null
) {
  if (idx === null || idx < 0 || idx >= arr.length) {
    return {
      previousRiddle: undefined,
      currentRiddle: undefined,
      nextRiddle: undefined,
      currentIndex: undefined,
    };
  }
  const currentRiddle = arr[idx]._id as Id<"riddles">;
  const previousRiddle = idx - 1 >= 0 ? arr[idx - 1]._id : undefined;
  const nextRiddle = idx + 1 < arr.length ? arr[idx + 1]._id : undefined;
  return { previousRiddle, currentRiddle, nextRiddle, currentIndex: idx };
}
