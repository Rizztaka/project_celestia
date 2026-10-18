# Next-phase implementation prompt — C2b

Recommended model: **GPT-6.1 Sol, High reasoning effort**. This is a bounded implementation with existing services and explicit acceptance criteria. OpenAI Docs describes Sol as suitable for complex coding with a lower cost than Astra and supports High effort: [model documentation](https://developers.openai.com/api/docs/models/gpt-6.1-sol), [selection guidance](https://developers.openai.com/api/docs/guides/model-selection). The effort choice is the architect's recommendation for this task, not a claim that every C2b operation needs maximum reasoning. Use Astra for an unresolved architecture/evidence dispute if Sol cannot resolve it; no automatic model switch is required.

Copy the following into the implementation chat:

```text
Implement Project Celestia's bounded C2b data-trust phase in
D:\Genshin Personal\project-celestia.
This message authorizes C2b implementation in this conversation, regardless of
older architect-only or weekday role notes. Work in the existing local checkout.

Read docs/plans/CURRENT_HANDOFF.md first, then
docs/plans/c2b-data-trust/implementation_plan.md,
docs/plans/c2a-clock-task-reliability/walkthrough.md,
docs/plans/c2a-clock-task-reliability/sources.md,
docs/plans/genshin-companion/implementation_plan.md,
docs/adr/0012-genshin-companion-direction.md,
docs/adr/0013-versioned-routine-snapshots.md,
docs/plans/c1b-import-provenance/walkthrough.md, and docs/api/genshin-import.md.
Inspect the current diff before editing. C2a is implemented and locally accepted;
do not redo its routine table, provider clock, V2 migration, or concurrency model.
Use the current C2b plan for this phase's scope. Historical review failures and
source-gate notes are not current blockers. Record any newly discovered regression.

Complete the plan's catalog inventory, typed validation/trust boundary, evidence
manifest, and guarded material/Today/Planner/event advice paths. Verify/correct
at most the existing HuTao, Sethos, and StaffOfHoma records plus their required
material/domain dependencies. Do not add targets or claim current-patch coverage.
Source facts before marking them verified. A schema-valid entry is not game evidence.
Keep candidates unavailable when their evidence is missing. At least one sourced
character example must produce a correct positive material result for acceptance.
Bind evidence to exact fields/ranges and stable content fingerprints, including
required dependencies. A changed dependency must invalidate affected advice too.
Attribute primary sources or owner-provided evidence; record unresolved conflicts.
Do not invent a verifier, capture date, or game version. Existing local evidence
must be readable from the handoff; preserve denied-site access restrictions.

Keep supported goal advice within existing ascension phases 0-6 and base talent
levels 1-6, with source checks. Preserve unsupported goals and give explicit reasons;
never silently omit them or label a partial result a complete plan. C1b stores import
receipt/source/scope, not proof of a complete game inventory scan. replacement_section
and entryCount=0 do not establish zero owned quantities; zero entries are currently
discarded by the importer. Keep absent keys unknown under the existing persisted
contract. Show recorded positive quantities with their import basis, not as live stock.
Do not backfill completeness, change import semantics, or add a migration to recover
missing zero evidence. Needed totals can still be known when a deficit is unknown.
Preserve imported unknown keys. Route every bounded advice consumer through the
typed provider contract, including the Planner calculator's direct raw-data path.
Keep legacy ranking/profile inputs unverified; use the existing neutral fallback
until their eligibility is established. Reuse arithmetic, not a new optimizer.
Repair arithmetic omissions within that reuse: supported upgrade totals must include
all sourced costs for the selected action, including Mora and every material tier.
Leveling/EXP and crafting/conversion optimizations remain outside scope. Route source,
weekday, and resin-per-claim assumptions require evidence too. If those are missing,
keep route advice unavailable without disabling independently verified cost totals.
Describe any verified resin allocation as a budget, not guaranteed drops or completion.

Keep placeholder/expired events and weekly boss catalogs out of current advice.
C2a manual resin, Transformer records, aggregate weekly claims, and daily reminders
must remain usable. Do not add discount/cooldown estimates, material credits,
per-boss tracking, new goal lifecycle, equipment UI, or other C3 scope.

Add independently derived expected-count examples and invalid/missing-join tests;
never derive expected values from the same catalog/calculator being tested. Verify
mixed supported/unsupported goals, absent stock versus recorded quantities, zero
computed deficit when recorded stock covers demand, empty-import uncertainty,
dependency fingerprint changes, SELECT-only reads,
placeholder exclusion, ownership/session isolation, and C2a regression behavior.
Run direct Vitest with an explicitly guarded disposable loopback celestia_test_*
database, lint, types/builds, formatting, preservation checks, and the relevant
actual browser flows. Never use the real .env database or run tests through Turbo.
The 476-test C2a result is historical baseline evidence, not the new run's result.
Report fresh counts and ensure PostgreSQL cases actually run rather than skip.
Temporary C2a servers were stopped; prepare a guarded local fixture as needed.

Preserve all current local work, unrelated AI/env/dependency changes, and the
eight hashes in docs/plans/c2a-clock-task-reliability/preservation-check.json.
Protected Turbo log SHA256:
790D929247252D64703A67C561419E28206DA7A37D2A49F6253CFEEB3ECB0AED.
No broad formatting, reset/clean, staging/commit, push, deployment, production
migration, or external messages. No new database migration is expected for C2b.
Leave the five existing unrelated formatter exceptions documented in CURRENT_HANDOFF
unchanged; check files edited in this phase and report whole-tree exceptions honestly.

Create docs/plans/c2b-data-trust/task.md before editing application code, then persist
through implementation and validation. Write the C2b walkthrough,
record exact supported coverage and source limitations, and update CURRENT_HANDOFF.
If source access is unavailable, implement truthful unavailable paths and record
the precise evidence gap; never fabricate facts or mark a failed positive-example
acceptance check complete. Stop temporary test services when finished. Report the
result and any remaining blocker concisely; do not continue into C3 automatically.
```
