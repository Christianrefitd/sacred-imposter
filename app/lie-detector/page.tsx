"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import {
  lieDetectorReducer,
  createInitialState,
  type PromptMode,
} from "@/lib/lie-detector-reducer";
import { getPlayers, savePlayers, getVulnerabilityQuestions } from "@/lib/storage";
import { getPrompts } from "@/lib/prompts";
import { PlayerSetup } from "@/components/game/player-setup";
import { cn } from "@/lib/utils";

export default function LieDetectorPage() {
  const [mounted, setMounted] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [players, setPlayers] = useState<string[]>([]);
  const [promptMode, setPromptMode] = useState<PromptMode>("random");
  const promptsRef = useRef(getPrompts());
  const questionsRef = useRef<string[]>([]);
  const [state, dispatch] = useReducer(
    lieDetectorReducer,
    undefined,
    createInitialState
  );

  useEffect(() => {
    setPlayers(getPlayers());
    promptsRef.current = getPrompts();
    questionsRef.current = getVulnerabilityQuestions();
    setMounted(true);
  }, []);

  function handlePlayersChange(updated: string[]) {
    setPlayers(updated);
    savePlayers(updated);
  }

  function handleStartGame() {
    savePlayers(players);
    promptsRef.current = getPrompts();
    questionsRef.current = getVulnerabilityQuestions();
    dispatch({
      type: "START_GAME",
      players,
      prompts: promptsRef.current,
      questions: questionsRef.current,
      promptMode,
    });
    setSetupComplete(true);
  }

  if (!mounted) return null;

  if (!setupComplete) {
    const canStart = players.length >= 4;
    const disabledReason = players.length < 4
      ? `Need at least 4 players (${4 - players.length} more)`
      : null;

    return (
      <PlayerSetup
        title="LIE DETECTOR"
        subtitle="True story or total fiction?"
        players={players}
        onPlayersChange={handlePlayersChange}
        minPlayers={4}
        canStart={canStart}
        disabledReason={disabledReason}
        onStartGame={handleStartGame}
        settingsHref="/settings"
        extraControls={
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Prompt Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["random", "self-reflection", "accountability", "lighter"] as const).map(
                (mode) => (
                  <button
                    key={mode}
                    onClick={() => setPromptMode(mode)}
                    className={cn(
                      "rounded-xl px-3 py-2.5 text-sm font-medium capitalize transition-colors",
                      promptMode === mode
                        ? "bg-primary text-white"
                        : "bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {mode === "self-reflection" ? "Self-Reflection" : mode}
                  </button>
                )
              )}
            </div>
          </div>
        }
      />
    );
  }

  // Game phase routing
  const phaseKey =
    state.phase === "role-shown"
      ? "role-reveal"
      : state.phase === "vote-complete"
        ? "voting"
        : state.phase === "pick-player"
          ? "fooled"
          : state.phase;

  let content: React.ReactNode = null;
  switch (state.phase) {
    case "role-reveal":
    case "role-shown":
      content = <p className="p-8 text-center text-muted-foreground">Role Reveal — coming next</p>;
      break;
    case "storytelling":
      content = <p className="p-8 text-center text-muted-foreground">Storytelling — coming next</p>;
      break;
    case "voting":
    case "vote-complete":
      content = <p className="p-8 text-center text-muted-foreground">Voting — coming next</p>;
      break;
    case "caught":
    case "fooled":
    case "pick-player":
      content = <p className="p-8 text-center text-muted-foreground">Results — coming next</p>;
      break;
  }

  return (
    <div key={phaseKey} className="animate-fade-in">
      {content}
    </div>
  );
}
