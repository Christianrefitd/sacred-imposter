"use client";

import { useState, useRef } from "react";
import { Settings, X, UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PlayerSetupProps {
  title: string;
  subtitle: string;
  players: string[];
  onPlayersChange: (players: string[]) => void;
  minPlayers: number;
  canStart: boolean;
  disabledReason: string | null;
  onStartGame: () => void;
  settingsHref?: string;
  extraControls?: React.ReactNode;
}

export function PlayerSetup({
  title,
  subtitle,
  players,
  onPlayersChange,
  minPlayers,
  canStart,
  disabledReason,
  onStartGame,
  settingsHref,
  extraControls,
}: PlayerSetupProps) {
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function addPlayer() {
    const trimmed = newName.trim();

    if (!trimmed) {
      setError("Enter a name");
      return;
    }

    const duplicate = players.some(
      (p) => p.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setError("That name is already in the list");
      return;
    }

    onPlayersChange([...players, trimmed]);
    setNewName("");
    setError(null);
    inputRef.current?.focus();
  }

  function removePlayer(index: number) {
    onPlayersChange(players.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addPlayer();
    }
  }

  return (
    <div className="flex flex-1 flex-col px-6 pb-8 pt-6">
      {/* Header */}
      <div className="relative flex items-center justify-center">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        {settingsHref && (
          <Link
            href={settingsHref}
            className="absolute right-0 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            <Settings className="h-6 w-6" />
            <span className="sr-only">Settings</span>
          </Link>
        )}
      </div>

      <p className="mt-2 text-center text-muted-foreground">
        {subtitle}
      </p>

      {/* Player list */}
      <div className="mt-8 flex flex-1 flex-col">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Players ({players.length})
        </h2>

        <div className="flex-1 overflow-y-auto">
          {players.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Add at least {minPlayers} players to start
            </p>
          )}

          <ul className="space-y-2">
            {players.map((player, index) => (
              <li
                key={`${player}-${index}`}
                className="flex items-center justify-between rounded-lg bg-card px-4 py-3"
              >
                <span className="text-base font-medium text-foreground">
                  {player}
                </span>
                <button
                  onClick={() => removePlayer(index)}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                  aria-label={`Remove ${player}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Add player input */}
        <div className="mt-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Enter player name..."
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={handleKeyDown}
              className="h-12 flex-1 rounded-xl bg-card text-base"
              aria-invalid={!!error}
            />
            <Button
              onClick={addPlayer}
              size="lg"
              className="h-12 rounded-xl px-4"
            >
              <UserPlus className="h-5 w-5" />
              <span className="sr-only">Add player</span>
            </Button>
          </div>
          {error && (
            <p className="mt-1.5 text-sm text-destructive">{error}</p>
          )}
        </div>
      </div>

      {/* Extra controls slot (e.g. prompt mode selector) */}
      {extraControls && <div className="mt-4">{extraControls}</div>}

      {/* Start Game */}
      <div className="mt-6 flex flex-col items-center gap-2">
        {disabledReason && (
          <p className="text-sm text-muted-foreground">{disabledReason}</p>
        )}
        <Button
          onClick={onStartGame}
          disabled={!canStart}
          className="h-14 w-full rounded-2xl text-lg font-semibold"
        >
          Start Game
        </Button>
      </div>
    </div>
  );
}
