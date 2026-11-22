# ADR-005: Explainable Multi-Axis Team Recommendation Engine & Anti-Synergy Architecture

## Status
Accepted

## Date
2026-11-22

## Context
Project Celestia provides automated team recommendations across 26 canonical meta-archetypes for all 128 canonical playable characters.
Prior to Milestone M5, several structural engine weaknesses and misleading metrics existed in the team generation pipeline:
1. **Conflation of Compatibility and Damage**: The previous scoring system merged mechanical compatibility, account investment, and theoretical damage potential into a single composite score, leading players to mistake high reaction compatibility for high combat DPS. Furthermore, combat engines cannot simulate frame-by-frame damage without heavy client overhead, so claiming precise DPS numbers was unscientific.
2. **Naive Alphabetical Lead Selection**: When generating teams for an archetype, `generateTeamsFromPool` picked the first candidate in `CHARACTERS` array order (alphabetical by ID). For example, Diluc was always selected over Hu Tao, Mavuika, or Arlecchino for Vaporize simply because 'D' precedes 'H' and 'M'.
3. **Phantom Synergy Tags**: Archetype templates used non-existent character tags (`Hydro-App`, `Healer`, `Shielder`, `Huge-ATK-Buff`, `EM-Buffer`, `Electro-Battery`, etc.) that were not declared in `src/data/characters.ts`. As a result, candidates frequently failed to match role and support requirements.
4. **Missing Modern Anti-Synergy Detectors**: The engine only checked for Bennett C6 infusion override and dual-carry contention. It lacked detection for:
   - Furina team-wide HP drain without burst party healing.
   - Arlecchino Bond of Life inability to receive incoming healing (relying purely on healers without shields).
   - Mavuika Fighting Spirit deficit without Natlan / Nightsoul teammates.
   - Superconduct / blunt shatter disrupting Freeze Blizzard Strayer compositions.
5. **Lack of Actionable Explainability & Wish Target Insights**: Alternatives did not explain why they scored lower than recommended teammates (`whyLowerScore`), and players with incomplete rosters were given no guidance on which unowned premier supports (`idealMissingSupports`) would elevate their teams.

## Decision

1. **Disambiguated 5-Metric Score Strip & Heuristic Output**:
   - Explicitly separated team valuation into distinct orthogonal metrics:
     - **Mechanical Compatibility Score (0-100%)**: Pure mechanical synergy evaluating reaction chain validity, elemental resonance matching, archetype role distribution, energy battery flow, and direct mechanical conflicts.
     - **Practical Performance Score (0-100%)**: Composite metric synthesizing mechanical compatibility (55%), defensive comfort (25%), and account investment (20%) while penalizing energy starvation and severe rotational anti-synergies.
     - **Account Investment Readiness Score (0-100)**: Player-specific investment based on owned character ascension levels, talent milestones, constellation power, and armory weapon matches.
     - **Defensive Comfort Score (0-100)**: Defensive security evaluating shield thickness, team-wide vs single-target healing, stagger resistance, and penalty for unmitigated HP drain.
     - **Meta Benchmark Tier & Damage Output**: Explicitly tagged as `'heuristic_only'` and `'Unsimulated'` with archetype tier (`S+`, `S`, `A`, `B`) and percentile rating, accompanied by clear disclaimers that real-time combat DPS is unsimulated.

2. **Evidence-Based Lead Candidate Ranking**:
   - Replaced naive array iteration with multi-factor ranking for lead candidates:
     1. User-specified focus character (highest priority).
     2. Archetype anchor status (premier carries defined in `S_PLUS_ANCHORS` and `template.idealSupports`).
     3. Dedicated On-Field DPS primary role over hybrid enablers.
     4. 5★ base rarity over 4★.
     5. Player account investment (Level and Constellation).
   - This ensures premier anchors (e.g. Mavuika, Neuvillette, Nefer, Alhaitham, Clorinde, Navia) lead their canonical archetypes by default.

3. **Mechanical Synergy Trait Bridge (`CHARACTER_SYNERGY_TRAITS`)**:
   - Introduced `CHARACTER_SYNERGY_TRAITS` in `src/engines/team-rules.ts` mapping mechanical capabilities across all 128 canonical characters without mutating `characters.ts`.
   - Exported `getEffectiveCharacterTags(char)` to unify base tags with mechanical traits (`Healer`, `Team-Healer`, `Shielder`, `Interruption-Resist`, `Hydro-App`, `Pyro-App`, `Electro-App`, `Cryo-App`, `Dendro-App`, `Anemo-VV`, `Cinder-City`, `EM-Buffer`, `ATK-Buffer`, `DMG-Buffer`, `Electro-Battery`, `Nightsoul`, `Moonsign`, etc.).
   - Added predicate helpers `isHealerCharacter()`, `isTeamHealerCharacter()`, and `isShielderCharacter()`.

4. **Modern Anti-Synergy Detectors**:
   - Implemented dedicated detectors in `src/engines/team-rules.ts`:
     - `detectFurinaHealerDeficit`: Flags parties with Furina that lack party-wide healing (Jean, Xianyun, Baizhu, Charlotte) or any healer.
     - `detectArlecchinoHealingConflict`: Flags parties where Arlecchino is paired with pure healers without shielding (Zhongli, Layla, Thoma) or damage reduction (Xingqiu).
     - `detectMavuikaNightsoulDeficit`: Flags parties where Mavuika lacks Natlan teammates to assist in fast Fighting Spirit generation.
     - `detectFreezeAuraDisruption`: Flags Superconduct / off-element attacks disrupting Blizzard Strayer freeze uptime.
     - `detectBennettC6Conflict` and `detectDualCarryContention`: Preserved and integrated into comfort and practical performance scoring.

5. **Actionable Explainability & Roster Targets**:
   - Enhanced `CharacterSwapAlternative` with `whyLowerScore: string` providing concrete explanations (e.g., "Lacks party-wide healing to maximize Furina's Fanfare damage buff", "Alters party Pyro elemental resonance and particle battery generation").
   - Added `IdealSupportGap` and `idealMissingSupports` in `TeamExplanation`, identifying unowned high-value supports from `template.idealSupports` (e.g., Furina, Xilonen, Kazuha, Nahida, Bennett), who they would replace, and their exact mechanical impact.
   - Rendered "Roster Targets: Premier Missing Supports" directly in the collapsible mechanics drawer in `TeamGeneratorView.tsx`.

## Consequences
- **Positive**: Complete transparency for players: mechanical compatibility is never confused with combat DPS or defensive safety.
- **Positive**: Zero phantom tag mismatches; all 128 characters correctly match role and support criteria through `CHARACTER_SYNERGY_TRAITS`.
- **Positive**: Lead candidates are chosen intelligently based on theorycrafting prominence and account investment rather than alphabetical sorting.
- **Positive**: Modern 7.x/5.x kits (Bond of Life, Nightsoul, Fanfare drain) are fully respected and anti-synergies are surfaced clearly with remediation advice.
- **Positive**: Players receive clear pull/wish guidance on which missing supports would yield the greatest team upgrades.
- **Positive**: 100% CI pass rate: 575/575 Vitest tests pass, 7-axis game data audit passes with 100% compliance, bundle budgets intact (38.52 KB raw / 11.69 KB gzip entry chunk).
