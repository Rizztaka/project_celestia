# Feature: Endgame Center (Phase 5)

## Overview

The **Endgame Center** is Phase 5 of Project Celestia. It focuses on tracking and analyzing the user's performance in Genshin Impact's permanent endgame modes: the Spiral Abyss and the Imaginarium Theater.

By tracking past performance, the platform can leverage the Intelligence Core (Phase 4) to recommend specific teams or character builds tailored to the current endgame rotations.

## Milestones

### Milestone 5A: Spiral Abyss Tracker

Track the user's Spiral Abyss performance per cycle.

- Data model for Abyss Cycles and user Abyss Runs (Floors 9-12, Chambers 1-3, Stars earned, Teams used).
- UI to log and view past Abyss runs.
- Basic stats: Total stars, most used characters, most used teams.

### Milestone 5B: Imaginarium Theater Tracker

Track the user's performance in the Imaginarium Theater.

- Data model for Theater Seasons and user Runs (Difficulty, Acts cleared, Principal Cast used, Vigor management).
- UI to log and view past Theater runs.

### Milestone 5C: Endgame Analytics & Synergy

Combine the Endgame Center data with the Intelligence Core.

- "Abyss Team Suggester": Recommends teams for the current Abyss rotation based on enemy lineups and the user's roster.
- "Theater Draft Assistant": Recommends characters to draft during a Theater run based on current Vigor and upcoming boss weaknesses.

---

## Technical Architecture (Milestone 5A Focus)

### Backend (`apps/api/src/games/genshin/endgame/`)

- **`endgame.service.ts`**: Handles CRUD for Abyss and Theater runs.
- **`endgame.controller.ts`**: HTTP endpoints.
- **`endgame.routes.ts`**: Mounted on `/api/v1/games/genshin/endgame`.

### Database Updates (`schema.prisma`)

- `SpiralAbyssRun` model: `accountId`, `cycleId`, `floor`, `chamber`, `half`, `stars`, `team` (JSON array of character keys).

### Frontend (`apps/web/src/pages/EndgamePage.tsx`)

- A new top-level page `/endgame` accessible from the sidebar.
- Tabs for "Spiral Abyss" and "Imaginarium Theater".
- Data visualization for past performance.
