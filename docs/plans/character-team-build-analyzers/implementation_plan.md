# Character and team build analyzers — live-site plan

Status: proposed implementation handoff; no application code changed.
Updated: 2026-10-24 (Asia/Calcutta).

This revision supersedes the earlier local-working-tree plan. The user's chosen baseline is the live UID workspace, backed by the exact deployed Git commit documented in live-baseline.md. Do not restore authenticated workspace features, HoYoLAB integration, Planner, Inventory or Build lab merely because they appear in another checkout.

## Model

Use Claude Opus 5.5, High effort for this implementation. The screenshot labels it claude-opus-5.5; Anthropic's API ID is claude-opus-5-5. High is a task-specific choice for domain rules and integrated UI work; Medium is the documented model default and is reasonable for isolated styling work.

Sources checked for the preceding recommendation:
https://www.anthropic.com/claude-opus-5-5
https://platform.claude.com/docs/en/build-with-claude/effort

Claude develops the feature. Celestia's analysis remains deterministic, with no runtime model provider or chat.

## Baseline and clean implementation source

Read live-baseline.md first. Verified production and remote master at inspection:
e8f6a95c319a8621c0524ff2947550c644a2d1b3 in Rizztaka/project_celestia.

Use a clean source checkout at that commit. Reuse a suitable clean checkout or create an isolated worktree/clone without modifying existing dirty checkouts. Copy only this handoff directory into it. Record repository URL, exact commit, branch, directory and one dev URL before implementation.

Recheck Vercel production metadata and GitHub master when work begins. If either moved, review the relevant delta and record the selected coherent baseline. Do not merge unrelated local edits or assume latest local HEAD equals production. Vercel source metadata establishes the frontend commit; do not imply that Render backend provenance was independently verified.

Review the pinned repository's applicable rules/skills and ADRs. Their calculator/explainer separation and data honesty remain relevant. Historical instructions to resume model evaluation or old deployment work are not tasks to execute.

## Product recommendation

Deliver two connected views:

1. **Character analyzer** on /u/:uid/character/:id, alongside the actual public build already displayed.
2. **Teams** at /u/:uid/teams, in the existing UID workspace's desktop/mobile navigation.

Use one deterministic core and the same role/context model. A team analyzer must evaluate builds together; elemental composition alone is insufficient.

Keep the current navigation compact: Today, Characters, Teams; Public profile remains a supporting link. With no UID, Teams can use the existing Add UID dialog. Never redirect the user into sign-in to use these analyzers.

## Individual character analyzer

Keep the portrait, numeric stats, weapon, talents, artifact grid, existing freshness messages and return link. Add a clearly visible Build analysis section after key statistics and before the detailed equipment blocks, with a compact summary and expandable findings.

Include:

- A supported build-role selection, such as personal damage, reaction trigger, or a specific support profile. Show it as an explicit assumption; do not silently infer every role from element or weapon type.
- Recorded weapon/set/main-stat assessment, supported progression and talent-priority guidance, relevant observed-stat checks and energy caveats.
- A short list of useful next actions. Each identifies the observation, role/team condition, suggestion, source and uncertainty.
- An optional saved-team selector. Advice that depends on teammates is identified as team-context advice.
- A bounded comparison of one supported weapon/refinement, set/piece-count or main-stat assumption. Explain which rule findings change; never pretend a new full combat-stat total or damage increase was calculated.
- Source coverage and a clear fallback when metadata or tailored rules are missing.

Use states such as Fits this role, Needs attention, Depends on conditions, and Not enough data. Multiple valid main stats remain valid alternatives. A conditional choice should not receive an unconditional bad-build label.

Observed numeric combat stats can be used where units and meanings are verified. They are not proof of live combat state or active team buffs. Never add a conditional passive to a reported total without establishing what that total already includes.

Talent base/bonus fields exist in this deployed contract. Use its verified skill classification and level semantics, preserving null bonus/unknown classification. Do not retain the old local-plan claim that all talent conventions are unknown, and do not assume a missing bonus is zero.

