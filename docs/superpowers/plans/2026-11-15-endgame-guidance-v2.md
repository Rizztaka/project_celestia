# Endgame Guidance 2.0 (Abyss 5.x Solver + Theater Boss Rating & Support Borrow) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Project Celestia's Endgame Guidance tab into an interactive, theorycraft-accurate combat analysis suite featuring configurable 5.x Spiral Abyss cycles, exact Elemental Gauge Unit (GU) shield-break and Resistance Shred calculations, 1-click half swapping, and Imaginarium Theater Act 3/6/8/10 boss clear ratings with friend-borrow recommendations.

**Architecture:** 
- `combat-mechanics.ts`: Pure client-side KeqingMains standard theorycraft engine computing elemental application rates (GU/s), reaction consumption ratios (Vaporize 2x, Melt 2x, Nightsoul 3x), and piecewise enemy resistance curves.
- `abyss-schedules.ts`: Curated 5.1–5.3 official Abyss Floor 12 enemy wave datasets alongside a custom sandbox preset with full localStorage persistence.
- `abyss-solver.ts`: Generalized multi-cycle solver with dynamic chamber coverage, half-swap evaluation, and shield break time estimations.
- `theater-solver.ts`: Enhanced Act 3, 6, 8, 10 boss vulnerability scoring (S/A/B/C) and friend Support Cast Borrow recommendations.
- `AbyssDualTeamView.tsx` & `ImaginariumTheaterView.tsx`: Modern, responsive UI with inline gauge bars, resistance shred matrices, and instant cycle selectors.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide icons, Vitest.

---

## Global Constraints
- **100% Client-Side:** Zero API calls, zero server latency, zero mandatory login.
- **Performance:** Gauge and solver math must compute in < 5ms even during active sandbox edits.
- **Persistence:** Selected cycle, custom sandbox enemies, and theater locks must persist in `localStorage`.
- **Backward Compatibility:** Existing `ownedIds` and `profiles` formats remain intact.

---

## Review Focus (Doubt-Driven Adversarial Checks)
1. **Piecewise RES Shred Boundaries**: Enemy RES formulas must properly switch between negative (`1 - RES/2`), normal (`0 to 75%`), and extreme (`> 75%`), avoiding divide-by-zero or non-monotonic damage multipliers.
2. **Multi-Element Shield Competition**: Gauge unit consumption for simultaneous reaction triggers (e.g. Hydro + Cryo on Pyro shield) must not double-count application without respect to internal cooldowns (ICD).
3. **Half-Swap Character Overlap Invariance**: Swapping First and Second halves must never duplicate characters or violate the 0-overlap dual team constraint.
4. **Natlan Nightsoul Barrier Advantage**: Natlan characters (`Mavuika`, `Xilonen`, `Kinich`, `Chasca`, `Citlali`, etc.) must apply a 3.0x multiplier to Nightspirit ward gauge depletion.
5. **Theater Borrow Feasibility**: Recommended support cast borrows must only suggest characters the user does NOT currently own and who meet the active season's element/guest constraints.

---

## Proposed Changes

### Component 1: Combat Mechanics Engine & Theorycraft Data

#### [NEW] `src/engines/combat-mechanics.ts`
- Implement standard KeqingMains piecewise enemy resistance function:
  ```typescript
  export function calculateEffectiveResMultiplier(baseRes: number, shred: number): number {
    const effectiveRes = (baseRes - shred) / 100;
    if (effectiveRes < 0) return 1 - effectiveRes / 2;
    if (effectiveRes <= 0.75) return 1 - effectiveRes;
    return 1 / (4 * effectiveRes + 1);
  }
  ```
- Implement elemental gauge application rate dictionary (`CHARACTER_GAUGE_RATES`).
- Implement shield break calculator (`calculateShieldBreakTime`).

#### [NEW] `src/engines/combat-mechanics.test.ts`
- Tests for:
  - Piecewise RES curve (negative, 10%, 80% RES before and after VV -40% / Zhongli -20%).
  - Pyro Lector (36 GU Pyro) broken by Hydro units (Furina + Xingqiu) vs Ineffective (pure Pyro/Dendro).
  - Natlan Nightspirit Ward (18 GU) 3x speedup with Natlan characters vs standard characters.

