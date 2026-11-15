# Account-Aware Pull Advisor v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Celestia's Pull Advisor from static heuristics into a dynamic, account-aware banner and vertical investment engine. It computes marginal team DPS and archetype ROI for C0 new characters, key constellation spikes (C1-C6), and signature weapons, paired with exact 5.x gacha probability math and interactive Primogem/Pity budgeting.

**Architecture:**
- **`src/engines/gacha-math.ts`**: Pure mathematical engine computing cumulative probability curves and expected wish costs for Character Event Wishes (with 5.0+ Capturing Radiance ~55% win rate) and Weapon Event Wishes (with 5.0+ 1 Fate Point guarantee).
- **`src/data/banners.ts`**: Structured dataset of current and upcoming 5.x / 6.x Genshin banner phases.
- **`src/engines/pull-advisor.ts`**: Account ROI evaluator that cross-references owned characters (`profiles` with C0-C6) and owned `weapons` to score marginal team damage % uplift, archetype unlocks, and wish cost efficiency.
- **`src/services/storage.ts`**: Persistent storage for `PullBudgetState` in `localStorage`.
- **`src/components/PullBudgetCard.tsx`** & **`src/components/PullAdvisorView.tsx`**: Dual-mode UI (Active Banners vs Custom Wishlist) with exact probability badges, expected pulls, and interactive pity sliders.

**Tech Stack:** React 19, TypeScript 5.7, Tailwind CSS v4, Lucide React, Vitest.

---

## Global Constraints
- 100% Client-Side execution; zero server overhead or mandatory backend logins.
- Accurate 5.x gacha mechanics:
  - Character banner: 0.6% base rate, soft pity starting at 74 pulls, hard pity 90; 50/50 base with Capturing Radiance (~55% net win rate); guaranteed carryover.
  - Weapon banner (5.0+): 0.7% base rate, soft pity starting at 63 pulls, hard pity 80; 75/25 rate-up; max 1 Fate Point (at most 2 pities to guarantee the selected weapon).
- Never recommend pulling C0 for already-owned characters (rule maintained from v1).
- Never recommend pulling constellations beyond C6.
- Instant reactive updates when the user adjusts primogems, fates, or pity.

## Review Focus
1. **Pity / Pull Edge Cases:** Zero primogems/fates, pity at soft-pity edge (e.g. 73 vs 74), guaranteed flag set to true with high pity.
2. **5.0 Weapon Banner Guarantee:** Verify that having 1 Fate Point guarantees the selected weapon on the very next 5-star pull (max 1 pity cycle remaining).
3. **Constellation Boundary Conditions:** Accounts with C6 characters must skip constellation advice for that character and only evaluate signature weapon (if unowned).
4. **Signature Weapon Substitutes:** If an account already owns an equivalent R1+ 5-star weapon (e.g., Aqua Simulacra on Yelan, or Neuvillette already has Tome of the Eternal Flow), the ROI score must penalize redundancy.
5. **Storage Schema Evolution:** Gracefully handle empty or malformed `localStorage` data for `celestia_v2_pull_budget`.

---

### Task 1: 5.x Gacha Probability & Expected Cost Engine

**Files:**
- Create: `src/engines/gacha-math.ts`
- Test: `src/engines/gacha-math.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface GachaOddsResult {
    pullsAvailable: number;
    cumulativeProbability: number; // 0.0 to 1.0
    expectedPulls: number;
    medianPulls: number;
    guaranteedPulls: number;
    primogemsNeeded: number;
  }

  export function calculateCharacterBannerOdds(
    pullsAvailable: number,
    currentPity: number,
    isGuaranteed: boolean,
  ): GachaOddsResult;

  export function calculateWeaponBannerOdds(
    pullsAvailable: number,
    currentPity: number,
    fatePoints: number, // 0 or 1
  ): GachaOddsResult;

  export function generateProbabilityDistribution(
    bannerType: 'character' | 'weapon',
    currentPity: number,
    isGuaranteed: boolean,
    fatePoints?: number,
  ): Array<{ pulls: number; probability: number }>;
  ```

- [x] **Step 1: Write failing test in `src/engines/gacha-math.test.ts`**
  - Verify character soft pity threshold at 74 and hard pity at 90 (or 180 non-guaranteed).
  - Verify 5.0 weapon banner soft pity at 63 and hard pity at 80 (or 160 max with 1 Fate Point).
  - Verify cumulative probability equals 1.0 when `pullsAvailable >= guaranteedPulls`.
  - Verify zero pulls returns `0%` probability.

- [x] **Step 2: Run test to verify it fails**
  - Run: `pnpm test src/engines/gacha-math.test.ts`
  - Expected: FAIL ("Cannot find module ./gacha-math")

