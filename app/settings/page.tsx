"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getWords,
  saveWords,
  resetWords,
  getVulnerabilityQuestions,
  saveVulnerabilityQuestions,
  resetVulnerabilityQuestions,
} from "@/lib/storage";
import { DEFAULT_WORDS } from "@/lib/words";
import { DEFAULT_VULNERABILITY_QUESTIONS } from "@/lib/questions";
import {
  getPrompts,
  savePrompts,
  resetPrompts,
  DEFAULT_PROMPTS,
  type Prompt,
  type PromptCategory,
} from "@/lib/prompts";
import { ListManager } from "@/components/settings/list-manager";

const CATEGORY_COLORS: Record<PromptCategory, string> = {
  "self-reflection": "bg-purple-600",
  accountability: "bg-red-600",
  lighter: "bg-amber-500",
};

const CATEGORY_LABELS: Record<PromptCategory, string> = {
  "self-reflection": "Self-Reflection",
  accountability: "Accountability",
  lighter: "Lighter",
};

export default function SettingsPage() {
  const [words, setWords] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [newPromptCategory, setNewPromptCategory] =
    useState<PromptCategory>("self-reflection");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setWords(getWords());
    setQuestions(getVulnerabilityQuestions());
    setPrompts(getPrompts());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-1 flex-col px-6 pb-8 pt-6">
      {/* Header */}
      <div className="relative flex items-center justify-center">
        <Link
          href="/"
          className="absolute left-0 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
        >
          <ArrowLeft className="h-6 w-6" />
          <span className="sr-only">Back to home</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Settings
        </h1>
      </div>

      <div className="mt-8 flex flex-col gap-10">
        {/* Vulnerability Questions */}
        <ListManager
          title="Vulnerability Questions"
          items={questions}
          placeholder="Add a question..."
          onAdd={(item) => {
            const updated = [...questions, item];
            setQuestions(updated);
            saveVulnerabilityQuestions(updated);
          }}
          onRemove={(index) => {
            if (questions.length <= 1) return;
            const updated = questions.filter((_, i) => i !== index);
            setQuestions(updated);
            saveVulnerabilityQuestions(updated);
          }}
          onReset={() => {
            resetVulnerabilityQuestions();
            setQuestions(DEFAULT_VULNERABILITY_QUESTIONS);
          }}
        />

        {/* Imposter Word Bank */}
        <ListManager
          title="Imposter Word Bank"
          items={words}
          placeholder="Add a word..."
          onAdd={(item) => {
            const updated = [...words, item];
            setWords(updated);
            saveWords(updated);
          }}
          onRemove={(index) => {
            if (words.length <= 1) return;
            const updated = words.filter((_, i) => i !== index);
            setWords(updated);
            saveWords(updated);
          }}
          onReset={() => {
            resetWords();
            setWords(DEFAULT_WORDS);
          }}
        />

        {/* Lie Detector Prompt Bank */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              Lie Detector Prompts
            </h2>
            <span className="text-sm text-muted-foreground">
              {prompts.length} {prompts.length === 1 ? "item" : "items"}
            </span>
          </div>

          {/* Category selector + add input */}
          <PromptAdder
            prompts={prompts}
            category={newPromptCategory}
            onCategoryChange={setNewPromptCategory}
            onAdd={(text) => {
              const updated: Prompt[] = [
                ...prompts,
                { text, category: newPromptCategory },
              ];
              setPrompts(updated);
              savePrompts(updated);
            }}
          />

          {/* Prompt list */}
          {prompts.length <= 1 && (
            <p className="text-center text-xs text-muted-foreground">
              At least one prompt must remain
            </p>
          )}

          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {prompts.map((prompt, index) => (
              <li
                key={`${prompt.text}-${index}`}
                className="flex items-center justify-between rounded-lg bg-card px-4 py-3"
              >
                <div className="flex flex-1 items-center gap-2 overflow-hidden">
                  <span className="truncate text-base font-medium text-foreground">
                    {prompt.text}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-white ${CATEGORY_COLORS[prompt.category]}`}
                  >
                    {CATEGORY_LABELS[prompt.category]}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (prompts.length <= 1) return;
                    const updated = prompts.filter((_, i) => i !== index);
                    setPrompts(updated);
                    savePrompts(updated);
                  }}
                  disabled={prompts.length <= 1}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
                  aria-label={`Remove ${prompt.text}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={() => {
              const confirmed = window.confirm(
                "Reset prompts to defaults? This will remove all custom prompts."
              );
              if (confirmed) {
                resetPrompts();
                setPrompts(DEFAULT_PROMPTS);
              }
            }}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-input bg-background text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Prompt adder sub-component
// ---------------------------------------------------------------------------

function PromptAdder({
  prompts,
  category,
  onCategoryChange,
  onAdd,
}: {
  prompts: Prompt[];
  category: PromptCategory;
  onCategoryChange: (c: PromptCategory) => void;
  onAdd: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Enter a prompt");
      return;
    }
    const duplicate = prompts.some(
      (p) => p.text.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setError("Already in the list");
      return;
    }
    onAdd(trimmed);
    setText("");
    setError(null);
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-2">
      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value as PromptCategory)}
        className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground"
      >
        <option value="self-reflection">Self-Reflection</option>
        <option value="accountability">Accountability</option>
        <option value="lighter">Lighter</option>
      </select>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="Add a prompt..."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          className="h-12 flex-1 rounded-xl border border-input bg-card px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          onClick={handleAdd}
          className="flex h-12 items-center justify-center rounded-xl bg-primary px-4 text-primary-foreground hover:bg-primary/90"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          <span className="sr-only">Add prompt</span>
        </button>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

