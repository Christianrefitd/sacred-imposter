"use client";

import { useState, useRef } from "react";
import { X, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ListManagerProps {
  title: string;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
  onReset: () => void;
  placeholder: string;
  emptyMessage?: string;
  renderAddExtra?: () => React.ReactNode;
  renderItemBadge?: (item: string, index: number) => React.ReactNode;
}

export function ListManager({
  title,
  items,
  onAdd,
  onRemove,
  onReset,
  placeholder,
  emptyMessage,
  renderAddExtra,
  renderItemBadge,
}: ListManagerProps) {
  const [newItem, setNewItem] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLast = items.length <= 1;

  function handleAdd() {
    const trimmed = newItem.trim();
    if (!trimmed) {
      setError("Enter a value");
      return;
    }
    const duplicate = items.some(
      (item) => item.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setError("Already in the list");
      return;
    }
    onAdd(trimmed);
    setNewItem("");
    setError(null);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  function handleReset() {
    const confirmed = window.confirm(
      `Reset ${title.toLowerCase()} to defaults? This will remove all custom entries.`
    );
    if (confirmed) onReset();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <span className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>

      {/* Add input */}
      <div>
        <div className="flex gap-2">
          {renderAddExtra?.()}
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={newItem}
            onChange={(e) => {
              setNewItem(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            className="h-12 flex-1 rounded-xl bg-card text-base"
            aria-invalid={!!error}
          />
          <Button
            onClick={handleAdd}
            size="lg"
            className="h-12 rounded-xl px-4"
          >
            <Plus className="h-5 w-5" />
            <span className="sr-only">Add</span>
          </Button>
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* Item list */}
      {isLast && (
        <p className="text-center text-xs text-muted-foreground">
          At least one item must remain
        </p>
      )}

      {items.length === 0 && emptyMessage && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      )}

      <ul className="max-h-64 space-y-2 overflow-y-auto">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex items-center justify-between rounded-lg bg-card px-4 py-3"
          >
            <div className="flex flex-1 items-center gap-2 overflow-hidden">
              <span className="truncate text-base font-medium text-foreground">
                {item}
              </span>
              {renderItemBadge?.(item, index)}
            </div>
            <button
              onClick={() => onRemove(index)}
              disabled={isLast}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
              aria-label={`Remove ${item}`}
            >
              <X className="h-5 w-5" />
            </button>
          </li>
        ))}
      </ul>

      {/* Reset */}
      <Button
        onClick={handleReset}
        variant="outline"
        className="h-10 w-full rounded-xl gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Reset to Defaults
      </Button>
    </div>
  );
}
