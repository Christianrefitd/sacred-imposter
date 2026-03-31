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

describe("vulnerability questions", () => {
  it("returns defaults when nothing stored", async () => {
    const { getVulnerabilityQuestions } = await import("../storage");
    const questions = getVulnerabilityQuestions();
    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0]).toContain("?"); // they're questions
  });

  it("persists custom questions", async () => {
    const { getVulnerabilityQuestions, saveVulnerabilityQuestions } =
      await import("../storage");
    saveVulnerabilityQuestions(["Custom Q1?", "Custom Q2?"]);
    expect(getVulnerabilityQuestions()).toEqual(["Custom Q1?", "Custom Q2?"]);
  });

  it("resets to defaults", async () => {
    const { getVulnerabilityQuestions, saveVulnerabilityQuestions, resetVulnerabilityQuestions } =
      await import("../storage");
    saveVulnerabilityQuestions(["Custom Q?"]);
    resetVulnerabilityQuestions();
    const questions = getVulnerabilityQuestions();
    expect(questions.length).toBeGreaterThan(1);
  });
});
