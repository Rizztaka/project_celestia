# Next-phase implementation prompt — C3a

Prepared 2026-10-02 and subsequently executed; C3a completed locally October 3. Bounded C3b focus/goal lifecycle completed locally October 4. This prompt remains the historical equipment-first scope record; see [current handoff](../CURRENT_HANDOFF.md) for execution evidence and deferred work.

Recommended model: **GPT-6.1 Sol**, reasoning effort **High**. This is a bounded implementation using existing account, import, character and equipment foundations. OpenAI describes Sol as suitable for complex coding at a lower cost than Astra and supports High effort: [model documentation](https://developers.openai.com/api/docs/models/gpt-6.1-sol), [reasoning guidance](https://developers.openai.com/api/docs/guides/reasoning). High is the recommendation for this task's ownership, provenance and regression checks, not a measured project benchmark. Use Astra only if an architecture or evidence issue remains unresolved; no automatic switch is required.

Copy the following into a new chat, or instruct that chat to read and execute this prompt:

```text
Implement Project Celestia C3a: a truthful, read-only character detail and
equipped-items view, after a focused independent review of the C2b checkpoint.
Work in D:\Genshin Personal\project-celestia, the existing dirty local checkout.
This message authorizes local C2b corrective fixes and bounded C3a implementation
in this conversation, overriding older weekday/architect-only role notes.

Read docs/plans/CURRENT_HANDOFF.md first, then:
- docs/plans/c2b-data-trust/walkthrough.md, sources.md, catalog-inventory.md,
  implementation_plan.md, and preservation-check.json
- docs/api/catalog-advice.md and docs/api/genshin-import.md
- docs/plans/c1b-import-provenance/walkthrough.md
- docs/plans/c2a-clock-task-reliability/walkthrough.md
- docs/ROADMAP.md, docs/features/FEATURE_GENSHIN_COMPANION.md,
  docs/plans/genshin-companion/implementation_plan.md
- docs/adr/0012-genshin-companion-direction.md and
  docs/adr/0013-versioned-routine-snapshots.md
Follow applicable repository instructions. CURRENT_HANDOFF and implementation
evidence supersede stale overview banners that still call C2b only planned.
Inspect tracked and untracked changes before editing; they contain multiple
completed, uncommitted milestones and unrelated owner work.

FIRST: REVIEW C2b
Independently inspect the implementation, saved primary-source responses and
tests; do not accept the walkthrough or passing count as proof by itself.
Check exact field/range and dependency fingerprint enforcement, malformed and
missing joins, all consumed costs including Mora, mixed-goal exclusions,
nullable deficits, empty/zero-only import uncertainty, recorded-stock wording,
route eligibility independent of costs, placeholder exclusion, typed provider
coverage, SELECT-only reads, ownership and preserved C2a behavior.
Record findings with severity and precise code references in
docs/plans/c2b-data-trust/implementation_review.md. Fix concrete in-scope defects
and add meaningful regression coverage. Keep findings and resolutions visible.
Proceed into C3a once no known blocking correctness, security or truthfulness
defect remains; otherwise report the concrete unresolved blocker. Declared
missing ascension/candidate/route sources are supported unavailable states,
not by themselves a reason to delay the equipment read view. Do not expand
catalog coverage or rebuild C2a during this review.

C3a OUTCOME
A signed-in user can open a stable, URL-addressable owned character from the
existing roster and inspect stored progression, its recorded equipped weapon,
and all five artifact slots on desktop and mobile. Keep the page within the
existing application style and navigation. Preserve roster/inventory URLs.
Focus selection, priorities and goal lifecycle are a later C3b slice.

Create docs/plans/c3a-character-equipment/task.md and implementation_plan.md
before application edits. Inspect the existing Genshin characters, inventory,
importer and account repositories/services, shared contracts, RosterPage,
InventoryPage, routes and account-cache invalidation before choosing changes.
Extend existing modules; do not scaffold another game or intelligence engine.

1. Add the narrow typed read contract/endpoint needed for complete character
   equipment. Resolve account ownership from authentication. Scope character
   and related equipment reads to that account, including defensive handling
   of inconsistent legacy relations. Another user's character/equipment must
   never leak. Define consistent not-found behavior and safe key validation.
   Use account + character natural key for durable navigation, not replaceable
   equipment UUIDs. Reads must be SELECT-only and must not create an account,
   normalize records or update freshness. Return a coherent equipment and
   section-provenance view across concurrent imports.

2. Show stored level, ascension, constellation and talent values with the
   semantics actually supported by persistence/imports. Do not infer effective
   constellation-adjusted talents, observed values from importer defaults, or
   advice eligibility from a character's presence in the roster.
   Show recorded weapon key/name, level, ascension and refinement where stored.
   Always render flower, plume, sands, goblet and circlet explicitly. For each
   known piece show set, rarity, level, main-stat key, supported stored values
   and substats. Main-stat amounts absent from persistence stay unavailable;
   do not estimate them from unverified tables. Unknown keys and failed images
   need readable fallbacks. Set counts may describe recorded equipped pieces,
   without damage, set-bonus activation or build-quality claims.

3. Define truthful equipment states before building the UI. A recorded assigned
   piece, no assignment in recorded data, and a section with unknown provenance
   are distinct. C1b receipt/source/entryCount/replacement_section does not prove
   a complete game scan or a confirmed empty in-game slot. No current record
   means neither confirmed unequipped nor zero. If explicit empty observation
   cannot be represented today, say so and keep the state unknown/unrecorded.
   Do not fabricate a known-empty state, backfill evidence, change import
   semantics or add persistence to make the target specification appear met.
   Use each relevant section's receipt/source, labeled as imported/recorded,
   not live equipment or per-item observation time. A newer character-only
   import must not refresh preserved weapon/artifact provenance. A section
   receipt is not proof every retained character was present in that payload.
   Do not invent an arbitrary freshness threshold or equipment acquisition age.

4. Add roster links and a usable detail page with loading, retry, not-found,
   no-import and partial-data states. Correct touched roster wording such as
   an unconditional “No weapon equipped” if persisted absence cannot prove it.
   Fetch complete equipment through owned read services, never the top-five
   Artifact Intelligence endpoint. No AES, ROI, universal quality score, or
   score renamed to “progress” on this slice. Inventory legacy callers and
   preserve their compatibility; broad Intelligence/nav migration stays later.
   Reuse React/TanStack Query patterns, invalidate detail views after successful
   relevant imports, preserve valid cached data after failed imports, and clear
   account data on session changes, including delayed in-flight responses.

PRESERVE THE BOUNDARIES
No focus persistence, goal lifecycle/range expansion, automatic completion,
artifact targets, manual equip/unequip, optimizer, history, snapshots, new
catalog verification, Today redesign, AI work or other C3b/C4 scope. Existing
goals/imports/routines and C2b unavailable states must remain intact. This read
slice should need no database migration; document any discovered constraint
without silently broadening persistence. Displaying stored equipment does not
require verifying its build quality or reopening C2b source research.

VALIDATE AND FINISH
Test authentication/ownership, all five slots, missing relations, unknown keys,
missing main-stat amounts, absent/legacy provenance, recorded-empty versus
unknown distinctions, coherent reads and SELECT-only behavior. Use actual
guarded PostgreSQL cases for ownership and re-import behavior: omitted sections
preserve equipment/provenance, explicit replacements update the read view,
failed imports preserve it, and regenerated equipment UUIDs do not break the
character URL or alter existing goals. Test session/cache isolation.
Run focused checks and the direct full Vitest suite, API/web lint, types/builds,
changed-file formatting, preservation checks and actual browser flows on desktop
and mobile. Include complete and partial equipment, no-import/not-found states,
re-import refresh and switching synthetic users. Add meaningful tests rather
than tests that merely mirror implementation.

Use only an explicitly guarded disposable loopback celestia_test_* database.
Set test env explicitly and prevent loading the real .env database. C2b's
temporary services are stopped; prepare a guarded fixture as needed and stop
your temporary services afterward. Run Vitest directly, never through Turbo.
Historical baseline: 509 tests / 35 files, including 36 PostgreSQL cases
(16 importer, 12 routine, 8 C2b). Report fresh counts and ensure database cases
actually execute; do not label skipped integration cases as a full pass.

Preserve all local work, unrelated AI/env/dependency changes, and all eight
hashes recorded in C2a/C2b preservation-check.json. Protected Turbo log SHA256:
790D929247252D64703A67C561419E28206DA7A37D2A49F6253CFEEB3ECB0AED.
Retain the five existing formatter exceptions documented in CURRENT_HANDOFF.
No broad formatting, reset/clean, staging, commit, push, deployment, production
migration or external messages. Use D:/.pnpm-store if dependencies need it.

Complete the authorized review/fixes and C3a implementation, not just a plan.
Write the C3a walkthrough with exact behavior, tests, browser evidence and
limitations, finish the checklist, and update CURRENT_HANDOFF and relevant
checkpoint banners accurately. Distinguish C3a completion from full C3; record
C3b as the next separate slice. Report blockers honestly and stop at this scope.
```
