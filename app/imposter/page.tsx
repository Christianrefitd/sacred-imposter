"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import {
  gameReducer,
  createInitialState,
} from "@/lib/game-reducer";
import { getPlayers, savePlayers, getWords } from "@/lib/storage";
import { PlayerSetup } from "@/components/game/player-setup";
import { CardReveal } from "@/components/game/card-reveal";
import { Discussion } from "@/components/game/discussion";
import { Reveal } from "@/components/game/reveal";
import { QuestionDraw } from "@/components/game/question-draw";

export default function ImposterPage() {
  const [mounted, setMounted] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [players, setPlayers] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const wordsRef = useRef<string[]>([]);
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);

  useEffect(() => {
    setPlayers(getPlayers());
    const words = getWords();
    wordsRef.current = words;
    setWordCount(words.length);
    setMounted(true);
  }, []);

  function handlePlayersChange(updated: string[]) {
    setPlayers(updated);
    savePlayers(updated);
  }

  function handleStartGame() {
    savePlayers(players);
    const words = getWords();
    wordsRef.current = words;
    dispatch({ type: "START_GAME", players, words });
    setSetupComplete(true);
  }

  if (!mounted) {
    return null;
  }

  if (!setupComplete) {
    const canStart = players.length >= 3 && wordCount > 0;
    const disabledReason = wordCount === 0
      ? "No words in word bank"
      : players.length < 3
        ? `Need at least 3 players (${3 - players.length} more)`
        : null;

    return (
      <PlayerSetup
        title="SACRED IMPOSTER"
        subtitle="A game of sacred deception"
        players={players}
        onPlayersChange={handlePlayersChange}
        minPlayers={3}
        canStart={canStart}
        disabledReason={disabledReason}
        onStartGame={handleStartGame}
        settingsHref="/settings"
      />
    );
  }

  const props = {
    state,
    dispatch,
    words: wordsRef.current,
  };

  // Determine a transition key that changes when the visual phase changes.
  // card-reveal and word-shown share a component, so they use one key.
  // escaped and pick-player share QuestionDraw, so keep the same key.
  const phaseKey =
    state.phase === "word-shown"
      ? "card-reveal"
      : state.phase === "pick-player"
        ? "escaped"
        : state.phase;

  let content: React.ReactNode = null;
  switch (state.phase) {
    case "card-reveal":
    case "word-shown":
      content = <CardReveal {...props} />;
      break;
    case "discussion":
      content = <Discussion {...props} />;
      break;
    case "reveal":
      content = <Reveal {...props} />;
      break;
    case "caught":
      content = <QuestionDraw {...props} />;
      break;
    case "escaped":
    case "pick-player":
      content = <QuestionDraw {...props} />;
      break;
  }

  return (
    <div key={phaseKey} className="animate-fade-in">
      {content}
    </div>
  );
}
