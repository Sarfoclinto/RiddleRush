/* eslint-disable @typescript-eslint/no-explicit-any */
// universalHash.ts
export async function hashString(
  input: string,
  opts?: { algorithm?: string; output?: "hex" | "base64" }
): Promise<string> {
  const algorithm = (opts?.algorithm ?? "SHA-256").toUpperCase();
  const output = opts?.output ?? "hex";

  // Browser: crypto.subtle available
  const subtle =
    typeof globalThis !== "undefined" &&
    (globalThis as any).crypto &&
    (globalThis as any).crypto.subtle
      ? (globalThis as any).crypto.subtle
      : null;

  if (subtle && typeof subtle.digest === "function") {
    // browser approach
    const enc = new TextEncoder();
    const data = enc.encode(input);
    const digest = await subtle.digest(algorithm, data);
    const bytes = new Uint8Array(digest);

    if (output === "base64") {
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++)
        binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    } else {
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  }

  // Node fallback (sync chunked)
  // Note: dynamic import to keep browser bundles small
  const { createHash } = await import("crypto");
  const nodeAlg = algorithm.replace("SHA-", "sha"); // e.g. "SHA-256" -> "sha256"
  const h = createHash(nodeAlg);
  const chunkSize = 64 * 1024;
  let i = 0;
  while (i < input.length) {
    let end = Math.min(i + chunkSize, input.length);
    if (end < input.length) {
      const code = input.charCodeAt(end - 1);
      if (code >= 0xd800 && code <= 0xdbff) end++;
    }
    h.update(input.slice(i, end), "utf8");
    i = end;
  }
  const out = h.digest(output);
  return out;
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
