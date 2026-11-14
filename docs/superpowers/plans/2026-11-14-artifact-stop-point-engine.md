# Artifact Stop-Point & Roll Value (RV) Diminishing Returns Engine Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Celestia's Artifact Stop-Point tool from a simple CV heuristic into a theorycraft-grade Roll Value (RV) & Resin Diminishing Returns Engine featuring character stat weights, 5-slot probability math, auto-loaded GOOD artifacts, interactive SVG probability curves, and guaranteed talent resin comparisons.

**Architecture:** A pure client-side statistical engine (`artifact-probability.ts`) calculating Roll Value (RV) and binomial upgrade probability $P = 1 - (1 - p)^N$ per slot based on official domain drop tables. Integrated with `good-parser.ts` / `storage.ts` to automatically populate equipped 5-piece artifacts, while allowing manual slot editing and rapid slider estimation in `ArtifactStopView.tsx`. Visualized via an interactive SVG curve component.

**Tech Stack:** React 19, TypeScript 5.7, Tailwind CSS v4, Lucide React, Vitest.

---

### Task 1: Type Contracts & Stat Weight Configurations

**Files:**
- Modify: `src/types/genshin.ts`
- Create: `src/data/artifact-weights.ts`

- [x] **Step 1: Update type contracts in `src/types/genshin.ts`**
  Add `ArtifactSlot`, `StatKey`, `ArtifactPiece`, `CharacterStatWeightConfig`, `SlotUpgradeProbability`, and `ArtifactStopAnalysisResult`.
- [x] **Step 2: Create `src/data/artifact-weights.ts`**
  Add baseline 5-star roll constants, drop rate constants, and curated stat weights for all Celestia characters (Nefer, Xilonen, Mavuika, Furina, Bennett, Xiangling, etc.).
- [x] **Step 3: Run typecheck**
  Run: `npx tsc -b`
  Expected: PASS with 0 errors.

---

### Task 2: Probability Engine & Statistical Formulas (TDD)

**Files:**
- Create: `src/engines/artifact-probability.test.ts`
- Create: `src/engines/artifact-probability.ts`
- Modify: `src/engines/artifact-stop.ts`

- [x] **Step 1: Write failing unit tests in `src/engines/artifact-probability.test.ts`**
  Cover:
  - Exact Roll Value calculations for 5-star pieces.
  - Character kit stat weightings (Nefer EM priority vs Hu Tao Crit vs Bennett ER/HP).
  - Domain probability $P = 1 - (1 - p)^N$ calculations for 50%, 80%, 90% confidence.
  - Monotonicity and bounds of diminishing returns curves.
  - Weakest slot identifier and guaranteed talent resin alternative logic.
- [x] **Step 2: Run test to verify it fails**
  Run: `npm run test -- src/engines/artifact-probability.test.ts`
  Expected: FAIL
- [x] **Step 3: Implement `src/engines/artifact-probability.ts`**
  Implement `calculatePieceRollValue`, `calculateSlotUpgradeProbability`, `generateDiminishingReturnsCurve`, `findWeakestSlot`, and `getGuaranteedAlternative`.
- [x] **Step 4: Update `src/engines/artifact-stop.ts`**
  Connect `calculateArtifactStopPoint` to the new probability engine with backwards-compatibility for existing tests.
- [x] **Step 5: Run tests to verify all pass**
  Run: `npm test`
  Expected: PASS (all tests pass).

---

### Task 3: Interactive UI Components (SVG Curve, Slot Cards & Editor)

**Files:**
- Create: `src/components/ArtifactDiminishingReturnsCurve.tsx`
- Create: `src/components/ArtifactSlotCard.tsx`
- Modify: `src/components/ArtifactStopView.tsx`

- [x] **Step 1: Build `ArtifactDiminishingReturnsCurve.tsx`**
  Create responsive SVG curve plotting Resin Days (0 to 60) against Upgrade Probability (0% to 100%), with 50%, 80%, 90% confidence callouts and gold/emerald styling.
- [x] **Step 2: Build `ArtifactSlotCard.tsx`**
  Render individual slot badge (Flower, Feather, Sands, Goblet, Circlet), main stat, substat list with roll values, and upgrade odds indicator. Include slot edit trigger.
- [x] **Step 3: Refactor `ArtifactStopView.tsx`**
  Integrate 3 modes: Auto-Loaded Equipped Build (from `getSavedArtifacts()`), 5-Slot Manual Editor, and Quick Stat Estimator. Add Weakest Link banner and Guaranteed Alternative comparison.
- [x] **Step 4: Verify build and test suite**
  Run: `npm run build && npm run test`
  Expected: PASS with 0 build errors and 100% test coverage.
