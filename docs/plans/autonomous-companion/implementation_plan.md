# Autonomous endgame companion

Owner direction recorded 2026-10-25. This is the current product goal and delivery
order. It supersedes the September exclusions of damage analysis, automatic team
recommendations, advanced endgame planning and new wish-simulator features.
Historical walkthroughs remain evidence of their own changes, not completion of
this goal. Keep the existing deterministic architecture and the owner's removal
of AI providers; autonomous recommendations do not require an LLM.

## Intended experience

Import or refresh an account, choose a favorite character or an endgame objective,
and get a short answer: which team to use, whether its builds are sufficient, and
which improvement is most worthwhile. Account-value pull advice and a separate
fun wish simulator complete the experience. Respect favorites, available time,
execution difficulty and comfort alongside damage.

Autonomy initially means automatically deriving and refreshing recommendations
from available observations. It does not imply game control or continuous access
to private account state. Public UID showcase history is partial; it cannot prove
ownership of the entire roster or that an absent character is unowned. Retain
observed data and player intent separately. Let users import a fuller account or
explicitly confirm ownership, with provenance and freshness visible.

Version 7.1 is the requested knowledge target. Official 7.1 notices establish the
release context, but not the correctness or completeness of Celestia's data:
[HoYoverse release news](https://www.hoyoverse.com/en-us/news) and
[7.1 update details](https://genshin.hoyoverse.com/m/es/news/detail/166383).

## Current code audit

Baseline: canonical checkout `D:/Genshin Personal/project-celestia`, `master`,
`a0e0783`. No copied checkout, archived unfinished code or production data is
needed for this work.

| Goal                      | Existing foundation                                                                               | Gap before the goal is met                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Account understanding     | Public showcase, retained observations, authenticated imports, equipment records                  | One explicit coverage contract across the partial public and fuller imported account; mixed-time and missing observations remain unknown                                 |
| Built / needs building    | Public deterministic character analysis and authenticated Build insights                          | Only four public role profiles; no universal endgame readiness evaluation, marginal upgrade comparison or role-specific stopping criterion                               |
| Best team for a character | Public saved teams, pinned browser gcsim, automatic teammate combinations, custom rotation editor | Generic generated Skill/Normal rotation can undervalue Burst-dependent teams; no complete rotation optimization or universal best-team guarantee                         |
| Endgame teams             | Abyss records and Theater cast planner                                                            | Joint team assignment for Abyss and Onslaught, current encounter constraints, Theater act/vigor planning and verified season ingestion                                   |
| Pull account value        | Historical template/ownership/synergy heuristic and wish savings                                  | Counterfactual account improvement, alternative pulls, comfort and favorites, transparent investment assumptions; old MUST_PULL labels are not the new decision contract |
| Fun wish simulator        | API rules and historical scenario contracts retained                                              | Current `/simulators` route redirects to savings; restore a dedicated accessible simulator, then verify versioned banner rules and exclusions                            |
| Knowledge through 7.1     | Pinned descriptions, references, progression, source manifests and engine metadata                | Description presence is not executable kit support; reconcile a verified release roster, forms, equipment, constellations, reactions and engine fidelity                 |

### Reproducible local inventory

Run `pnpm companion:status`; use `pnpm --filter @celestia/api exec tsx
tooling/companion-status.mjs --json` for the machine-readable matrix. The command
reads repository data, verifies description reference bytes against the index,
checks reference IDs, and uses the existing reviewed role-source hash gates. It
does not fetch remote pages or read account/environment data.

Initial findings:

- 131 descriptive catalog entries representing 123 account identities when all
  Traveler variants count once. This is a local denominator, not a verified count
  of released playable characters.
- 129 description references pass local hash and identity verification. Manekin
  and Manekina have catalog entries without these references.
- 119 catalog entries share an avatar ID with at least one engine form. This is
  presence coverage; a particular elemental form or constellation still needs an
  exact runtime gate. It does not mean 119 fully supported characters.
- Four entries have reviewed role patterns: Furina, Sucrose, Skirk and Xilonen.
  Role/constellation/runtime conditions still apply.
- The engine metadata lists 124 character forms, 237 weapons and 55 artifact sets.
  That is the pinned engine's inventory, not verified live-game coverage.
- Catalog entries with no simulation form: Alyosha, Illuga, Kachina, Linnea,
  Lohen, Manekin, Manekina, Nefer, Sandrone, Vesna, Vodyanitsa and Zibai.

The report returns success with expected missing coverage and nonzero status for
reference integrity/identity failures or blocked role sources. Keep generated
reports under ignored `.local-maintenance/`. Do not commit large data dumps.

## Delivery order and acceptance

### M0 — Goal alignment and measurable baseline

Record this direction, audit current code, add the local coverage report and test
identity joins, unknown data, changed sources and local reference integrity.
Complete when a fresh checkout can reproduce the coverage baseline. This is a
development tool, not a newly shipped recommendation feature.

### M1 — Trusted knowledge and account context

Reconcile an independently sourced release-to-7.1 roster with the local catalog.
Maintain separate statuses for description, progression, reviewed role advice,
mechanics, simulation and endgame applicability. Use stable avatar/form IDs and
explicit equipment IDs. Record source, revision, patch scope, review status and
known exclusions for each executable rule. Missing support must stay visible.

Define one account-context contract: complete/partial/unknown roster scope,
source timestamps, conflicting observations, owned versus hypothetical builds,
favorites, protected gear, comfort preference and chosen content difficulty.
Invalidate derived results when builds, rules or encounters change. Preserve the
current UID-first flow; ask only for missing data that changes the answer.

Acceptance: verified roster denominator; exact form-level coverage; no hidden
default gear, talents or ownership; stale or unsupported information produces a
specific gap instead of a confident recommendation. Expand the selected owner's
observed characters first, then cover the verified roster in explicit batches.

### M2 — Useful character readiness and next investment

Return `ready_for_target`, `needs_investment`, `conditional`, or `insufficient_data`
for a character **in a role, team, rotation and target encounter**. Readiness is
not an all-purpose character score. A high-CRIT support can still lack energy,
healing, a required set, or the right teammate prerequisite.

Assess relevant talents, weapon, main stats, set activation, rotation energy,
team damage contribution and required support output only when modeled. Separate
hard incompatibilities, target failures and optional improvements. A working
cheap build can be ready; do not require crowns or ideal artifacts by default.

Compare bounded, explicitly specified upgrade scenarios under the same setup.
Report expected benefit, known resource cost and uncertainty, and recommend the
highest useful next action. Do not silently move gear or add missing stats.
Until an upgrade/encounter is supported, retain the existing bounded advice and
say which readiness dimension cannot be assessed.

Acceptance: paired ready/not-ready fixtures for different roles; unsupported and
mixed-time builds stay conditional/unknown; energy failure can defeat high
training-dummy DPS; input records remain unchanged. The user can mark a target
good enough and stop receiving low-value farming suggestions.

### M3 — Team search with defensible rotations

First add reviewed per-character setup and rotation candidates, including Burst
usage, energy and activation prerequisites. Then improve the existing candidate
search. A generic Skill-only setup must not support a universal best-team claim.
Use common seeds, pinned engine metadata, fixed comparable conditions and fresh
finalist verification; expose failed actions, energy and sample uncertainty.

Return best **tested** lineups and a comfortable alternative. Respect favorites,
locked members and gear exclusivity. Bound computation, show progress, cancel
cleanly and invalidate stale results. Raw DPS remains separate from comfort and
content constraints. Support overlapping uncertainty rather than false rank
precision; describe candidate/rotation scope and modeled encounter.

Acceptance: known Burst-dependent, reaction and support teams reproduce trusted
reference scenarios; source/engine/build updates invalidate results; unsupported
members never produce partial team totals; browser remains usable on mobile.

### M4 — Teams for each endgame mode

Use versioned encounter adapters rather than one generic score:

- **Abyss:** jointly assign disjoint lineups to the relevant halves, account for
  shields, waves, enemy resistance, grouping, encounter timers and player target.
- **Onslaught:** verify the selected difficulty/cycle rules, then assign teams
  jointly across its encounters with the correct reuse restrictions and counters.
- **Theater:** verify the selected season/difficulty, cast eligibility, opening
  trials, guests, borrowing, vigor and act availability. Offer a useful draft plan
  and adapt to the characters actually offered, rather than assume future draws.

Acceptance: optimal joint fixtures beat greedy individual-team choices; no
illegal duplicates; expired encounter packs lose their current-cycle label;
unsupported mechanics produce gaps. Historical/manual presets remain distinct
from verified active content. No automatic season claim from a calendar guess.

### M5 — Account-value pulls

Compare current achievable content coverage with explicit hypothetical additions.
Report newly enabled teams, improvement over existing alternatives, horizontal
coverage, support flexibility, comfort, favorites and estimated build cost.
Separate C0, constellations and weapons; state hypothetical gear/investment.
Unknown ownership is not unowned. Unmodeled kits are not low-value kits.

Use an explainable multi-objective comparison and let users choose priorities.
Include save/skip as valid options. Budget/pity models show a range with stated
assumptions; they do not forecast a guaranteed outcome. Replace the old absolute
pull verdicts through a compatible contract migration.

Acceptance: adding a flexible support can outrank a redundant damage dealer;
favorite/comfort priorities visibly affect the recommendation; partial account
data blocks unsupported conclusions; no hypothetical build is stored as owned.

### M6 — Fun simulator and companion orchestration

Restore a separate simulator experience using versioned, reviewed banner pools,
probabilities, pity/guarantee/path transitions and carryover rules. Disclose any
approximation; unsupported systems cannot be advertised as faithfully modeled.
Seed randomness in tests and isolate simulated history from real wish savings.

Then compose the supported engines into a small home summary: ready builds,
best next investment, team suggestions and optional pull comparison. Refresh
derived advice when known inputs change. Make results explainable without a
questionnaire; retain detailed math and sources behind progressive disclosure.

Acceptance: simulator state-transition and probability checks, mobile interaction,
save/restore and error recovery; one refresh updates affected advice without
overwriting favorites, goals or existing loadouts. Add scheduling only if useful
and explicitly configured; this goal itself does not install a background job.

## Engineering and release

Keep the modular monolith and shared API contracts. New server intelligence
belongs in `apps/api/src/games/genshin/intelligence/`, with pure calculators,
separate explainers and orchestration services. Existing public browser analysis
and gcsim are established paths; avoid duplicating engines or forcing costly
server simulation without a measured reason. Share pure contracts/rules when
both public and authenticated paths need them.

Test meaningful invariants in each milestone; use synthetic accounts for browser
checks. Run focused regression/type/lint checks for changed areas, then required
broader checks. Tests involving real PostgreSQL require the existing disposable
database guards. Keep production data and secrets out of evidence. Milestone
completion requires actual acceptance evidence; documentation and green unit
tests alone do not certify combat accuracy or live deployment.