- [x] **Step 3: Implement `src/engines/gacha-math.ts`**
  - Implement exact Markov chain or dynamic programming distribution for single-pull probabilities:
    - Character: P(n) = 0.006 for n <= 73, P(n) = 0.006 + 0.06 * (n - 73) for 74 <= n <= 89, P(90) = 1.0. Win rate W = 0.55 (Capturing Radiance).
    - Weapon: P(n) = 0.007 for n <= 62, P(n) = 0.007 + 0.07 * (n - 62) for 63 <= n <= 79, P(80) = 1.0. Win rate W = 0.375 (75% rate up split across 2 featured weapons), with 1 Fate Point ceiling.
  - Compute exact cumulative CDF and summary statistics.

- [x] **Step 4: Run test to verify it passes**
  - Run: `pnpm test src/engines/gacha-math.test.ts`
  - Expected: PASS

- [x] **Step 5: Commit**
  - `git commit -am "feat(gacha): implement exact 5.x gacha probability engine with 5.0 weapon rules"`

---

### Task 2: Banner Schedule Data & Pull Budget Storage Service

**Files:**
- Create: `src/data/banners.ts`
- Modify: `src/services/storage.ts`
- Test: `src/services/storage.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface BannerPhase {
    id: string;
    version: string;
    phaseName: string;
    startDate: string;
    endDate: string;
    characterBanners: Array<{
      characterId: string;
      signatureWeaponKey: string;
    }>;
    weaponBanner: {
      featuredWeapons: string[];
    };
  }

  export interface PullBudgetState {
    primogems: number;
    fates: number;
    characterPity: number;
    characterGuaranteed: boolean;
    weaponPity: number;
    weaponFatePoints: number; // 0 or 1
  }

  export function getSavedPullBudget(): PullBudgetState;
  export function savePullBudget(budget: PullBudgetState): void;
  ```

- [x] **Step 1: Write failing storage tests for `PullBudgetState`**
  - Add tests in `src/services/storage.test.ts` checking defaults and serialization/deserialization.

- [x] **Step 2: Run test to verify it fails**
  - Run: `pnpm test src/services/storage.test.ts`
  - Expected: FAIL ("getSavedPullBudget is not a function")

- [x] **Step 3: Implement `src/data/banners.ts` and update `src/services/storage.ts`**
  - Populate current/upcoming Natlan & Nod-Krai banners (e.g. Mavuika, Citlali, Nefer, Xilonen, Furina, Neuvillette, Arlecchino).
  - Implement `getSavedPullBudget` and `savePullBudget` with fallback safety.

- [x] **Step 4: Run test to verify it passes**
  - Run: `pnpm test src/services/storage.test.ts`
  - Expected: PASS

- [x] **Step 5: Commit**
  - `git commit -am "feat(banners): add 5.x banner schedule dataset and pull budget persistence"`

---

### Task 3: Account-Aware Pull ROI Evaluator

**Files:**
- Modify: `src/engines/pull-advisor.ts`
- Modify: `src/types/genshin.ts`
- Test: `src/engines/pull-advisor.test.ts`

**Interfaces:**
- Consumes: `OwnedCharacterProfile`, `OwnedWeapon`, `PullBudgetState`, `gacha-math.ts`
- Produces:
  ```typescript
  export type PullTargetType = 'C0_Character' | 'Constellation' | 'Signature_Weapon';

  export interface EnhancedPullAdvice {
    id: string;
    name: string;
    targetType: PullTargetType;
    characterId: string;
    weaponKey?: string;
    targetLevelText: string; // e.g. "C0 New Unlock", "C2 Peak Spike", "R1 Signature"
    score: number; // 0 to 100 composite ROI
    tier: 'Must Pull' | 'High Value' | 'Situational' | 'Skip / Redundant';
    teamDamageUpliftPct: number;
    unlockedArchetypes: string[];
    accountBenefits: string[];
    caution?: string;
    odds: GachaOddsResult;
  }

  export function evaluateComprehensivePullROI(
    ownedProfiles: Record<string, OwnedCharacterProfile>,
    ownedWeapons: OwnedWeapon[],
    budget: PullBudgetState,
    bannerFilter?: string,
  ): EnhancedPullAdvice[];
  ```

- [x] **Step 1: Write failing test in `src/engines/pull-advisor.test.ts`**
  - Test that owned C0 Furina receives C1/C2 recommendations instead of C0.
  - Test that owned C6 character receives no constellation recommendation.
  - Test that an account lacking universal buffers ranks Xilonen C0 as 'Must Pull'.
  - Test that owning Neuvillette without signature weapon ranks Tome of the Eternal Flow high, but drops in value if already equipped with Sacrificial Jade R5.
  - Test that wish odds correctly bind to `budget`.

- [x] **Step 2: Run test to verify it fails**
  - Run: `pnpm test src/engines/pull-advisor.test.ts`
  - Expected: FAIL ("evaluateComprehensivePullROI is not defined")

