import { describe, it, expect, beforeEach } from "vitest";

// We'll test the storage module after refactoring.
// Mock localStorage for Node/jsdom:
beforeEach(() => {
  localStorage.clear();
});

describe("storage migration", () => {
  it("migrates old player key to new key on first read", async () => {
    localStorage.setItem(
      "sacred-imposter-players",
      JSON.stringify(["Alice", "Bob"])
    );
    const { getPlayers } = await import("../storage");
    const players = getPlayers();
    expect(players).toEqual(["Alice", "Bob"]);
    // Old key should be removed after migration
    expect(localStorage.getItem("sacred-imposter-players")).toBeNull();
    // New key should exist
    expect(localStorage.getItem("rc-player-names")).not.toBeNull();
  });

  it("migrates old words key to new key on first read", async () => {
    localStorage.setItem(
      "sacred-imposter-words",
      JSON.stringify(["sobriety", "hope"])
    );
    const { getWords } = await import("../storage");
    const words = getWords();
    expect(words).toEqual(["sobriety", "hope"]);
    expect(localStorage.getItem("sacred-imposter-words")).toBeNull();
    expect(localStorage.getItem("rc-imposter-words")).not.toBeNull();
  });
});

describe("default word bank upgrade", () => {
  // The previous (81-word) default bank. A stored copy of it that the user
  // never edited should auto-upgrade to the current DEFAULT_WORDS.
  const PREVIOUS_DEFAULT_BANK = [
    "airport", "alchemy", "ambush", "archive", "auction", "backpack",
    "backstage", "bakery", "beach", "bicycle", "blackout", "blueprint",
    "bridge", "campfire", "camera", "candle", "castle", "ceremony",
    "checkpoint", "circus", "compass", "conspiracy", "deadline", "desert",
    "detour", "diamond", "echo", "eclipse", "factory", "feather", "festival",
    "flashlight", "forest", "garden", "gravity", "guitar", "harbor", "helmet",
    "horizon", "illusion", "invention", "island", "jungle", "journey",
    "labyrinth", "lantern", "legend", "library", "magnet", "market", "mask",
    "mirror", "museum", "mystery", "oasis", "observatory", "orbit", "palace",
    "parachute", "parade", "passport", "piano", "playground", "puzzle",
    "restaurant", "rivalry", "rumor", "signal", "stadium", "storm", "telescope",
    "theater", "treasure", "truce", "umbrella", "vault", "voyage", "wallet",
    "whisper", "whistle", "wildcard",
  ];

  it("replaces an untouched previous default bank with the current default", async () => {
    localStorage.setItem(
      "rc-imposter-words",
      JSON.stringify(PREVIOUS_DEFAULT_BANK)
    );
    const { getWords } = await import("../storage");
    const { DEFAULT_WORDS } = await import("../words");
    const words = getWords();
    expect(words).toEqual(DEFAULT_WORDS);
    // Persisted in place so the upgrade survives the next read.
    expect(JSON.parse(localStorage.getItem("rc-imposter-words")!)).toEqual(
      DEFAULT_WORDS
    );
  });

  it("preserves a bank the user has customised", async () => {
    const custom = [...PREVIOUS_DEFAULT_BANK, "extraword"];
    localStorage.setItem("rc-imposter-words", JSON.stringify(custom));
    const { getWords } = await import("../storage");
    expect(getWords()).toEqual(custom);
  });

  it("returns the current default when nothing is stored", async () => {
    const { getWords } = await import("../storage");
    const { DEFAULT_WORDS } = await import("../words");
    expect(getWords()).toEqual(DEFAULT_WORDS);
  });
});

describe("session used-words (no repeats per sitting)", () => {
  it("round-trips and resets used words", async () => {
    const { getUsedWords, saveUsedWords, resetUsedWords } = await import(
      "../storage"
    );
    expect(getUsedWords()).toEqual([]);
    saveUsedWords(["mirage", "tundra"]);
    expect(getUsedWords()).toEqual(["mirage", "tundra"]);
    resetUsedWords();
    expect(getUsedWords()).toEqual([]);
  });
});

describe("getPlayers / savePlayers", () => {
  it("returns empty array when nothing stored", async () => {
    const { getPlayers } = await import("../storage");
    expect(getPlayers()).toEqual([]);
  });

  it("round-trips player names", async () => {
    const { getPlayers, savePlayers } = await import("../storage");
    savePlayers(["Marcus", "James", "Devon"]);
    expect(getPlayers()).toEqual(["Marcus", "James", "Devon"]);
  });
});
