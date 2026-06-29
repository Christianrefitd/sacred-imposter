import { DEFAULT_WORDS } from "./words";

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

const KEYS = {
  PLAYERS: "rc-player-names",
  WORDS: "rc-imposter-words",
  LIE_DETECTOR_PROMPTS: "rc-lie-detector-prompts",
} as const;

const OLD_KEYS = {
  PLAYERS: "sacred-imposter-players",
  WORDS: "sacred-imposter-words",
} as const;

// Fingerprints of every DEFAULT_WORDS bank we have ever shipped. A stored bank
// that still matches one of these was never edited by the user, so it is safe
// to silently upgrade it to the current DEFAULT_WORDS. A bank the user has
// customised won't match and is left alone.
const LEGACY_DEFAULT_WORD_BANK_HASHES: ReadonlyArray<{
  length: number;
  hash: string;
}> = [
  { length: 35, hash: "f5f45178" }, // original recovery-themed bank
  { length: 81, hash: "bbec4fd7" }, // second bank (airport…wildcard)
];

// ---------------------------------------------------------------------------
// Migration (runs once per key on first read)
// ---------------------------------------------------------------------------

function migrate(oldKey: string, newKey: string): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(newKey) !== null) return; // already migrated
  const old = localStorage.getItem(oldKey);
  if (old !== null) {
    localStorage.setItem(newKey, old);
    localStorage.removeItem(oldKey);
  }
}

function hashWordBank(words: string[]): string {
  let hash = 2166136261;

  for (const char of JSON.stringify(words)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function isLegacyDefaultWordBank(words: string[]): boolean {
  const hash = hashWordBank(words);
  return LEGACY_DEFAULT_WORD_BANK_HASHES.some(
    (bank) => bank.length === words.length && bank.hash === hash,
  );
}

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

function getStringArray(key: string, defaults: string[]): string[] {
  if (typeof window === "undefined") return defaults;
  const stored = localStorage.getItem(key);
  if (!stored) return defaults;
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return defaults;

    const strings = parsed.filter(
      (item): item is string => typeof item === "string",
    );
    if (strings.length === 0) return defaults;

    if (strings.length !== parsed.length) saveArray(key, strings);
    return strings;
  } catch {
    return defaults;
  }
}

function saveArray<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function resetKey(key: string): void {
  localStorage.removeItem(key);
}

// ---------------------------------------------------------------------------
// Players (shared across all games)
// ---------------------------------------------------------------------------

export function getPlayers(): string[] {
  migrate(OLD_KEYS.PLAYERS, KEYS.PLAYERS);
  return getStringArray(KEYS.PLAYERS, []);
}

export function savePlayers(players: string[]): void {
  saveArray(KEYS.PLAYERS, players);
}

// ---------------------------------------------------------------------------
// Imposter Word Bank
// ---------------------------------------------------------------------------

export function getWords(): string[] {
  migrate(OLD_KEYS.WORDS, KEYS.WORDS);
  const words = getStringArray(KEYS.WORDS, DEFAULT_WORDS);

  if (isLegacyDefaultWordBank(words)) {
    saveWords(DEFAULT_WORDS);
    return DEFAULT_WORDS;
  }

  return words;
}

export function saveWords(words: string[]): void {
  saveArray(KEYS.WORDS, words);
}

export function resetWords(): void {
  resetKey(KEYS.WORDS);
}

// ---------------------------------------------------------------------------
// Words used this session (imposter)
//
// Tracked in sessionStorage so a word is never repeated for the whole sitting —
// across rounds AND across separate games in the same tab — not just within a
// single game's reducer state. It clears automatically when the tab/window is
// closed, which starts a fresh session next time.
// ---------------------------------------------------------------------------

const SESSION_USED_WORDS_KEY = "rc-imposter-used-words";

export function getUsedWords(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = sessionStorage.getItem(SESSION_USED_WORDS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function saveUsedWords(words: string[]): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_USED_WORDS_KEY, JSON.stringify(words));
  } catch {
    // sessionStorage may be unavailable (private mode / quota) — non-fatal.
  }
}

export function resetUsedWords(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_USED_WORDS_KEY);
}