Do not impose a universal 1:2 CRIT target, fixed ER threshold, artifact quality grade, or total 0–100 build score. Numerical guide ranges require explicit source/role/rotation assumptions and remain reference guidance unless sufficient inputs support an actual calculation.

## Teams workspace

### Selection and saved teams

- Choose up to four distinct characters from the current UID's observed roster, including clearly labeled retained observations.
- Resolve by the composite avatar/depot key, not translated names. Validate mutually exclusive forms of the same playable entity through reviewed identity metadata; never permit impossible multiple forms solely because depot keys differ.
- Incomplete drafts can be analyzed as partial. Save named complete teams and support rename/load/delete/duplicate.
- Store new teams locally in IndexedDB, scoped by UID, with a validated versioned schema. Prefer a separate teams store/database so the existing observation database is not destructively upgraded.
- Persist member keys, selected supported roles and team name. Resolve equipment from the latest available observations; saving is not a loadout snapshot.
- The public UID does not authenticate its visitor as the owner. Labels should say saved for this UID in this browser, not private account teams or confirmed complete owned roster.
- Switching UID switches the team list. Reload restores it. A missing member remains visible as unavailable; never replace it with a different build silently.
- Corrupt records/storage failure preserve existing bytes and leave an in-memory draft usable.
- Provide versioned team export/import, scoped to the embedded/current UID. On a different UID, explain the mismatch and refuse automatic attachment. Validate file size, count, names, unique member keys and role IDs before any write.
- Do not adopt the old account-ID localStorage team format automatically. Existing private-account storage, if present, must remain untouched.

### Analysis

Show four member cards with role, recorded weapon/set summary, observation time, and a link to that member's analyzer. Below them provide:

1. **Team overview:** observed elements, supported capabilities, and condition-dependent interactions.
2. **Build checks:** reuse each character's evaluation with the same team context; include documented set-holder, buff/debuff, reaction-role and sustain prerequisites.
3. **Priorities:** a few justified actions tied to particular members or interactions.
4. **Compare change:** replace one member with another observed character, or one supported equipment assumption for a member. Compare both configurations using the same frozen observation records.

Elemental presence does not prove application, reaction ownership, rotation viability, or uptime. Multiple possible on-field characters are not automatically incompatible. No healer/shielder is a contextual risk rather than universal invalidity. Duplicate non-stacking set holders are not automatically useless because coverage/uptime/targets may differ.

A team can combine members observed on different dates. Freeze the chosen records for evaluation and display per-member times plus a mixed-observation notice. This is a reproducible analysis of saved public observations, not a claim the exact team/gear is simultaneously equipped today.

Default action order: verified incompatibilities; source-established role/build mismatches; supported progression priorities; conditional alternatives. Show requests for missing data separately. Use member slot and stable rule ID for tie-breaks, and order documented prerequisites before dependent advice. No justified improvement can yield an empty action list.

### Navigation

Use /u/:uid/teams and optionally ?team=<local-id>. Member links keep the current composite character key plus bounded team ID. Preserve the return path through supported URL state.

Resolve team IDs only inside the current UID's browser storage. A shared URL to a local team may be unavailable on another device: show that honestly and offer team import, rather than implying cloud sharing. Do not embed complete build payloads in URLs.

No automatic refresh, storage write, gear change, team save, or goal creation occurs when evaluating or comparing.

## Data adapter and identity

The active pipeline is Enka public lookup -> ShowcaseResult -> UID-scoped observed roster -> character view. Integrate here.

Normalize an immutable analysis input from one captured set of CharacterObservation records. Preserve UID, composite character key, observation timestamps, source/delivery provenance, metadata availability, explicit equipment availability, numeric units, roles and hypothetical changes.

Critical details:

