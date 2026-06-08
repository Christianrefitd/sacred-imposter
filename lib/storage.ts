import { DEFAULT_WORDS } from "./words";
import { DEFAULT_VULNERABILITY_QUESTIONS } from "./questions";

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

const KEYS = {
  PLAYERS: "rc-player-names",
  WORDS: "rc-imposter-words",
  VULNERABILITY_QUESTIONS: "rc-vulnerability-questions",
  LIE_DETECTOR_PROMPTS: "rc-lie-detector-prompts",
} as const;

const OLD_KEYS = {
  PLAYERS: "sacred-imposter-players",
  WORDS: "sacred-imposter-words",
} as const;

const LEGACY_DEFAULT_WORD_BANK_HASH = "f5f45178";

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
  return (
    words.length === 35 &&
    hashWordBank(words) === LEGACY_DEFAULT_WORD_BANK_HASH
  );
}

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

function getArray<T>(key: string, defaults: T[]): T[] {
  if (typeof window === "undefined") return defaults;
  const stored = localStorage.getItem(key);
  if (!stored) return defaults;
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaults;
  } catch {
    return defaults;
  }
}

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
// Vulnerability Questions (shared across all games)
// ---------------------------------------------------------------------------

export function getVulnerabilityQuestions(): string[] {
  return getArray(KEYS.VULNERABILITY_QUESTIONS, DEFAULT_VULNERABILITY_QUESTIONS);
}

export function saveVulnerabilityQuestions(questions: string[]): void {
  saveArray(KEYS.VULNERABILITY_QUESTIONS, questions);
}

export function resetVulnerabilityQuestions(): void {
  resetKey(KEYS.VULNERABILITY_QUESTIONS);
}
