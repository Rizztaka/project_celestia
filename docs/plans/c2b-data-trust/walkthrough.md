# C2b local implementation and acceptance

Completed 2026-10-02 by Codex in `D:\Genshin Personal\project-celestia`, using the owner's existing dirty checkout. The checklist was created before application edits. No reset/clean, staging, commit, push, deployment, production migration, external message or C3 work occurred. This is local acceptance; CI and independent review have not run.

**Follow-up, 2026-10-03:** the separately authorized [focused independent review](implementation_review.md) is complete with two findings resolved (exact field/range enforcement and coherent stock/receipt reads). [C3a acceptance](../c3a-character-equipment/walkthrough.md) records the current 535-test result and equipment slice. The October 2 counts and pre-review status below remain historical evidence; no wider catalog or release approval follows.

## Result and evidence

The game-owned `GenshinCatalogTrust` boundary validates catalog shape, exact joins, supported ranges and source-bound fingerprints. Platform consumers use a narrow typed provider contract. The Planner calculator no longer loads raw schedules/costs or applies unsourced resin constants; legacy ranking inputs use neutral priority. Cost and route eligibility are independent.

Only HuTao's normal attack, skill and burst **base talents 1–6** are verified. Official HoYoLAB anonymous calculator responses establish each step, consumed material name/ID, and Mora. The complete 15 requests/responses and identity join are checked in. [Sources](sources.md) records verifier/review date, null game version/observation date, exact coverage, independent counts, rejected community evidence and remaining gaps. No denied-site access workaround was used.

One talent 1→6 requires **122,500 Mora, 3 Teachings of Diligence, 21 Guide to Diligence, 6 Whopperflower Nectar and 22 Shimmering Nectar**. The raw HuTao talent book group was corrected from Ballad to Diligence on this evidence. Existing arithmetic now includes Mora and canonical common-material keys. Counts are additive for distinct selected goals; EXP, leveling and conversion remain excluded.

HuTao ascension, Sethos, StaffOfHoma and other records have no verified costs. Goals remain stored/visible with reasons, and mixed totals are partial. Official raw route-calendar fields alone do not prove location, weekday semantics and resin-per-claim rules; production routing remains unavailable without suppressing valid costs. No boss, event, banner, endgame or current-patch coverage is established. See the [ten-file inventory](catalog-inventory.md).

The shared [advice contract](../../api/catalog-advice.md) explicitly changes deficits to `number | null`. All callers preserve unknown absent stock. Positive imported quantities support computed deficits on a receipt/source/scope basis, including zero when stock covers demand. Empty and zero-only replacement imports still imply unknown missing keys. Opaque imported keys and unsupported goals survive unchanged. Reads remain SELECT-only.

Placeholder events return an unavailable view without a patch/reward summary; event writes reject absent/expired entries. Retired weekly helpers reject unavailable catalogs before repository access. Existing V1 409 behavior and V2 aggregate weekly/manual routines remain intact.

## Verification

The final direct full suite at **21:55:38 IST** passed **509 tests across 35 files, zero skipped and zero failed**. All **36 PostgreSQL cases actually ran**: 16 importer, 12 C2a routine, 8 new advice/import HTTP cases. This is a fresh result, separate from the historical 476-test C2a baseline.

- 31 new catalog tests independently transcribe per-step and multi-step expected costs for all three talent selections. They cover invalid ranges, finite integer counts, contiguous/unique rows, missing and incorrect joins, exact dependency invalidation, source attribution/conflicts, stable fingerprints, independent malformed/stale routes and placeholder exclusion.
- Eight new actual PostgreSQL cases cover mixed goals, shared costs, unknown versus positive stock, covered zero deficits, empty/zero-only imports, opaque key preservation, bearer ownership isolation and instrumented SELECT-only direct/indirect GETs with unchanged storage.
- Existing allocation arithmetic and C2a/import/security regressions pass. Archived event/weekly hydration tests use explicitly mocked raw fixtures; production exclusion is tested separately. Seven obsolete Planner expectations for unsourced routes/ranking were replaced by two boundary/neutral fixtures while retaining allocation tests. Counts reconcile as 476 + 31 + 8 + 1 new weekly guard − 7 obsolete net tests = 509.
- API/web ESLint (`--max-warnings 0`), shared-contract TypeScript, API TypeScript/alias/static-copy build, web `tsc -b` and Vite build passed. Changed-file Prettier passes. Whole-tree Prettier retains only the five documented unrelated exceptions: OpenRouter, original Sonnet submission, baseline web HTML and two CSS files.
- All eight [protected hashes](preservation-check.json) match C2a's preservation baseline, including the Turbo log. No new migration; the disposable fixture applied only the 11 existing migrations.