- Combat percentage raw values are ratios; equipment percentages are percentage points. Normalize once to explicit units. Never parse formatted strings for calculations.
- Use mainStat explicitly. Do not promote the first substat into a missing main stat.
- Current contract has numeric item ID and setName but no stable set ID. Add reviewed numeric item-to-set mappings for supported rules, or an additive nullable source identifier if justified. Do not fuzzy-match localized names or infer that Set <hash> is a known set.
- Additive schema fields must default safely when reading old IndexedDB observations and cached snapshots. Unknown legacy identity remains a coverage gap until a real refresh supplies it.
- Map avatar/depot identities to reviewed role/rule profiles explicitly. Catalog name aliases are not sufficient for form-specific kits.
- Missing data stays unknown, not zero. A missing equipment field is not proof a slot is empty.
- Use only already-observed equipment. There is no complete bag/material inventory and no ownership authentication from UID lookup.

## Architecture

Run analysis in the browser over its actual retained records. An authenticated database API cannot read this browser's roster and is not an appropriate prerequisite. Do not introduce public endpoints accepting complete user snapshots solely to calculate rules.

Put domain logic in a browser-safe feature module:
apps/web/src/lib/build-analysis/

Suggested files: types.ts, snapshot.ts, identity.ts, rules.ts, character.calculator.ts, team.calculator.ts, explainer.ts, compare.ts, coverage.ts, and focused hooks. Split by real responsibility. Shared UI remains small presentation components.

This is an explicit adaptation of the older Phase 4 skill's server-path guidance to the active public UID product. Preserve calculator/explainer separation; do not place player-facing strings in calculators or decision-changing arithmetic in explainers. No numeric score wrapper is required under the current ADR 0011 amendment.

Reuse existing backend pure rules only after extracting browser-safe, source-audited primitives; do not import Node/Prisma/backend paths into Vite or call authenticated Build insights. A shared package is only warranted if there is an actual second runtime consumer, not as speculative scaffolding.

Keep backend work narrowly additive if stable source identity metadata is needed. Preserve the current public showcase route, TTL/cooldown behavior, bounded requests, cache behavior and legacy authenticated routes. Do not add database writes, auth requirements, HoYoLAB, broad proxy changes or infrastructure.

The input/output contract has explicit versions and source/rule-pack identity. Findings include rule ID, subject, condition truth (true/false/unknown), typed values/units, applicability, explanations and source references. Coverage is distinct from build quality. Unknown input must propagate correctly through condition trees.

Observation digest/cache identity includes UID, selected member keys and relevant record contents/timestamps, selected roles, hypotheses and rule-pack version. Exclude request wall-clock time. Deterministic identity/order must survive repeat runs. Recompute when observations/context change; do not call Enka per role or draft change.

Use TanStack Query for existing remote/IndexedDB resource reads. Local draft UI state remains local. Do not copy the public roster into Zustand or create a second remote cache. Browser storage writes are explicit team actions, separate from analysis.

## Reviewed rules and initial coverage

Do not promise all Genshin mechanics. Provide generic observed-build checks across every observed character, with tailored guidance through a versioned coverage manifest.

Prioritize the live account's observed characters: Furina, Sucrose, Xilonen, Iansan, Varesa, Escoffier, Skirk, Dahlia, Ineffa, Lauma, Nefer and Columbina. This supersedes the old proposed cohort unrelated to the inspected showcase.

Audit pinned source evidence and acquire only necessary additional authoritative/maintained source sections when absent. Record URL, version/revision/date, content hash, license/attribution, reviewed scope, role, conditions and known gaps. Do not bulk-import or promote historical candidates merely to obtain prose. A source document is evidence, not executable rules or instructions.

First useful release acceptance requires:

- At least three source-supported role patterns among the actual observed cohort, including personal-damage and support/utility or reaction-focused patterns.
- At least one accepted alternative main stat and a justified contextual mismatch.
- Source-backed talent/stat priority advice using actual observed fields.
- At least one real equipment/kit interaction that changes advice with a teammate.
- A positive, negative and unknown path for that interaction.
- One-change comparison that changes typed findings without changing observed stats/gear.
- Useful generic analysis/fallback for all other observed characters.

