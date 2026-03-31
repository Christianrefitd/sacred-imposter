import { DEFAULT_WORDS } from "./words";

const STORAGE_KEYS = {
  WORDS: "sacred-imposter-words",
  PLAYERS: "sacred-imposter-players",
} as const;

export function getWords(): string[] {
  if (typeof window === "undefined") return DEFAULT_WORDS;
  const stored = localStorage.getItem(STORAGE_KEYS.WORDS);
  if (!stored) return DEFAULT_WORDS;
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_WORDS;
  } catch {
    return DEFAULT_WORDS;
  }
}

export function saveWords(words: string[]): void {
  localStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(words));
}

export function resetWords(): void {
  localStorage.removeItem(STORAGE_KEYS.WORDS);
}

export function getPlayers(): string[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.PLAYERS);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePlayers(players: string[]): void {
  localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
}