An initial full-suite attempt lacked environment variables after intentionally disabling dotenv; it was rerun with explicit dummy values. An old weekly placeholder expectation was updated to a test-only fixture plus a production rejection test. These were resolved before the passing run. The pg driver overlap deprecation warning remains from the existing integration setup. Production services and real `.env` database were never used.

Reproduce the direct API run from `apps/api`, after preparing a disposable loopback database and applying existing migrations:

```powershell
$env:DOTENV_CONFIG_PATH = 'NUL'
$env:NODE_ENV = 'test'
$env:CELESTIA_TEST_DATABASE_URL = 'postgresql://celestia_test@127.0.0.1:55442/celestia_test_c2b'
$env:DATABASE_URL = $env:CELESTIA_TEST_DATABASE_URL
$env:JWT_SECRET = 'local-c2b-test-secret-at-least-32-characters'
$env:OPENROUTER_API_KEY = 'test-only-no-network'
node node_modules/vitest/vitest.mjs run
```

The actual fixture was a fresh PostgreSQL 18.4 cluster in `%TEMP%/celestia-c2b-pg-20261002`, explicitly bound to `127.0.0.1:55442`, role `celestia_test`, database `celestia_test_c2b`. Tests guard the loopback host and `celestia_test_*` name. No Turbo test command was used.

## Actual browser acceptance

Chrome used a synthetic account on the disposable database, API `127.0.0.1:45440`, local built web preview `127.0.0.1:45441`. The existing test-only routine clock harness delegated all other requests to the real application and production-default provider; no runtime clock policy was changed. Web build used the loopback API URL only for this local preview.

- Selected Asia, recorded manual resin 80, checked commissions, recorded Transformer use and saved aggregate weekly zero through the UI. After a materials-only import, commissions remained checked, the Transformer timestamp remained recorded and weekly claims still displayed zero. Countdown/resin estimates continued normally; no cooldown/discount estimate appeared.
- Created HuTao normal talent 1→6. Browser showed every independently expected cost above, with unknown deficits before importing stock. Newly found frontend range mismatch was repaired: talent starts at 1 and selections stay within the existing 1–6/ascension 0–6 API contract. No persisted lifecycle/range expansion.
- Added StaffOfHoma 0→6. Goal stayed visible with its evidence-gap reason; totals became explicitly partial, without a completed-plan claim. Today displayed per-goal route/cost reasons. [Mixed unknown-stock capture](browser-mixed-unknown.png).
- Submitted a real materials-only GOOD preview/confirm import from `C2b browser fixture`: Mora 130,000, TeachingsOfDiligence 1, opaque key 7. Both goals remained; receipt/source were shown. Mora covered demand with computed zero deficit, Teachings showed deficit 2, absent nectar/Guide quantities stayed unknown. [Recorded-stock capture](browser-recorded-stock.png).
- Events showed the current evidence-gap message without placeholder rewards/patch completion. [Events capture](browser-events.png).
- Resin Planner showed zero eligible routes, unallocated budget, HuTao route-gap and StaffOfHoma cost-gap reasons, without a completion or guaranteed-drop claim. [Route capture](browser-route-unavailable.png).

Screenshots are application acceptance evidence, not firsthand game-data observations. API integration covers zero-only/empty imports and ownership separately. C2a's existing controlled-reset evidence remains preserved; this pass does not claim a new live overnight reset observation.

## Cleanup and handoff

Temporary API and preview processes were stopped after verifying their exact command lines; PostgreSQL was stopped with `pg_ctl -m fast -w stop` for the named disposable cluster. TCP connection checks confirmed ports 45440, 45441 and 55442 closed. The acceptance browser tab was closed. Temporary cluster/log files are retained for inspection. [CURRENT_HANDOFF](../CURRENT_HANDOFF.md) records the bounded result and follow-up limits. Independent review and any release remain separately authorized. Further source verification can enable eligible candidates/routes only after their exact fields/dependencies pass the same trust boundary. C3 remains deferred.