- [x] **Step 3: Implement `evaluateComprehensivePullROI` in `src/engines/pull-advisor.ts`**
  - Evaluate unowned 5-stars for C0 unlock value.
  - Evaluate owned 5-stars for high-impact constellation thresholds (e.g., Furina C1/C2, Nahida C2, Neuvillette C1, Raiden C2, Xilonen C2, Arlecchino C1).
  - Evaluate signature weapons using `weapon-solver.ts` synergy differentials.
  - Combine team damage % uplift, archetype unlock count, and expected pull cost into a normalized composite score (0-100).

- [x] **Step 4: Run test to verify it passes**
  - Run: `pnpm test src/engines/pull-advisor.test.ts`
  - Expected: PASS

- [x] **Step 5: Commit**
  - `git commit -am "feat(advisor): implement comprehensive account pull ROI evaluator for C0, constellations, and weapons"`

---

### Task 4: Interactive Pull Budget Card Component

**Files:**
- Create: `src/components/PullBudgetCard.tsx`
- Test: `src/components/PullBudgetCard.test.tsx`

**Interfaces:**
- Produces:
  ```typescript
  interface PullBudgetCardProps {
    budget: PullBudgetState;
    onChangeBudget: (newBudget: PullBudgetState) => void;
  }
  ```

- [x] **Step 1: Write test in `src/components/PullBudgetCard.test.tsx`**
  - Verify total pull conversion calculation: `Math.floor(primogems / 160) + fates`.
  - Verify pity sliders clamp to valid ranges (0-89 for character, 0-79 for weapon).
  - Verify guaranteed and Fate Point toggles.

- [x] **Step 2: Run test to verify it fails**
  - Run: `pnpm test src/components/PullBudgetCard.test.tsx`
  - Expected: FAIL ("Cannot find module ./PullBudgetCard")

- [x] **Step 3: Implement `src/components/PullBudgetCard.tsx`**
  - Clean card styling matching Celestia theme (`#12141d`, gold accents, mono-font numbers).
  - Inputs for Primogems & Intertwined Fates with quick-add buttons (+10, +50, +100 pulls).
  - Interactive sliders for Character Pity and Weapon Pity.
  - Toggle pills for "50/50 Lost (Guaranteed Next)" and "1 Fate Point Accumulated".

- [x] **Step 4: Run test to verify it passes**
  - Run: `pnpm test src/components/PullBudgetCard.test.tsx`
  - Expected: PASS

- [x] **Step 5: Commit**
  - `git commit -am "feat(ui): create interactive PullBudgetCard with live wish conversion and pity controls"`

---

### Task 5: PullAdvisorView Dual-Mode UI & App Wiring

**Files:**
- Modify: `src/components/PullAdvisorView.tsx`
- Modify: `src/App.tsx`

**Features:**
- Add Banner Phase selector ("Active Banners", "Upcoming 5.3", "All-Target Sandbox").
- Embed `PullBudgetCard` at the top with collapsible drawer or card format.
- Render enhanced target cards showing:
  - Target badge: `C0 Character` (Green), `C1/C2 Constellation` (Purple), `R1 Signature Weapon` (Amber).
  - Dynamic % Team Damage Uplift tag.
  - Exact Probability Pill (e.g. `87.4% Chance` in emerald, or `34.1% Risky` in amber).
  - Expected pulls needed vs available pulls.
  - Quick action: "Simulate Pull" (temporarily tests the character/constellation in Team Generator).
  - Wire `profiles` and `weapons` from `App.tsx` into `PullAdvisorView`.

- [x] **Step 1: Update `App.tsx` to pass `profiles` and `weapons` to `PullAdvisorView`**
- [x] **Step 2: Refactor `PullAdvisorView.tsx` to support the new dual-mode view and budget controls**
- [x] **Step 3: Run full test suite and type check**
  - Run: `pnpm test`
  - Run: `pnpm build`
  - Expected: All tests PASS, build finishes with 0 errors.
- [x] **Step 4: Commit**
  - `git commit -am "feat(ui): upgrade PullAdvisorView with dual-mode banner selector, live odds, and budget tracking"`

---

## Verification Plan

### Automated Tests
1. **Vitest Unit Tests**:
   - `pnpm test` — Ensure all new tests in `gacha-math.test.ts`, `pull-advisor.test.ts`, `storage.test.ts`, and `PullBudgetCard.test.tsx` pass cleanly alongside existing tests.
2. **TypeScript & Production Build**:
   - `pnpm build` (`tsc -b && vite build`) — Zero type diagnostics or bundling errors.

### Manual Verification
1. **Pity / Budget Reactivity**: Open Pull Advisor tab, enter 14,400 Primogems (90 pulls) with 0 pity non-guaranteed; verify probability is ~55%. Toggle "Guaranteed" on; verify probability jumps to 100%.
2. **Constellation Recommendation**: On an account owning C0 Furina, verify that Furina C1/C2 appears under recommendations with expected % damage uplift, and C0 Furina does not appear.
3. **Weapon Banner 5.0 Mechanics**: Switch target to a signature weapon; set Fate Points to 1; verify that guaranteed pulls required drops to <= 80.
4. **Persistence**: Refresh browser page; verify Primogem and Pity numbers persist from `localStorage`.
