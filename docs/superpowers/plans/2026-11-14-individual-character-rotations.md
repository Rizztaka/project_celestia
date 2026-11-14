# Individual Character Rotations & Strategic Team Synthesizer Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement individual character kit action profiles (e.g. Nefer: `E → 3CA → E → 3CA`, Furina: `E → Q`) and a Modular Hybrid Synthesizer that dynamically sequences them into cohesive 4-character team rotations with rich UI visualization.

**Architecture:** A Modular Hybrid architecture where each character has an atomic kit action profile (sequence, field time, stage, notes, alternate variants). The `rotation-synthesizer` engine orders team members through a 4-stage pipeline (`sustain-setup` → `sub-dps` → `buffer-shred` → `on-field-carry`) with targeted synergy pairing rules (e.g. Bennett funneling to Xiangling, Chevreuse Overload trigger, Swirl VV setups). Displayed via a new `RotationBadgeList` component in `CharacterDetailModal` and a stepped visual flow in `TeamGeneratorView`.

**Tech Stack:** React 19, TypeScript 5.7, Tailwind CSS v4, Lucide React, Vitest.

---

### Task 1: Type Contracts & Rotation Interfaces

**Files:**
- Modify: `src/types/genshin.ts`

- [ ] **Step 1: Write type definitions**
Add `RotationActionType`, `RotationAction`, `RotationStage`, `CharacterRotationProfile`, `TeamRotationStep`, and `SynthesizedTeamRotation` to `src/types/genshin.ts`. Update `Character` to include optional `rotationProfile?: CharacterRotationProfile`, and `TeamRecommendation` to include `steppedRotation?: SynthesizedTeamRotation`.
- [ ] **Step 2: Run typecheck**
Run: `npx tsc -b`
Expected: PASS with 0 errors.

---

### Task 2: Core Rotation Synthesizer Engine & Unit Tests

**Files:**
- Create: `src/engines/rotation-synthesizer.ts`
- Create: `src/engines/rotation-synthesizer.test.ts`
- Modify: `src/engines/team-generator.ts`

- [ ] **Step 1: Write the failing unit tests in `src/engines/rotation-synthesizer.test.ts`**
Cover action shorthand parsing (`E > 3CA > E > 3CA`), default fallback generation for unprofiled characters, 4-stage team ordering (Sustain → Sub-DPS → Buffer → Carry), Bennett/Xiangling funneling priority, and cycle time calculation.
- [ ] **Step 2: Run test to verify it fails**
Run: `npm run test -- src/engines/rotation-synthesizer.test.ts`
Expected: FAIL
- [ ] **Step 3: Implement `rotation-synthesizer.ts`**
Implement `parseActionShorthand`, `getDefaultRotationProfile`, and `synthesizeTeamRotation`.
- [ ] **Step 4: Connect into `team-generator.ts`**
Attach `steppedRotation: synthesizeTeamRotation(chosen)` when creating `TeamRecommendation`.
- [ ] **Step 5: Run tests to verify they pass**
Run: `npm run test`
Expected: PASS (all tests pass).

---

### Task 3: Curated Character Rotation Data

**Files:**
- Create: `src/data/character-rotations.ts`
- Modify: `src/data/characters.ts`

- [ ] **Step 1: Write rotation profiles for key meta characters**
Create profiles for Nefer (`E → 3CA → E → 3CA`), Furina (`E → Q` with alternate `Q → E`), Bennett, Kazuha, Zhongli, Nahida, Xiangling, Xingqiu, Yelan, Hu Tao, Navia, Raiden, Arlecchino, Mavuika, Xilonen.
- [ ] **Step 2: Integrate into `characters.ts`**
Map rotation profiles to character definitions in `characters.ts`.
- [ ] **Step 3: Run existing character data tests**
Run: `npm run test -- src/data/characters.test.ts`
Expected: PASS.

---

### Task 4: UI Components (Badges, Stepper & Modal Integration)

**Files:**
- Create: `src/components/RotationBadgeList.tsx`
- Modify: `src/components/CharacterDetailModal.tsx`
- Modify: `src/components/TeamGeneratorView.tsx`

- [ ] **Step 1: Create `RotationBadgeList.tsx`**
Build color-coded badges for Skill (Sky), Burst (Gold), Charged Attack (Purple/Rose), Normal Attack (Slate), Dash/Jump (Neutral).
- [ ] **Step 2: Update `CharacterDetailModal.tsx`**
Add a dedicated "Combo & Rotation" card in the modal displaying action badges, on-field time pill, strategy notes, and alternate sequence toggle.
- [ ] **Step 3: Update `TeamGeneratorView.tsx`**
Upgrade the rotation box to display a stepped visual flow with character portraits, elemental rings, stage pills, action badges, field-time indicators, and total cycle time.
- [ ] **Step 4: Verify build and tests**
Run: `npm run build && npm run test`
Expected: PASS with 0 build errors and 100% passing tests.
