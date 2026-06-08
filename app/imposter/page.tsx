"use client";

import { useReducer, useState } from "react";
import { gameReducer, createInitialState } from "@/lib/game-reducer";
import { getPlayers, savePlayers, getWords } from "@/lib/storage";
import { PlayerSetup } from "@/components/game/player-setup";
import { CardReveal } from "@/components/game/card-reveal";
import { Discussion } from "@/components/game/discussion";
import { Reveal } from "@/components/game/reveal";

export default function ImposterPage() {
  const [setupComplete, setSetupComplete] = useState(false);
  const [players, setPlayers] = useState<string[]>(getPlayers);
  const [wordCount, setWordCount] = useState(() => getWords().length);
  const [state, dispatch] = useReducer(
    gameReducer,
    undefined,
    createInitialState,
  );

  function handlePlayersChange(updated: string[]) {
    setPlayers(updated);
    savePlayers(updated);
  }

  function handleStartGame() {
    savePlayers(players);
    const words = getWords();
    setWordCount(words.length);
    dispatch({ type: "START_GAME", players, words });
    setSetupComplete(true);
  }

  if (!setupComplete) {
    const canStart = players.length >= 3 && wordCount > 0;
    const disabledReason =
      wordCount === 0
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
  };

  const phaseKey = state.phase === "word-shown" ? "card-reveal" : state.phase;

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
  }

  return (
    <div key={phaseKey} className="animate-fade-in">
      {content}
    </div>
  );
}
