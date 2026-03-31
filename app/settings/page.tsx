"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, X, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getWords, saveWords, resetWords } from "@/lib/storage";
import { DEFAULT_WORDS } from "@/lib/words";

export default function SettingsPage() {
  const [words, setWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setWords(getWords());
    setMounted(true);
  }, []);

  function updateWords(updated: string[]) {
    setWords(updated);
    saveWords(updated);
  }

  function addWord() {
    const trimmed = newWord.trim();

    if (!trimmed) {
      setError("Enter a word");
      return;
    }

    const duplicate = words.some(
      (w) => w.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setError("That word is already in the list");
      return;
    }

    updateWords([...words, trimmed]);
    setNewWord("");
    setError(null);
    inputRef.current?.focus();
  }

  function removeWord(index: number) {
    if (words.length <= 1) return;
    updateWords(words.filter((_, i) => i !== index));
  }

  function handleReset() {
    const confirmed = window.confirm(
      "Reset the word bank to defaults? This will remove all custom words."
    );
    if (confirmed) {
      resetWords();
      setWords(DEFAULT_WORDS);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addWord();
    }
  }

  if (!mounted) {
    return null;
  }

  const isLastWord = words.length <= 1;

  return (
    <div className="flex flex-1 flex-col px-6 pb-8 pt-6">
      {/* Header */}
      <div className="relative flex items-center justify-center">
        <Link
          href="/"
          className="absolute left-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
        >
          <ArrowLeft className="h-6 w-6" />
          <span className="sr-only">Back to home</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Word Bank
        </h1>
      </div>

      <p className="mt-2 text-center text-sm text-muted-foreground">
        {words.length} {words.length === 1 ? "word" : "words"} in the bank
      </p>

      {/* Add word input */}
      <div className="mt-6">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Add a new word..."
            value={newWord}
            onChange={(e) => {
              setNewWord(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            className="h-12 flex-1 rounded-xl bg-card text-base"
            aria-invalid={!!error}
          />
          <Button
            onClick={addWord}
            size="lg"
            className="h-12 rounded-xl px-4"
          >
            <Plus className="h-5 w-5" />
            <span className="sr-only">Add word</span>
          </Button>
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* Word list */}
      <div className="mt-6 flex flex-1 flex-col overflow-hidden">
        {isLastWord && (
          <p className="mb-2 text-center text-xs text-muted-foreground">
            At least one word must remain in the bank
          </p>
        )}

        <ul className="flex-1 space-y-2 overflow-y-auto">
          {words.map((word, index) => (
            <li
              key={`${word}-${index}`}
              className="flex items-center justify-between rounded-lg bg-card px-4 py-3"
            >
              <span className="text-base font-medium text-foreground">
                {word}
              </span>
              <button
                onClick={() => removeWord(index)}
                disabled={isLastWord}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
                aria-label={`Remove ${word}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Reset to defaults */}
      <div className="mt-6 flex flex-col items-center">
        <Button
          onClick={handleReset}
          variant="outline"
          className="h-12 w-full rounded-xl gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}
