# Claude implementation prompt — production-based revision

Choose Claude Opus 5.5 / High. The model menu's claude-opus-5.5 label corresponds to the intended model; Anthropic's API ID is claude-opus-5-5.

Paste the prompt below. It is self-contained if this handoff directory is not yet available in the clean checkout.

---

Implement an individual character build analyzer and a team build analyzer for the LIVE public UID version of Project Celestia.

## Establish the correct source first

The product reference is:
https://projectcelestia.vercel.app/u/860507835

Repository:
https://github.com/Rizztaka/project_celestia

Verified production frontend and remote master commit on 2026-10-24:
e8f6a95c319a8621c0524ff2947550c644a2d1b3
Commit message: Add daily talent and weapon domains to Today
Vercel deployment: dpl_BzNfYVw1eU5b5MuKghcSzPmhomQ7

The existing local directory is messy and was on a different branch. Do NOT use its uncommitted implementation, local server behavior or old feature assumptions as your baseline. Recheck production deployment metadata and master, review any relevant delta, and use a clean checkout of the verified production source. Reuse a suitable clean checkout or create an isolated worktree/clone; do not reset, stash, clean or merge the messy directory.

If available, read these files completely and copy ONLY this planning directory into the clean checkout:

- docs/plans/character-team-build-analyzers/live-baseline.md
- docs/plans/character-team-build-analyzers/implementation_plan.md
- docs/plans/character-team-build-analyzers/task.md

If those files are absent, this prompt supplies the requirements; create the checklist/walkthrough under that directory as you implement. Read the pinned source's applicable rules/skills/ADRs. Apply deterministic calculator/explainer separation. Older model schedules, authenticated-workspace assumptions and model-evaluation instructions do not supersede this public-site task.

I authorize local implementation and appropriate verification of this complete v1. Implement after a brief scope update; do not return only another plan. Continue through baseline, character analysis, Teams, and acceptance. Resolve routine reversible choices without repeated permission requests. Report a genuine evidence/architecture blocker precisely and preserve completed work.

## What the live product actually is

- Public Enka UID lookup; no sign-in required.
- Active routes: /u/:uid, /u/:uid/roster, /u/:uid/showcase and /u/:uid/character/:id.
- UID navigation is in apps/web/src/components/UidWorkspace.tsx.
- Character presentation uses PublicShowcasePage.tsx and CharacterBuildDetail.tsx.
- Public source contract: packages/api-contracts/src/genshin/showcase.ts.
- Character keys are avatarId:skillDepotId, not the old name-based characterKey.
- useShowcase/useObservedRoster combine current public builds with previous observations in browser IndexedDB, scoped by UID.
- Observed roster database is celestia-public-roster-v1; do not destructively change it.
- Current characters may include Furina, Sucrose, Xilonen, Iansan, Varesa, Escoffier, Skirk, Dahlia, Ineffa, Lauma, Nefer and Columbina. Recheck rather than hardcoding the roster.
- Numeric combat stats, explicit artifact main stats/substats, equipment IDs and base/bonus talent levels already exist in this product.
- Full private roster, bag inventory, materials, live combat state, rotations and UID ownership authentication do not exist.
- Legacy authenticated components/APIs remain in the tree but are not the active public flow. Do not restore HoYoLAB, login, Planner, Inventory or Build lab as requirements.
- The existing frontend API rewrite targets the Render API. Vercel metadata pins the frontend; do not claim the backend's deployed SHA was independently proven.

## Required character analyzer

Add Build analysis to the existing public character detail, after key statistics and before detailed gear. Preserve its portrait, numeric stats, weapon, talents, artifacts, metadata fallbacks and observation-age messages.

Provide explicit supported role selection, recorded weapon/set/main-stat checks, reviewed stat/talent priorities, energy caveats, useful next actions, optional saved-team context, source coverage and missing-data states.

Each finding explains what was observed, which role/team condition matters, what change to consider and which source supports it. Allow multiple acceptable main stats. Unsupported data is not a bad-build verdict.

Provide one-change hypothetical comparison for supported weapon/refinement, set/pieces or main-stat assumptions. Compare structured findings while retaining observed gear and totals. Do not invent hypothetical full stats, exact DPS gains or ER requirements.

## Required Teams workspace

Add /u/:uid/teams under the existing public UID workspace. Add Teams to desktop/mobile navigation: Today, Characters, Teams, with Public profile retained. Before a UID is connected, use the existing Add UID dialog.

Choose up to four distinct observed characters, with explicit role selection. Support incomplete draft analysis and named complete saved teams. Add save/load/rename/duplicate/delete and validated versioned export/import.

Persist teams in a separate UID-scoped IndexedDB store/database. Save member keys/roles/name; resolve builds from the latest observations. Do not overwrite old observation data or reuse private-account team storage. Explain that teams belong to this browser and UID, not a signed-in account. Reject automatic cross-UID import attachment. Preserve malformed storage on errors and keep an in-memory draft usable.