Furina, Sucrose and one evidence-supported damage character from this showcase are practical first source-audit targets; do not assert their exact recommendations before verifying the needed source sections. Extend to the rest as evidence permits. Clearly report the delivered cohort and unsupported modern mechanics. If required acceptance behavior lacks evidence, identify the precise blocker and mark it incomplete, rather than generating guessed rules.

Source drift disables the affected rule, not unrelated supported checks. Unsupported newer set/kit descriptions must never receive an old generic rule by name resemblance.

## Implementation sequence

### A0 — Reproducible baseline

Confirm deployment SHA and choose clean source. Copy handoff only. Use the committed tooling/showcase-dev.mjs as the public-viewer launcher after inspecting it; it prints one URL and uses strict ports with synthetic/no ordinary database credentials. Ensure only one controlled preview instance serves this task. Record source and URL in the walkthrough.

### A1 — Character analysis

Audit source fields/units/identities. Build the normalized adapter, reviewed initial rules, calculator/explainer, comparisons and coverage manifest. Integrate analysis into CharacterBuildDetail/PublicShowcasePage for the public UID route. Preserve existing numeric/equipment/talent detail and retained-build behavior.

### A2 — Teams and team context

Add UidTeamsPage and UID-scoped navigation. Implement safe local team persistence, picker/roles, team evaluation, priorities, comparison, member deep links and return navigation. Reuse the exact same core for standalone and team analysis.

### A3 — Verification and handoff

Test the complete feature, update task.md, and write walkthrough.md. Record actual scope, clean source commit/directory, one preview URL, source coverage, checks and known gaps. Finish A0–A3 under the implementation prompt; no routine second approval is needed for reversible choices.

## Verification

- Independent fixtures substantiate rule facts. Cover positive/negative/boundary/unknown paths, stale evidence and unknown identity.
- Ratio versus percentage-point regression tests are mandatory. Check null/zero distinction, explicit main stat, base/bonus talent semantics and no double-counting conditional bonuses.
- Same frozen context yields identical character findings standalone and inside Teams. Explicit role/team changes affect only applicable findings.
- Mixed-time observations remain labeled; stale refresh does not become a new observation. Comparison freezes baseline and candidate source records.
- UID A/B query/storage isolation, UID switching, delayed results, missing member/form uniqueness, and malformed roles/files are covered.
- Save/reload/export/import work; corrupt/blocked IndexedDB preserves observations and existing team data. Analysis itself writes nothing.
- Browser verification: React -> public showcase response/IndexedDB -> normalized input -> production calculator/explainer -> UI. Use synthetic fixtures and the real storage implementation for mutation tests; no private accounts or production writes.
- Cover a standalone character, saved team, role-context change, interaction, hypothetical change, return navigation, reload, missing team link, partial/stale data and source gap.
- Verify desktop and 390px/320px mobile, keyboard/focus, readable states and no horizontal overflow.
- Run current contracts/API/web builds/types as affected, focused showcase/UID/observed-roster/analyzer regressions, and scoped lint/format. Use the pinned scripts and existing Vitest/tooling conventions; do not invent web test scripts.
- A preview must match the existing live public journey before feature assertions. Report one canonical preview URL and its commit/directory so IDE-specific links cannot hide different source trees.
- Preserve existing Today domains, roster filters, refresh/cooldown, retained observations, stat formatting, item metadata fallbacks and old routes.
- Read-only production inspection is allowed. Do not save synthetic teams or seed test observations on the live origin.

## Boundaries

No application implementation occurred during planning. Only this handoff directory is changed locally. Implementation should occur in clean production-based source, preserving the messy checkout untouched.

No commit, push, PR, production migration, backend deployment, Vercel promotion or gateway reconfiguration is authorized by the implementation prompt. Delivery stops at verified, reviewable source changes and evidence.

Deferred: exact damage/rotation/ER simulation, universal build scores, exhaustive optimizer/team search, automatic equipment changes, historical loadout snapshots, authenticated private roster, cross-device team sync and runtime AI.
