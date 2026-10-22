# AI removal and deterministic build insights — 2026-10-22

Implemented directly at the owner's request. **The model runtime is removed and
the first deterministic build-insights flow works.** This is a scoped mechanical
advice engine, not a claim that all Genshin strategy has been encoded.

## Product behavior

Character pages now load **Build insights** automatically from an authenticated,
read-only endpoint:

`GET /api/v1/games/genshin/characters/:characterKey/build-insights`

The service uses the existing single owner-scoped equipment SELECT and the
existing hash-validated profile reference catalog. It works for all **129 pinned
catalog character/form entries**, including entries without an owned record.
Profiles, progression, constellation/weapon/artifact/talent descriptions and
their bright/dark unlock presentation are preserved.

The panel evaluates recorded weapon type compatibility and artifact piece bounds.
An optional disclosure compares one hypothetical compatible weapon/refinement or
an artifact set with an explicit piece count. No stored equipment is changed.
There is no chat, model key, model quota, scenario questionnaire or ranked list.
The team builder retains its existing deterministic composition functionality;
its chat entry is removed.

## Executable rule coverage

- Canonical weapon-type compatibility applies across the catalog. A compatible
  type is explicitly not a suitability or optimal-build verdict.
- Artifact counts preserve lower/upper bounds for missing assignments; duplicate,
  unrecognized or inconsistent assignments cannot establish exact piece counts.
- Harbinger of Dawn uses a source-bound R1–R5 table and strict **HP > 90%** gating.
  Current combat HP is unavailable to imports, so the passive remains conditional;
  potential CRIT Rate is not added to recorded stats. Unknown refinement stays
  unresolved.
- Deepwood Memories, Gilded Dreams, Golden Troupe and Marechaussee Hunter have
  explicit two/four-piece eligibility rules tied to their pinned source hashes.
  Combat triggers, target windows, stacks and party/field state remain unknown.
  Deepwood retains its hit/window prerequisites. Golden Troupe's unconditional
  four-piece component is separate from its field-dependent additional bonus.
- Other weapon/set effects retain complete MIT-licensed source descriptions and
  an explicit lack of executable coverage. A changed source hash disables its
  compiled effect rule until review; it does not silently reuse stale conclusions.

The calculator returns typed decisions/condition truth and values without
user-facing prose. The explainer translates those decisions without changing
them. The service handles data reads and provenance. This follows the ADR 0011
score-free applicability extension; no arbitrary confidence/performance score is
invented. General guide prose and extracted inventories are not executable rules.

## Removed runtime

Removed the OpenAI SDK dependency/lock entry, OpenRouter/Groq clients, model
configuration schema/examples/container wiring, the model-only admission gate,
AI summary/advisor routes and contracts, chat components/client and active model
evaluation dispatch tooling. Obsolete model tests are retired with their code.
The source-acquisition/verification tooling remains, with `--live` explicitly
rejected before processing. Related old browser/verification callers were updated.

**39 retired source/tool files** have exact original-byte `.raw` copies under
`retired/`, recorded in `retired-manifest.json`; they are not compiled, discovered
as tests or imported by the application. Earlier source snapshots, releases,
model failures, usage ledgers and reviews remain historical evidence. **15 stale
generated backend output files** corresponding to retired source were removed
before the production rebuild. Local secret files were not opened or edited;
provider credentials are no longer consumed by application code.

All old instructions to resume eight model checks, wait for allowance, evaluate
508 model cases or activate a model-backed candidate are superseded. The original
source release pointers are unchanged; the new engine reads the separately
validated profile catalog and has its own engine version.

## Verification

- **100/100 tests across nine files**, zero failures: `final-tests.json`.
  Includes pure boundary rules, real production route/auth handling with mocked
  data access, all-catalog unowned reads, reproducibility, private-field
  minimization, hypothetical isolation, source drift, rendered source/condition
  states, exact retirement archives, profile client/service/Git round trips,
  source-store preservation and HTTP admission regressions.
- Final **19/19** affected engine/client tests pass after the small explanation
  corrections (`final-correction-tests.json`); this is a subset, not additive.
- Contracts build/typecheck, API production build, web production build and web
  typecheck pass. Changed code passes scoped ESLint. Scoped diff whitespace
  checks pass. Full-repository lint was not claimed: unrelated existing changes
  and the previously observed contextual-advice import-order issue are outside
  this milestone.
- Browser exercised the **actual React component → local HTTP fixture → real
  production service → pinned data → response** using synthetic equipment,
  without a real account or database. Verified recorded Harbinger/Deepwood states,
  opened the hypothetical selector and selected four-piece Gilded Dreams. The
  comparison remained visible and the recorded build stayed unchanged. This
  found and fixed an intermediate loading remount that closed the controls.
  `browser-preview.png` shows the synthetic fixture, not production account data.
- Compared **1,194 pinned profile/knowledge/source files** against the earlier
  preflight preservation baseline: zero changed/missing files. All 39 archived
  originals match their retained hashes. See `preservation.json`.
- Preview servers on 45461/45462 were stopped after verifying the exact owning
  preview process; temporary frontend entries and preview script were preserved
  as `.raw` artifacts and removed from active source. No real database, external
  model call, account/equipment write, staging, commit, push or deployment.

## Next coverage work

The migration removes generated uncertainty; it does not eliminate the need for
correct domain modeling. Next extend reviewed **mechanic families** across the
catalog rather than claiming a character is mastered after importing its prose:

1. Favonius and Makhaira prerequisites and complete effect/refinement scope;
   explicit energy/team-ATK usefulness conditions, without inventing ER targets.
2. Source-backed role/team capabilities and conditional build comparisons,
   including the other-Deepwood-holder prerequisite for Gilded and distinct
   shielding/healing/application roles. A reaction-capable elemental lineup does
   not prove reaction ownership or uptime.
3. Automated pinned-source diffs and a coverage manifest that identifies changed
   facts, rules needing review, and unsupported scopes. Preserve complete source
   descriptions for every character while rule coverage grows.

Each addition needs positive, negative, boundary and unknown-state fixtures
independently justified by sources. Reproducibility is guaranteed by pure
evaluation; correctness remains bounded by the reviewed rules and their sources.