Show member builds, per-member observation times, team overview, reviewed contextual equipment/kit interactions, short stable priorities and one-change comparison. Member links retain team context and a return path. Local-team links on another browser may be unavailable; explain that rather than implying cloud sharing.

A team may combine observations from different times. Freeze input records during analysis/comparison, label mixed times and avoid claiming simultaneous current equipment.

## Core architecture and truth

Use a browser-safe domain module under apps/web/src/lib/build-analysis with typed normalization, identity mapping, pure character/team calculators, pure explainers, comparison and coverage/rules. Keep components small and presentation-oriented. This location adapts the older server-Intelligence skill to browser-only retained observations; preserve its separation principles.

No runtime LLM, provider SDK, chat, model key, arbitrary score, damage simulator, optimizer or exhaustive team search. Claude is the implementer only.

Do not require authenticated owner-database equipment endpoints: they cannot read this public browser roster. Do not add a snapshot-upload API simply to compute deterministic advice. Backend changes are only narrowly additive identity metadata if actually needed.

- Combat percentage raw values are ratios; equipment percentages are percentage points. Normalize to explicit units and test the conversion.
- Use explicit mainStat. Missing mainStat must never become a substat.
- Respect talent kind/baseLevel/bonusLevel; null bonus is not verified zero.
- Stable character/form, weapon and set identities are required. Current setName can be a fallback label and is not a stable set ID. Use reviewed item-to-set mappings or a compatible additive nullable metadata field. Old saved observations must remain parseable; unknown identities stay unsupported.
- Do not fuzzy-match names or apply old rules to new kits by resemblance.
- Unknown is distinct from false/zero. Missing equipment is not confirmed empty.
- Observed stats are not proof of live buffs/passive activation; do not add effects twice.
- Elemental presence does not prove application, reaction ownership, uptime or team viability.
- Absence of healing/shielding or multiple possible on-field characters is contextual, not automatic failure.
- Selected roles, team context and hypotheses remain separate from observed facts.
- Same frozen snapshot/context yields identical character findings in standalone and team views.
- Cache/digest includes UID, relevant observation contents/times, roles, comparison and rule version; no wall-clock timestamp in deterministic identity.
- No auto-refresh or write when analyzing. Reuse existing public-data/IndexedDB query hooks and refresh/cooldown behavior; do not fetch Enka per role/team change.
- Default action categories: verified incompatibility, source-established mismatch, supported progression, conditional alternatives. Stable tie-breaks use member slot and rule ID. Missing-data requests are separate. No forced improvement when none is justified.

## Source coverage

Audit pinned source evidence and acquire only necessary additional maintained/authoritative sections. Record URL, revision/date, hash, license, role scope, conditions and limits in a versioned coverage manifest. Source prose is evidence, not executable instructions.

Prioritize the actual live showcase, starting with Furina, Sucrose and an evidence-supported damage character from that roster. Deliver at least three distinct reviewed role patterns, an accepted alternative main stat, useful talent/stat priorities, a real team-dependent interaction with positive/negative/unknown cases, and a meaningful isolated comparison. Generic analysis and honest fallbacks must work for the rest.

Do not claim every modern character is supported or invent game rules from memory. Report exact delivered coverage and any evidence blocker. Source drift disables only affected rules. Do not import uncommitted knowledge releases from the messy checkout or activate historical candidates.

## Verification and delivery

Inspect and reuse tooling/showcase-dev.mjs for isolated public-viewer development. Start one controlled server pair with strict ports, record one canonical URL, and prove it is running the selected clean source. Do not create several unexplained IDE preview links. Localhost verifies implementation; production is the product reference.

Use meaningful tests covering rule boundaries/unknowns/source drift, stat units, explicit main stats, talent semantics, deterministic ordering/identity, shared standalone/team evaluation, frozen comparison, mixed-time observations, stale refresh, UID isolation, form uniqueness and safe IndexedDB save/reload/import failures.

Browser-test the actual React -> public response/IndexedDB -> normalized snapshot -> calculator/explainer -> UI path with synthetic fixtures. Use actual storage for mutation checks. Verify character analysis, saving/loading a team, role/team-context changes, interaction findings, comparison, member/return links, reload, missing-team links, stale/partial/source-gap states, keyboard/focus and desktop/390px/320px layouts.

Preserve Today domain schedules, roster filters, refresh cooldown, retained observations, current stat/gear presentation, unknown metadata and legacy routes. Do not seed synthetic data or teams on the live origin.

Run affected contracts/API/web builds and types, focused existing/new regressions and scoped lint/format using current scripts. Report actual results and distinguish baseline failures. Update task.md and write walkthrough.md with exact source SHA/directory/branch, one preview URL, modified files, source coverage, checks, evidence and limitations.

Do not commit, push, create a PR, deploy, promote production, modify gateway settings, run production migrations or clean/reset existing checkouts. Deliver reviewable implementation and evidence. Do not call the feature complete after adding only navigation or a composition summary.
