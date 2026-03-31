"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlayers, savePlayers, getWords } from "@/lib/storage";
import { PlayerSetup } from "@/components/game/player-setup";

export default function Home() {
  const router = useRouter();
  const [players, setPlayers] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPlayers(getPlayers());
    setWordCount(getWords().length);
    setMounted(true);
  }, []);

  function handlePlayersChange(updated: string[]) {
    setPlayers(updated);
    savePlayers(updated);
  }

  function handleStartGame() {
    savePlayers(players);
    router.push("/imposter");
  }

  if (!mounted) {
    return null;
  }

  return (
    <PlayerSetup
      players={players}
      onPlayersChange={handlePlayersChange}
      wordCount={wordCount}
      onStartGame={handleStartGame}
    />
  );
}
