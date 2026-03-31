"use client";

import { useRouter } from "next/navigation";
import type { LieDetectorState, LieDetectorAction } from "@/lib/lie-detector-reducer";
import { Button } from "@/components/ui/button";

interface RoleRevealProps {
  state: LieDetectorState;
  dispatch: React.Dispatch<LieDetectorAction>;
}

export function RoleReveal({ state, dispatch }: RoleRevealProps) {
  const router = useRouter();
  const currentPlayer = state.players[state.currentPlayerIndex];
  const isLastPlayer = state.currentPlayerIndex === state.players.length - 1;

  const isTruthTeller = state.currentPlayerIndex === state.truthTellerIndex;
  const isLiar = state.liarIndices.includes(state.currentPlayerIndex);

  function handleCancel() {
    dispatch({ type: "CANCEL_GAME" });
    router.push("/");
  }

  // ---------------------------------------------------------------------------
  // Phase: role-reveal (pass prompt — tap to reveal)
  // ---------------------------------------------------------------------------
  if (state.phase === "role-reveal") {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-8">
        <button
          onClick={handleCancel}
          className="absolute left-2 top-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground min-h-[44px] min-w-[44px]"
        >
          Cancel Game
        </button>

        <p className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Player {state.currentPlayerIndex + 1} of {state.players.length}
        </p>

        <h1 className="mb-6 text-center text-5xl font-bold tracking-tight text-white">
          {currentPlayer}
        </h1>

        <p className="mb-10 text-center text-lg text-muted-foreground">
          Hand the phone to {currentPlayer}
        </p>

        <Button
          onClick={() => dispatch({ type: "REVEAL_ROLE" })}
          variant="outline"
          className="h-14 w-full max-w-xs rounded-2xl border-primary text-lg font-semibold text-primary hover:bg-primary/10"
        >
          Tap to Reveal Role
        </Button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Phase: role-shown
  // ---------------------------------------------------------------------------
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-8">
      <button
        onClick={handleCancel}
        className="absolute left-2 top-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground min-h-[44px] min-w-[44px]"
      >
        Cancel Game
      </button>

      {isTruthTeller ? (
        <>
          <h1 className="mb-4 text-center text-3xl font-extrabold tracking-tight text-[#16a34a] sm:text-4xl">
            YOU ARE THE TRUTH TELLER
          </h1>
          <div className="mb-4 rounded-xl border border-white/10 bg-[#1a1a1a] px-6 py-4">
            <p className="text-center text-xl font-medium text-white">
              {state.prompt.text}
            </p>
          </div>
          <p className="mb-10 text-center text-lg text-[#16a34a]/70">
            Tell a TRUE story from your life.
          </p>
        </>
      ) : isLiar ? (
        <>
          <h1 className="mb-4 text-center text-3xl font-extrabold tracking-tight text-[#dc2626] sm:text-4xl">
            YOU ARE A LIAR
          </h1>
          <div className="mb-4 rounded-xl border border-white/10 bg-[#1a1a1a] px-6 py-4">
            <p className="text-center text-xl font-medium text-white">
              {state.prompt.text}
            </p>
          </div>
          <p className="mb-10 text-center text-lg text-[#dc2626]/70">
            Make up a convincing fake story.
          </p>
        </>
      ) : (
        <>
          <h1 className="mb-4 text-center text-3xl font-extrabold tracking-tight text-[#7c3aed] sm:text-4xl">
            YOU ARE A DETECTOR
          </h1>
          <p className="mb-10 text-center text-lg text-[#7c3aed]/70">
            Listen carefully. You&apos;ll vote on who&apos;s telling the truth.
          </p>
        </>
      )}

      {isLastPlayer ? (
        <Button
          onClick={() => dispatch({ type: "START_STORYTELLING" })}
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
