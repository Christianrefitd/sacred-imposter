import { describe, it, expect } from "vitest";
import {
  pickWord,
  gameReducer,
  createInitialState,
  type GameState,
} from "../game-reducer";

describe("pickWord", () => {
  it("never returns a word already used this session", () => {
    const words = ["a", "b", "c", "d"];
    const used = ["a", "c"];
    for (let i = 0; i < 100; i++) {
      const { word } = pickWord(words, used);
      expect(used).not.toContain(word);
    }
  });

  it("appends the chosen word to the running used list", () => {
    const { word, updatedUsed } = pickWord(["a", "b", "c"], ["a"]);
    expect(updatedUsed).toEqual(["a", word]);
  });

  it("resets the pool to a single entry once every word is used", () => {
    const words = ["a", "b", "c"];
    const { word, updatedUsed } = pickWord(words, ["a", "b", "c"]);
    expect(words).toContain(word);
    expect(updatedUsed).toEqual([word]);
  });

  it("never repeats the most recent word immediately after a reset", () => {
    const words = ["a", "b", "c"];
    for (let i = 0; i < 100; i++) {
      // "c" was the most recently shown word.
      const { word } = pickWord(words, ["a", "b", "c"]);
      expect(word).not.toBe("c");
    }
  });
});

describe("gameReducer word selection", () => {
  const players = ["P1", "P2", "P3"];

  function start(words: string[], usedWords: string[] = []): GameState {
    return gameReducer(createInitialState(), {
      type: "START_GAME",
      players,
      words,
      usedWords,
    });
  }

  it("seeds from words used earlier in the session", () => {
    const words = ["a", "b", "c", "d"];
    for (let i = 0; i < 50; i++) {
      const state = start(words, ["a", "b", "c"]);
      expect(state.word).toBe("d");
    }
  });

  it("never repeats a word across rounds until the bank is exhausted", () => {
    const words = Array.from({ length: 12 }, (_, i) => `w${i}`);
    let state = start(words);
    const seen = [state.word];
    for (let i = 0; i < words.length - 1; i++) {
      state = gameReducer(state, { type: "NEW_ROUND" });
      seen.push(state.word);
    }
    expect(new Set(seen).size).toBe(words.length); // every word distinct
  });
});
