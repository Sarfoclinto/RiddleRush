// "use node";
// const { createHash } = await import("crypto");

/* eslint-disable @typescript-eslint/no-explicit-any */
// export async function hashString(
//   input: string,
//   opts?: { algorithm?: string; output?: "hex" | "base64" }
// ): Promise<string> {
//   const algorithm = (opts?.algorithm ?? "SHA-256").toUpperCase();
//   const output = opts?.output ?? "hex";

//   // Browser: crypto.subtle available
//   const subtle =
//     typeof globalThis !== "undefined" &&
//     (globalThis as any).crypto &&
//     (globalThis as any).crypto.subtle
//       ? (globalThis as any).crypto.subtle
//       : null;

//   if (subtle && typeof subtle.digest === "function") {
//     // browser approach
//     const enc = new TextEncoder();
//     const data = enc.encode(input);
//     const digest = await subtle.digest(algorithm, data);
//     const bytes = new Uint8Array(digest);

//     if (output === "base64") {
//       let binary = "";
//       for (let i = 0; i < bytes.byteLength; i++)
//         binary += String.fromCharCode(bytes[i]);
//       return btoa(binary);
//     } else {
//       return Array.from(bytes)
//         .map((b) => b.toString(16).padStart(2, "0"))
//         .join("");
//     }
//   }

//   // Node fallback (sync chunked)
//   // Note: dynamic import to keep browser bundles small

//   const nodeAlg = algorithm.replace("SHA-", "sha"); // e.g. "SHA-256" -> "sha256"
//   const h = createHash(nodeAlg);
//   const chunkSize = 64 * 1024;
//   let i = 0;
//   while (i < input.length) {
//     let end = Math.min(i + chunkSize, input.length);
//     if (end < input.length) {
//       const code = input.charCodeAt(end - 1);
//       if (code >= 0xd800 && code <= 0xdbff) end++;
//     }
//     h.update(input.slice(i, end), "utf8");
//     i = end;
//   }
//   const out = h.digest(output);
//   return out;
// }

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
