# Lie Detector — Design Spec

## Overview

A storytelling + bluffing game for Recovery Circle (formerly Sacred Imposter). One player tells a true story from their life in response to a prompt. One or two others make up fake stories for the same prompt. The group votes on who's telling the truth. Vulnerability questions create therapeutic stakes.

Single phone, passed around a group. Built for the same Monday afternoon group sessions at Sacred Journey Recovery.

## Context

This is the second game added to the Recovery Circle app. The app is being refactored from a single-game app ("Sacred Imposter") into a multi-game hub. This spec covers the Lie Detector game only — the hub refactor is a separate concern.

## Hub Prerequisites

The following hub-level changes must land before or alongside Lie Detector. They affect shared infrastructure that Lie Detector depends on.

### Shared Storage Keys

The hub refactor migrates from Imposter-specific localStorage keys to shared hub keys:

| Old Key (Imposter-only) | New Key (Hub-wide) | Notes |
|---|---|---|
| `sacred-imposter-players` | `rc-player-names` | Single shared player roster |
| *(hardcoded in code)* | `rc-vulnerability-questions` | Promoted from hardcoded array to localStorage-backed, user-editable pool |
| `sacred-imposter-words` | `rc-imposter-words` | Renamed for namespace consistency; still Imposter-specific |
| *(new)* | `rc-lie-detector-prompts` | Lie Detector prompt bank |

On first load after the hub refactor, if old keys exist and new keys do not, migrate the data automatically. If localStorage is cleared, all pools reload from hardcoded defaults.

The shared storage module lives at `lib/storage.ts` (refactored from the existing file). Each data pool has its own getter/setter functions.

### Vulnerability Questions — Settings UI

The existing Imposter code hardcodes vulnerability questions as a const array with no Settings UI. The hub refactor must:
- Promote vulnerability questions to localStorage (`rc-vulnerability-questions`)
- Add a "Vulnerability Questions" section to the hub Settings screen (add, edit, delete; same pattern as the word bank UI)
- Hardcoded defaults seed localStorage on first load

### Hub Settings Screen

The hub Settings screen (`/settings`) becomes the single place to manage all shared and game-specific data:
- **Vulnerability Questions** — shared across all games (add, edit, delete)
- **Imposter Word Bank** — Imposter-specific (existing UI, relocated)
- **Lie Detector Prompt Bank** — Lie Detector-specific (add, edit, delete; category assignment via dropdown: Self-Reflection / Accountability / Lighter)

## Tech Stack

Same as the existing app:

- **Framework:** Next.js (App Router) + React
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **State:** React useReducer + localStorage for persistence
- **Routing:** `/lie-detector` (own route within the hub)

## Game: Lie Detector

### Concept

Each round, a recovery-themed prompt is drawn (e.g., *"A time you hit rock bottom"*). One player is the Truth Teller — they tell a real story. One or two players are Liars — they make up a convincing fake. The rest are Detectors — they listen, ask follow-up questions, and vote on who was telling the truth. The bluffing creates safety for real vulnerability: the Truth Teller is sharing something genuine, but it's disguised as a game move.

### Therapeutic Goals

- **Self-reflection** — The Truth Teller shares a real story; the prompts push genuine introspection
- **Accountability** — Prompts surface real situations, patterns, and honest self-assessment
- **Empathy** — Detectors listen deeply and ask real follow-up questions to distinguish truth from fiction

### Game Flow

#### Screen 1: Setup
- Player name input with add/remove (same pattern as Imposter)
- Player names are shared across all games in the hub (single roster in localStorage) — the facilitator manages one list, not one per game
- Minimum 4 players to start (1 Truth Teller + 1 Liar + 2 Detectors). 5+ recommended — with only 4, two Detectors voting on two storytellers offers very little signal
- No hard max, designed for groups of 4-15
- **Prompt mode selector:** "Random" (default) or "Pick Category" (Self-Reflection, Accountability, Lighter). This choice is made before the round begins so it controls which prompt is drawn during Role Reveal
- "Start Game" button

#### Screen 2: Role Reveal (cycles per player)
- App randomly selects one prompt from the prompt bank, avoiding prompts used earlier in the session
- App randomly assigns roles:
  - **4-6 players:** 1 Truth Teller, 1 Liar, rest are Detectors
  - **7+ players:** 1 Truth Teller, 2 Liars, rest are Detectors
- For each player in sequence:
  - **2a — Pass prompt:** Shows player's name + "Hand the phone to [Name]" + "Tap to Reveal Role" button
  - **2b — Role revealed:**
    - Truth Teller sees: "YOU ARE THE TRUTH TELLER" (in green) + the prompt. Instruction: "Tell a TRUE story from your life."
    - Liar sees: "YOU ARE A LIAR" (in red) + the prompt. Instruction: "Make up a convincing fake story."
    - Detector sees: "YOU ARE A DETECTOR" (in purple). Instruction: "Listen carefully. You'll vote on who's telling the truth." Detectors do NOT see the prompt yet.
  - "Pass to Next Person" button advances to next player
- A small "Cancel Game" button (top corner) allows the facilitator to abort and return to Setup

#### Screen 3: Storytelling
- Shows the prompt prominently at the top for all to see
- Lists the storytellers (Truth Teller + Liars) by name in randomized order — the group does NOT know which is which
- Facilitator calls on each storyteller in the listed order
- Stories and follow-up questions happen verbally — the phone is just a reference screen
- "Time to Vote" button advances when stories and questions are done

**Why Detectors don't see the prompt during Role Reveal:** They hear the prompt for the first time when stories begin, so they evaluate stories fresh without pre-judging what a "truthful" answer should sound like.

