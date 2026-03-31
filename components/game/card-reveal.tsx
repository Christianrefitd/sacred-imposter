"use client";

import { useRouter } from "next/navigation";
import { GameState, GameAction } from "@/lib/game-reducer";
import { Button } from "@/components/ui/button";

interface GameComponentProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  words: string[];
}

export function CardReveal({ state, dispatch }: GameComponentProps) {
  const router = useRouter();
  const currentPlayer = state.players[state.currentPlayerIndex];
  const isImposter = state.currentPlayerIndex === state.imposterIndex;
  const isLastPlayer =
    state.currentPlayerIndex === state.players.length - 1;

  function handleCancel() {
    dispatch({ type: "CANCEL_GAME" });
    router.push("/");
  }

  // -------------------------------------------------------------------------
  // Phase: card-reveal (pass prompt — tap to reveal)
  // -------------------------------------------------------------------------
  if (state.phase === "card-reveal") {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-8">
        {/* Cancel button — top-left */}
        <button
          onClick={handleCancel}
          className="absolute left-4 top-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel Game
        </button>

        {/* Player counter */}
        <p className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Player {state.currentPlayerIndex + 1} of {state.players.length}
        </p>

        {/* Player name */}
        <h1 className="mb-6 text-center text-5xl font-bold tracking-tight text-white">
          {currentPlayer}
        </h1>

        {/* Instruction */}
        <p className="mb-10 text-center text-lg text-muted-foreground">
          Hand the phone to {currentPlayer}
        </p>

        {/* Reveal button */}
        <Button
          onClick={() => dispatch({ type: "REVEAL_WORD" })}
          variant="outline"
          className="h-14 w-full max-w-xs rounded-2xl border-primary text-lg font-semibold text-primary hover:bg-primary/10"
        >
          Tap to Reveal Word
        </Button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Phase: word-shown (word visible or imposter reveal)
  // -------------------------------------------------------------------------
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-8">
      {/* Cancel button — top-left */}
      <button
        onClick={handleCancel}
        className="absolute left-4 top-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Cancel Game
      </button>

      {isImposter ? (
        <>
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-destructive/70">
            Warning
          </p>
          <h1 className="mb-4 text-center text-4xl font-extrabold tracking-tight text-destructive sm:text-5xl">
            YOU ARE THE IMPOSTER
          </h1>
          <p className="mb-10 text-center text-lg text-destructive/70">
            Listen carefully. Blend in.
          </p>
        </>
      ) : (
        <>
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Your word is:
          </p>
          <h1 className="mb-4 text-center text-5xl font-extrabold tracking-tight text-primary sm:text-6xl">
            {state.word}
          </h1>
          <p className="mb-10 text-center text-lg text-muted-foreground">
            Remember it. Don&apos;t say it out loud.
          </p>
        </>
      )}

      {/* Next / Everyone's Ready button */}
      {isLastPlayer ? (
        <Button
          onClick={() => dispatch({ type: "START_DISCUSSION" })}
          className="h-14 w-full max-w-xs rounded-2xl text-lg font-semibold"
        >
          Everyone&apos;s Ready
        </Button>
      ) : (
        <Button
          onClick={() => dispatch({ type: "NEXT_PLAYER" })}
          className="h-14 w-full max-w-xs rounded-2xl text-lg font-semibold"
        >
          Pass to Next Person
        </Button>
      )}
    </div>
  );
}
