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
  return getArray(KEYS.PLAYERS, []);
}

export function savePlayers(players: string[]): void {
  saveArray(KEYS.PLAYERS, players);
}

// ---------------------------------------------------------------------------
// Imposter Word Bank
// ---------------------------------------------------------------------------

export function getWords(): string[] {
  migrate(OLD_KEYS.WORDS, KEYS.WORDS);
  return getArray(KEYS.WORDS, DEFAULT_WORDS);
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
