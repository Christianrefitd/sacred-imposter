export type PromptCategory = "self-reflection" | "accountability" | "lighter";

export interface Prompt {
  text: string;
  category: PromptCategory;
}

const STORAGE_KEY = "rc-lie-detector-prompts";

export const DEFAULT_PROMPTS: Prompt[] = [
  // Self-Reflection
  { text: "A time you hit rock bottom", category: "self-reflection" },
  { text: "The moment you realized you needed help", category: "self-reflection" },
  { text: "The hardest conversation you've ever had", category: "self-reflection" },
  { text: "Something you lost that you can't get back", category: "self-reflection" },
  { text: "A time you surprised yourself", category: "self-reflection" },
  { text: "A moment that changed how you see yourself", category: "self-reflection" },
  { text: "The first time you asked for help", category: "self-reflection" },
  { text: "Something you're proud of that no one knows about", category: "self-reflection" },
  { text: "A time you felt truly free", category: "self-reflection" },
  { text: "The biggest risk you ever took", category: "self-reflection" },

  // Accountability
  { text: "The worst lie you told to keep using", category: "accountability" },
  { text: "A time you let someone down and knew it", category: "accountability" },
  { text: "The dumbest excuse you ever made", category: "accountability" },
  { text: "Something you're still avoiding dealing with", category: "accountability" },
  { text: "A promise you broke", category: "accountability" },
  { text: "A time you blamed someone else for your own choices", category: "accountability" },
  { text: "The hardest truth someone told you", category: "accountability" },
  { text: "A boundary you crossed that you regret", category: "accountability" },
  { text: "A time you knew you were wrong but doubled down", category: "accountability" },
  { text: "Something you owe someone an apology for", category: "accountability" },

  // Lighter
  { text: "The worst advice someone gave you", category: "lighter" },
  { text: "Your most embarrassing moment sober", category: "lighter" },
  { text: "The weirdest thing that happened in treatment", category: "lighter" },
  { text: "A time you got caught doing something stupid", category: "lighter" },
  { text: "Your worst job ever", category: "lighter" },
  { text: "The funniest misunderstanding you've been part of", category: "lighter" },
  { text: "A time you tried to impress someone and it backfired", category: "lighter" },
  { text: "The strangest thing you've ever eaten", category: "lighter" },
  { text: "Your worst haircut story", category: "lighter" },
  { text: "A time you laughed when you definitely shouldn't have", category: "lighter" },
];

export function getPrompts(): Prompt[] {
  if (typeof window === "undefined") return DEFAULT_PROMPTS;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return DEFAULT_PROMPTS;
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PROMPTS;
  } catch {
    return DEFAULT_PROMPTS;
  }
}

export function savePrompts(prompts: Prompt[]): void {
  if (prompts.length === 0) return; // Guard: cannot save empty prompt bank
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
}

export function resetPrompts(): void {
  localStorage.removeItem(STORAGE_KEY);
}
