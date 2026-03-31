# Sacred Imposter — Design Spec

## Overview

A mobile-first web app for running a recovery-themed social deduction game at a men's treatment center. Single phone, passed around a group. Built for Monday afternoon group sessions.

## Tech Stack

- **Framework:** Next.js (App Router) + React
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui for standard UI elements (buttons, inputs, dialogs, sheets)
- **State:** React state + localStorage for persistence
- **Deployment:** Vercel free tier (or any static host)
- **PWA:** Manifest + service worker for home screen install and full offline support — since there's no backend, the app works entirely offline after first load. Service worker should precache all routes and assets.

## Game: Imposter

### Concept

Everyone receives the same recovery-themed word except one person — the Imposter. Players give one-word clues related to the word over two rounds. The group votes on who they think the Imposter is. Vulnerability questions create therapeutic stakes.

### Game Flow

#### Screen 1: Home
- Title: "Sacred Imposter"
- Player name list (persisted from last session)
- Input to add new players, tap X to remove
- Player names must be unique — reject duplicates with inline validation
- Minimum 3 players to start; Start Game button disabled with message if fewer than 3 or word bank is empty
- Settings button (gear icon) navigates to word bank management
- No hard max player count, but the game is designed for groups of 4-15

#### Screen 2: Card Reveal (cycles per player)
- App randomly selects one word from the word bank, avoiding words used earlier in the same session
- App randomly assigns one player as the Imposter
- For each player in sequence:
  - **2a — Pass prompt:** Shows player's name + "Hand the phone to [Name]" + "Tap to Reveal Word" button
  - **2b — Word revealed:** Normal players see the word in purple. Imposter sees "YOU ARE THE IMPOSTER" in red with no word hint. "Pass to Next Person" button advances to next player.
- A small "Cancel Game" button (top corner) allows the facilitator to abort and return to Home at any point during the reveal cycle

#### Screen 3: Discussion
- App selects a random non-imposter player to start
- Shows starter's name prominently
- Instructions: "Go around the circle. Say one word related to your word. Two rounds. Then vote."
- "Done — Reveal Imposter" button advances to results. This does NOT collect votes in the app — voting happens verbally in person.

#### Screen 4: Reveal
- Shows "Tap to Reveal the Imposter" button
- On tap: displays the Imposter's name (in red) and the word (in purple)
- Two buttons: **"Caught!"** and **"Escaped!"** — the facilitator taps whichever applies based on the group's verbal vote

#### Screen 5a: Caught Flow
- Shows "[Name] was caught!"
- A vulnerability question is drawn at random from the hardcoded list, avoiding questions already drawn this session
- "Draw Again" button allows one re-draw, then becomes disabled
- The imposter answers the displayed question
- "New Round" button returns to Screen 2 (Card Reveal) with the same player list

#### Screen 5b: Escaped Flow
- Shows "[Name] escaped!"
- Phone is handed to the Imposter
- A vulnerability question is drawn at random (same pool, same session-avoidance, one re-draw)
- After finalizing the question, a player list appears — the Imposter taps a name to choose who answers
- "New Round" button returns to Screen 2 with the same player list

### Data

#### Word Bank
- Ships with ~30-40 default recovery-themed words: sobriety, community, surrender, relapse, gratitude, sponsor, amends, honesty, courage, acceptance, fellowship, serenity, powerless, willingness, humility, accountability, forgiveness, triggers, boundaries, mindfulness, meditation, prayer, service, hope, faith, trust, healing, growth, progress, freedom, purpose, etc.
- Editable via Settings screen (add, delete)
- Stored in localStorage; defaults reload if storage is cleared
- Cannot delete the last word — at least one must remain
- Words used in a session are tracked to avoid repeats; resets when all words have been used or on app reload

#### Vulnerability Questions
- Hardcoded array in the codebase (placeholder set for now; user will provide real list later)
- Random draw per round; avoids repeats within a session; resets when exhausted or on app reload
- One re-draw max per round — "Draw Again" button is disabled after use

#### Player Names
- Stored in localStorage
- Persist between sessions so the facilitator doesn't re-type every Monday
- Editable on Home screen before each game
- Start empty if localStorage is cleared (no default names)

## Screens Summary

1. **Home** — Player list, add/remove names, Start Game, Settings button
2. **Settings** — Word bank management (add/delete words, reset to defaults button)
3. **Card Reveal** — Per-player word reveal cycle (with cancel escape hatch)
4. **Discussion** — Random starter name, instructions, advance button
5. **Reveal** — Imposter identity + word, Caught/Escaped buttons
6. **Question Draw** — Vulnerability question with re-draw, then New Round (Caught) or player pick + New Round (Escaped)

## Visual Design

- Dark theme (dark backgrounds, light text)
- Sleek, modern game-app feel
- Purple (#7c3aed) as primary accent
- Red (#dc2626) for imposter-related elements
- Large tap targets for pass-around usability
- Big, readable text — the person holding the phone shouldn't have to squint
- Minimal chrome during gameplay — the focus is on the content, not navigation

## Architecture

- All client-side, no backend
- Game state managed via React useReducer — a single reducer handles the full game state machine (phase, current player index, imposter assignment, word, question draws)
- localStorage for persistence (word bank, player names)
- Session state (used words, used questions) lives in React state only — resets on page reload
- App designed to support additional games in the future (modular routing: `/imposter`, `/settings`, future `/other-game`)

## Future Expansion

- Additional group games (not in scope for v1)
- User's real vulnerability question list (swap in when provided)
- Potential cloud sync if needed later
