"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  gameReducer,
  createInitialState,
  GameState,
  GameAction,
} from "@/lib/game-reducer";
import { getPlayers, getWords } from "@/lib/storage";
import { CardReveal } from "@/components/game/card-reveal";
import { Discussion } from "@/components/game/discussion";
import { Reveal } from "@/components/game/reveal";
import { QuestionDraw } from "@/components/game/question-draw";

export default function ImposterPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const wordsRef = useRef<string[]>([]);
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);

  useEffect(() => {
    const players = getPlayers();
    if (!players || players.length < 3) {
      router.replace("/");
      return;
    }

    const words = getWords();
    wordsRef.current = words;

    dispatch({ type: "START_GAME", players, words });
    setMounted(true);
  }, [router]);

  if (!mounted) {
    return null;
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
