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

  switch (state.phase) {
    case "card-reveal":
    case "word-shown":
      return <CardReveal {...props} />;
    case "discussion":
      return <Discussion {...props} />;
    case "reveal":
      return <Reveal {...props} />;
    case "caught":
      return <QuestionDraw {...props} />;
    case "escaped":
    case "pick-player":
      return <QuestionDraw {...props} />;
    default:
      return null;
  }
}
