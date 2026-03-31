import { describe, it, expect, beforeEach } from "vitest";
import {
  DEFAULT_PROMPTS,
  getPrompts,
  savePrompts,
  resetPrompts,
  type Prompt,
  type PromptCategory,
} from "../prompts";

beforeEach(() => {
  localStorage.clear();
});

describe("DEFAULT_PROMPTS", () => {
  it("has prompts in all three categories", () => {
    const categories = new Set(DEFAULT_PROMPTS.map((p) => p.category));
    expect(categories).toContain("self-reflection");
    expect(categories).toContain("accountability");
    expect(categories).toContain("lighter");
  });

  it("has at least 30 prompts", () => {
    expect(DEFAULT_PROMPTS.length).toBeGreaterThanOrEqual(30);
  });
});

describe("getPrompts / savePrompts", () => {
  it("returns defaults when nothing stored", () => {
    expect(getPrompts()).toEqual(DEFAULT_PROMPTS);
  });

  it("round-trips custom prompts", () => {
    const custom: Prompt[] = [
      { text: "Test prompt?", category: "lighter" },
    ];
    savePrompts(custom);
    expect(getPrompts()).toEqual(custom);
  });

  it("resets to defaults", () => {
    savePrompts([{ text: "Custom", category: "lighter" }]);
    resetPrompts();
    expect(getPrompts()).toEqual(DEFAULT_PROMPTS);
  });
});

describe("filtering by category", () => {
  it("can filter prompts by category", () => {
    const prompts = getPrompts();
    const lighter = prompts.filter((p) => p.category === "lighter");
    expect(lighter.length).toBeGreaterThan(0);
    lighter.forEach((p) => expect(p.category).toBe("lighter"));
  });
});
