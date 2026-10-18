# C4 review — ready for the next local phase

Reviewed 2026-10-07 in `D:\Genshin Personal\project-celestia`, HEAD `2d8820a48db83d7c62feebd849f2f1c2d3488bb6`. The owner's request was to review the completed work and, if suitable, prepare the next phase prompt. **No blocking defect was found in the bounded C4 implementation. It is ready to proceed to local C5 work.** This is not production-release approval or a claim that every legacy subsystem has been exhaustively audited.

No application source, schema, migration or dependency was changed during this review. New artifacts record the review and the proposed next phase; the current handoff and roadmap identify this checkpoint. C5 implementation has not begun.

## Scope and findings

Reviewed the C4 shared contract, migration, authenticated routes/controller, repository, service, deterministic composition and shared material aggregation; routine/server-change integration; client mutation/cache/expiry/form behavior; Today rendering and navigation; integration/pure/client regression coverage; preservation and acceptance artifacts. Reconciled the implementation against the current product specification, API documentation and roadmap. The inherited C1–C3 behavior also ran through the full suite.

| Area                      | Review conclusion                                                                                                                                                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data ownership and writes | Preferences/dismissals are user-owned, strict commands reject unsupported input, compound ownership constraints and owner locks protect writes. Revision/period checks and atomic responses remain in place.                              |
| Reset and session safety  | Server time is checked after the owner lock. Client dispatch expiry, originating-session guards, cancellation and monotonic snapshot acceptance are retained. Conflict/failure paths preserve drafts and confirmed state.                 |
| Advice and accounting     | Reads assemble coherent intent/stock context with bounded retries. Full eligible active demand includes hidden/dismissed goals; known stock is subtracted once. Unset/zero budgets, unknown stock and unavailable routes remain distinct. |
| Intent and imports        | Imports preserve declared goals and focus; lifecycle completion remains explicit. Server changes retire owned dismissals. UTC receipt corrections are covered by exact-timestamp regressions.                                             |
| UI boundary               | The shortlist, expansion, exact links, optional routines, reversible dismissals, manual recording, weekly records and separate advice failure behavior match bounded C4. Cross-page navigation and broader usability remain C5 work.      |
| Preservation              | Protected files, all historical migrations, C4 application source and the new migration match the review starting hashes. HEAD and empty index are unchanged.                                                                             |

No corrective application patch was necessary. The current mobile screen is lengthy and navigation patterns differ between pages; those are the already-planned C5 journey/polish work, not evidence that C4's data contracts fail. C5 must verify the complete changed journey rather than relying on C4 screenshots.

## Fresh verification on October 7

| Check                                  | Result                                                                                                                     |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Direct full Vitest suite               | **691 passed / 43 files / zero failed or skipped**; start 21:04:44 Asia/Calcutta, duration 74.23 seconds                   |
| Actual PostgreSQL cases                | **106 passed**: importer 16, routine 12, catalog advice 9, equipment 13, goal lifecycle 28, plan 28                        |
| API lint and build/types               | Pass                                                                                                                       |
| Web lint and production build/types    | Pass; ordinary configuration, no temporary API override                                                                    |
| Shared contract types                  | Pass                                                                                                                       |
| Prisma validation                      | Pass                                                                                                                       |
| Guarded database/schema comparison     | No difference detected                                                                                                     |
| Focused formatting and diff whitespace | Pass                                                                                                                       |
| Preservation                           | Eight protected hashes, twelve historical migration hashes, C4 source/schema/new migration, HEAD and empty index preserved |
| Temporary services                     | Owned fixture stopped; ports 45448, 45449 and 55448 closed                                                                 |

Commands: from `apps/api`, direct `node node_modules/vitest/vitest.mjs run --no-file-parallelism`, `pnpm lint`, `pnpm build`, `node node_modules/prisma/build/index.js validate`, and `node node_modules/prisma/build/index.js migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code`; from `apps/web`, `pnpm lint` and `pnpm build`; from `packages/api-contracts`, `pnpm exec tsc --noEmit`. Focused Prettier used the existing touched-file manifest and new review/prompt artifacts; `git diff --check` checked whitespace. No Turbo, whole-tree formatting or dependency update.

Only the previously owned OS-temp fixture at `127.0.0.1:55448/celestia_test_c4` was restarted. The existing guard ran before the test suite and schema tools; both database variables matched, `NODE_ENV=test`, `DOTENV_CONFIG_PATH=NUL`, with dummy JWT/OpenRouter values. The normal database was not accessed. Raw review test output remains at `%TEMP%\celestia-c4-review-tests.log`. The existing `pg` overlapping-query deprecation appeared again and was not suppressed; no dependency upgrade or transaction rewrite was performed. Prisma's available-update notice was informational and no update was applied.

This review inspected the existing desktop/mobile captures and reconciled the [C4 walkthrough](walkthrough.md)'s browser evidence with unchanged application hashes. **It did not rerun the interactive browser acceptance suite.** The screenshots and interactive results retain their original October 6 date. They cover no-import use, draft retention, conflicts, account switching, independent advice failure and re-import. Controlled-time tests are not an independent overnight observation of a live game reset.

See [review starting state](review-starting-state.json) and [review validation/preservation result](review-validation-results.json). Earlier [validation results](validation-results.json) and [preservation evidence](preservation-check.json) remain historical and unchanged.

## Limits and next phase

- All production farming routes remain unavailable. Cost verification still covers only HuTao base normal/skill/burst talent ranges 1–6. Positive allocation tests use synthetic providers and do not establish game facts.
- C4's migration has run only on disposable local data. Normal/production migration and coordinated API/frontend cutover remain outstanding. The deployed Render SHA remains unverified; no deployment or CI run was triggered.
- Broader primary navigation, first-use/returning-user acceptance, accessibility, operational readiness and voluntary human feedback are not established by a C4 pass. C5 should complete the local experience and assess those release gates honestly. Real user feedback remains necessary before C6/C7.

The next roadmap milestone exists: **C5 — Companion beta and polish**. Its [complete execution prompt](../c5-companion-beta/implementation-prompt.md) bounds the work to a consistent companion journey, preserved routes/contracts, accessibility and local acceptance, plus a read-only readiness assessment. No automatic source expansion, infrastructure work, release or C6/C7 is included.

Recommended implementation model: **GPT-6 Astra, Extra high (`xhigh`)**, a quality-first fit for exacting work across several pages and asynchronous state boundaries. The recommendation is a task judgment based on [OpenAI's model-selection guidance](https://developers.openai.com/api/docs/guides/model-selection) and [Astra's documented capabilities/effort settings](https://developers.openai.com/api/docs/models/gpt-6-astra), checked October 7. The owner's explicit model choice and execution instruction govern; no model setting was changed here.