#### [NEW] `src/data/abyss-schedules.ts`
- Define `AbyssCycleConfig`, `AbyssEnemy`, and official datasets for:
  - `5.3 (Current)`: "Phase 1: Blazing Nightspirit"
  - `5.2`: "Phase 2: Soaring Gales"
  - `5.1`: "Phase 1: Resonant Crystals"
  - `Custom Sandbox`: Editable chamber lineup pre-filled with 5.3 defaults.

---

### Component 2: Generalized Abyss Solver & Theater Upgrades

#### [MODIFY] `src/engines/abyss-solver.ts`
- Refactor `solveAbyssDualTeams` to accept an optional `cycle: AbyssCycleConfig`.
- Refactor `evaluateChamberMechanicCoverage` to iterate through the cycle's chamber definitions rather than hardcoded 12-1/12-2/12-3.
- Compute real shield break times and RES multipliers for both First Half and Second Half teams.
- Export `swapAbyssDualHalves(plan: AbyssDualTeamPlan): AbyssDualTeamPlan`.

#### [MODIFY] `src/engines/theater-solver.ts`
- Add `evaluateBossActMatchup(team: Character[], bossName: string)`:
  - Returns clear rating: `S` (Optimal counters & burst), `A` (Solid counters), `B` (Passable), `C` (Struggles with mechanics).
- Add `recommendSupportCastBorrow(eligible: Character[], season: TheaterSeasonConfig)`:
  - Analyzes the toughest boss act and roster deficit, returning the top 3 recommended characters to borrow from friends.

#### [MODIFY] `src/services/storage.ts`
- Add storage keys & getters/setters:
  - `getSavedAbyssCycleId()`, `saveAbyssCycleId(id: string)`
  - `getSavedCustomAbyss()`, `saveCustomAbyss(cycle: AbyssCycleConfig)`

---

### Component 3: Responsive UI Overhaul

#### [MODIFY] `src/components/AbyssDualTeamView.tsx`
- Add Abyss Cycle Selector dropdown (5.3, 5.2, 5.1, Custom Sandbox) at top right.
- Add 1-Click "Swap Halves" button with instant re-calculation.
- Embed interactive Chamber Cards displaying:
  - Enemy lineup pills with level & HP.
  - Base vs Effective RES badges.
  - Elemental Shield Gauge bar with break time estimate (e.g. `⚡ 3.8s - Fast`).
  - Mechanics checklist (Bow requirement, Nightsoul buff, AoE need).
- If "Custom Sandbox" is active, display inline enemy/shield selector popover for each chamber.

#### [MODIFY] `src/components/ImaginariumTheaterView.tsx`
- Add Boss Matchup Rating badge (`S` / `A` / `B` / `C`) on Acts 3, 6, 8, 10 cards.
- Add "Recommended Support Borrow" banner card at top with 1-click "Borrow Character" button.

---

## Verification Plan

### Automated Tests
1. **Vitest Unit Tests**:
   - `pnpm test` â€” Verify all existing 153 tests pass, plus new tests in `combat-mechanics.test.ts`, `abyss-solver.test.ts`, and `theater-solver.test.ts`.
2. **TypeScript & Bundling**:
   - `pnpm build` â€” Ensure zero TypeScript errors and successful production build.

### Manual Verification
1. **Cycle Switching**: Switch between 5.3, 5.2, and 5.1 in Abyss view; verify chambers and enemy recommendations update dynamically.
2. **Half Swapping**: Click "Swap Halves"; verify Team 1 and Team 2 switch positions, chamber ratings re-evaluate immediately, and 0-overlap constraint is preserved.
3. **Shield Math Reactivity**: On a Pyro Lector chamber, add Xingqiu/Furina and check that shield break time drops into "Fast" (< 5s).
4. **Theater Support Borrow**: View Imaginarium Theater on an account missing key elements; verify that the Support Borrow card recommends a top-tier unowned character matching the season's element.
5. **Persistence**: Reload browser; verify selected Abyss cycle and Theater state persist.