#### Screen 4: Voting (cycles per Detector)
- Phone passes to each Detector one at a time
- For each Detector in sequence:
  - **4a — Pass prompt:** Shows "Hand the phone to [Name]" + "Tap to Vote" button (prevents the current Detector from seeing the previous Detector's vote)
  - **4b — Vote screen:** Shows the storyteller names — Detector taps who they think was the Truth Teller. After tapping, advances to the next Detector's pass prompt.
- After all Detectors have voted, "Reveal Truth" button appears
- **Tie-breaking:** If votes are split evenly (possible with an even number of Detectors), the result is "Fooled" — the Truth Teller wins the tie. Rationale: in a game about deception, the benefit of the doubt goes to the one who hid the truth successfully.

#### Screen 5: Results
- Tapping "Reveal Truth" shows: the Truth Teller's name (highlighted) + the prompt
- Shows the vote breakdown (how many Detectors picked each storyteller)
- Two outcomes based on whether the majority voted correctly:

**If Caught (majority correctly identified the Truth Teller):**
- Shows "The group caught the truth!"
- The Truth Teller draws a vulnerability question (random, avoids session repeats)
- "Draw Again" button allows one re-draw, then disables. The current question remains visible and is replaced in-place when re-drawn.
- Truth Teller answers the question
- "New Round" button

**If Fooled (majority voted for a Liar, or tie):**
- Shows "The truth was hiding in plain sight!"
- Screen shows "Hand the phone to [Truth Teller's name]"
- Truth Teller taps to see a vulnerability question drawn randomly + a list of all other players
- "Draw Again" button allows one re-draw, then disables. The current question remains visible and is replaced in-place when re-drawn.
- Truth Teller taps a player name to choose who answers the question
- After tapping, the screen shows "[Chosen player's name] answers:" with the vulnerability question displayed. The facilitator reads it aloud or passes the phone.
- "New Round" button

### Data

#### Prompt Bank
- Ships with ~30 default prompts across three tagged categories:

**Self-Reflection:**
- A time you hit rock bottom
- The moment you realized you needed help
- The hardest conversation you've ever had
- Something you lost that you can't get back
- A time you surprised yourself
- A moment that changed how you see yourself
- The first time you asked for help
- Something you're proud of that no one knows about
- A time you felt truly free
- The biggest risk you ever took

**Accountability:**
- The worst lie you told to keep using
- A time you let someone down and knew it
- The dumbest excuse you ever made
- Something you're still avoiding dealing with
- A promise you broke
- A time you blamed someone else for your own choices
- The hardest truth someone told you
- A boundary you crossed that you regret
- A time you knew you were wrong but doubled down
- Something you owe someone an apology for

**Lighter:**
- The worst advice someone gave you
- Your most embarrassing moment sober
- The weirdest thing that happened in treatment
- A time you got caught doing something stupid
- Your worst job ever
- The funniest misunderstanding you've been part of
- A time you tried to impress someone and it backfired
- The strangest thing you've ever eaten
- Your worst haircut story
- A time you laughed when you definitely shouldn't have

- Editable via Settings (add, edit, delete prompts; assign category per prompt)
- User-added prompts must be assigned a category (Self-Reflection, Accountability, or Lighter) so they appear correctly when "Pick Category" mode is used
- Stored in localStorage; defaults reload if storage is cleared
- Cannot delete the last prompt
- Used prompts tracked per session to avoid repeats. Reset is scoped to the active selection: if using "Pick Category" and the chosen category's prompts are exhausted, only that category's used-prompt tracking resets (not all prompts). If using "Random," all prompts reset when the full pool is exhausted. Also resets on app reload.

#### Vulnerability Questions
- Single shared pool across all games in the hub, stored in one localStorage key (`rc-vulnerability-questions`)
- Hardcoded defaults in the codebase (placeholder set; user will provide real list later)
- The hub's Settings screen manages this pool — one section, used by all games
- Random draw per round; session repeat avoidance is per-game (each game tracks its own used-questions list in React state). If a player plays Imposter then Lie Detector in the same session, a question could repeat across games but not within one.
- One re-draw max per round

#### Player Names
- Single shared roster across all games in the hub, stored in one localStorage key (`rc-player-names`)
- The facilitator manages one player list — no need to re-enter names when switching games
- Persist between sessions
- Editable on each game's Setup screen (edits apply globally)

## Screens Summary

1. **Setup** — Player list, add/remove names, Start Game
2. **Role Reveal** — Per-player role assignment cycle (with cancel escape hatch)
3. **Storytelling** — Prompt displayed, storyteller names listed, "Time to Vote" button
4. **Voting** — Per-Detector pass-around, tap to pick the Truth Teller
5. **Results** — Truth Teller revealed, vote breakdown, Caught/Fooled flow, vulnerability question draw, New Round

## Visual Design

Inherits the hub's shared design language:

- Dark theme (dark backgrounds, light text)
- Sleek, modern game-app feel
- Large tap targets for pass-around usability
- Big, readable text
- Minimal chrome during gameplay

Game-specific colors:
- **Green (#16a34a)** for Truth Teller elements
- **Red (#dc2626)** for Liar elements
- **Purple (#7c3aed)** for Detector elements and general accent

## Architecture

- Same client-side-only architecture as the hub
- Game state managed via its own React useReducer — handles phase transitions, role assignments, prompt selection, vote collection, question draws
- localStorage for persistence (prompt bank, player names)
- Session state (used prompts, used questions, votes) lives in React state only — resets on page reload
- Prompt bank management integrated into the hub's Settings screen (separate section from word bank)
