/* eslint-disable no-useless-escape */
export function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeText(s: string): string {
  if (!s) return "";
  let t = stripDiacritics(String(s));
  t = t.toLowerCase().trim();
  t = t.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"“”'\\[\]]/g, "");
  t = t.replace(/^(a |an |the )/i, "");
  t = t.replace(/\s+/g, " ");
  return t;
}

export function levenshtein(a: string, b: string): number {
  const sa = a ?? "";
  const sb = b ?? "";
  const la = sa.length;
  const lb = sb.length;
  if (la === 0) return lb;
  if (lb === 0) return la;
  let prevRow = new Array<number>(lb + 1);
  for (let j = 0; j <= lb; j++) prevRow[j] = j;
  for (let i = 1; i <= la; i++) {
    const curRow = new Array<number>(lb + 1);
    curRow[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = sa[i - 1] === sb[j - 1] ? 0 : 1;
      curRow[j] = Math.min(
        prevRow[j] + 1,
        curRow[j - 1] + 1,
        prevRow[j - 1] + cost
      );
    }
    prevRow = curRow;
  }
  return prevRow[lb];
}

export function similarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const dist = levenshtein(a, b);
  const norm = Math.max(a.length, b.length);
  if (norm === 0) return 1;
  return 1 - dist / norm;
}

export interface IsAnswerOptions {
  fuzzyThreshold?: number;
  exactOnly?: boolean;
}

export function isAnswerCorrect(
  userAnswer: string,
  acceptedAnswers: string[],
  options: IsAnswerOptions = {}
): boolean {
  const { fuzzyThreshold = 0.75, exactOnly = false } = options;
  const userNorm = normalizeText(userAnswer);
  const normalizedAccepted = acceptedAnswers.map((a) => normalizeText(a));
  if (normalizedAccepted.includes(userNorm)) return true;
  if (exactOnly) return false;
  for (const a of normalizedAccepted) {
    const sim = similarity(userNorm, a);
    if (sim >= fuzzyThreshold) return true;
  }
  const numUser = Number(userNorm);
  if (!Number.isNaN(numUser)) {
    for (const a of normalizedAccepted) {
      const numA = Number(normalizeText(a));
      if (!Number.isNaN(numA) && numUser === numA) return true;
    }
  }
  return false;
}

export function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

export function makeTypo(s: string): string {
  if (!s) return s;
  if (s.length < 2) return s + "x";
  const arr = s.split("");
  const i = Math.floor(Math.random() * (arr.length - 1));
  const tmp = arr[i];
  arr[i] = arr[i + 1];
  arr[i + 1] = tmp;
  if (Math.random() > 0.6) {
    const pos = Math.floor(Math.random() * arr.length);
    arr[pos] = String.fromCharCode(97 + Math.floor(Math.random() * 26));
  }
  return arr.join("");
}

export function morphologicalVariant(s: string): string {
  if (!s) return s;
  if (s.endsWith("s")) return s.slice(0, -1);
  if (s.length < 5) return s + "s";
  if (s.endsWith("y")) return s.slice(0, -1) + "ies";
  return s + "er";
}

export async function fetchRelatedWordsDatamuse(
  word: string,
  max = 6
): Promise<string[]> {
  try {
    const resp = await fetch(
      `https://api.datamuse.com/words?ml=${encodeURIComponent(word)}&max=${max}`
    );
    if (!resp.ok) return [];
    const data: Array<{ word: string }> = await resp.json();
    return data.map((d) => d.word);
  } catch {
    return [];
  }
}

export async function generateDistractors(
  answer: string,
  count = 3
): Promise<string[]> {
  const norm = answer.trim();
  const s = new Set<string>();
  s.add(makeTypo(norm));
  s.add(morphologicalVariant(norm));
  const related = await fetchRelatedWordsDatamuse(norm, Math.max(6, count * 2));
  for (const r of related) {
    if (s.size >= count + 1) break;
    if (r.toLowerCase() === norm.toLowerCase()) continue;
    s.add(r);
  }
  while (s.size < count + 1) {
    let candidate = "";
    const vowels = "aeiou";
    for (let i = 0; i < Math.max(1, norm.length); i++) {
      candidate +=
        Math.random() > 0.6
          ? vowels[Math.floor(Math.random() * vowels.length)]
          : String.fromCharCode(97 + Math.floor(Math.random() * 26));
    }
    s.add(candidate);
  }
  s.delete(norm);
  const arr = Array.from(s).slice(0, count);
  return shuffle(arr);
}
