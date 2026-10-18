# C5 review and next-step decision

Reviewed 2026-10-09; handoff finalized 2026-10-10 in `D:\Genshin Personal\project-celestia`, on dirty `master` at `2d8820a48db83d7c62feebd849f2f1c2d3488bb6`, with an empty index. This review changed documentation/evidence only.

**Decision: the bounded C5 companion journey has no blocking regression identified in this review. The product is not ready for beta invitation or release. Close the concrete verification and origin-policy findings below before expanding the product.** The proposed next engineering slice is [C5a — reproducible verification and origin hardening](../c5a-beta-foundation/implementation-prompt.md), prepared for owner execution, not started. C6/C7 remain gated on actual beta feedback.

## Findings

### R1 — High priority: CI cannot establish the current database regression baseline

`.github/workflows/ci.yml:72–86` first runs the root Turbo test command with a placeholder database and no disposable-test variable. Database suites can therefore skip. Its later integration step selects only importer and routine suites and supplies only `CELESTIA_TEST_DATABASE_URL`. The guard in `apps/api/src/core/db/disposable-test-database.ts:13–15` requires a matching `DATABASE_URL`, `NODE_ENV=test`, and disabled dotenv loading. Even granting Vitest's test-mode default, the remaining required values are absent. The migration step also runs before any explicit guard and disables no dotenv file.

A direct call to the actual compiled guard with the integration step's supplied values (plus test mode) rejected that configuration. This is a locally reproduced configuration defect, not an observed GitHub Actions run. The current workflow cannot prove that all six PostgreSQL suites pass. Root formatting also conflicts with the five known preserved exceptions; a replacement verification path must account for those explicitly without weakening general coverage.

Required resolution: one reproducible, guarded path for the complete suite and CI, with matching isolated variables before migration/application imports, all six PostgreSQL suites, zero skipped tests, and direct package checks that preserve the local Turbo log. Preserve the database guard itself. See `review-boundary-probes.log`.

### R2 — Medium priority, before external beta: CORS accepts unrelated origins

`apps/api/src/app.ts:30–42` uses substring matches for `localhost`, `127.0.0.1`, and `vercel.app`. Local Supertest requests against the actual compiled application returned HTTP 200, reflected `Access-Control-Allow-Origin`, and `Access-Control-Allow-Credentials: true` for all of:

- `https://localhost.attacker.example`
- `https://vercel.app.attacker.example`
- `https://unrelated.vercel.app`

An unrelated `https://safe.example` was rejected as a generic HTTP 500. These probes called only the local health endpoint, without tokens or real accounts. They prove an origin-policy bypass, not authentication bypass or data theft: this application uses explicit bearer tokens and the malicious page does not thereby acquire a user's token.

Required resolution: explicitly configured exact origins, carefully bounded local development behavior, deliberate absent/null-origin and preflight behavior, and HTTP regression tests for lookalikes, arbitrary preview domains, schemes and ports. Reject ordinary disallowed origins without misclassifying them as unexpected server failures. Configuration and cutover must be documented; no production origin or deployment configuration was inspected. See `review-boundary-probes.log`.

Both findings concern inherited beta foundations already flagged by C5's readiness assessment. They are not regressions attributed to the new navigation.

## What this review established

- Fresh direct run: **708 passed / 44 files / 106 PostgreSQL cases**, no failed or skipped tests, **83.34 seconds**, started 21:02:52 Asia/Calcutta. Six database suites: plan 28, goal lifecycle 28, routine 12, equipment 13, importer 16, catalog advice 9. Full output: `review-direct-test.log`. Existing overlapping-query deprecation remains visible.
- At review entry, reverified all eight protected hashes, thirteen migration hashes, five formatter-exception hashes, twenty-one final changed-file hashes and four new-code hashes. Across the 455-file pre-C5 baseline, 434 remained unchanged and 21 matched intentional C5 changes; no unexpected changes were found. The only subsequent edit to that baseline is the review banner in CURRENT_HANDOFF.md. Final preservation details are in review-validation.json; HEAD and index remain unchanged.
- Inspected route/layout and focus behavior, URL filters and missing-record handling, query caller signal propagation, retained-data/error presentation, account cache/session boundaries, Today refresh handling, and the preserved owner-lock/read-only projection boundaries. Searched all callers of the eight changed read functions; each passes its signal through a query-function adapter.
- Reconciled the C1–C4 preservation contracts and C5 walkthrough, acceptance, readiness, validation and roadmap. The fresh complete suite exercises the accumulated backend/client regression baseline. This was not a new line-by-line audit of every legacy feature.
- Prior C5 lint/build/schema checks and browser evidence were reviewed and tied to matching source hashes; they were not rerun or recaptured in this review. This review adds a fresh complete test run and local boundary probes, not a new browser or accessibility certification.

Only the existing owned disposable PostgreSQL fixture was restarted. Its path, owner, PostgreSQL version, loopback port and startup arguments were verified first. Matching test URLs, test mode, disabled dotenv and synthetic secrets were set; the guard ran before application imports. No normal database, provider console, deployment, remote CI, real account or human participant was accessed. Cleanup and final hashes are recorded in `review-validation.json`.

## Gates that remain open

Actual 200%/400% browser zoom, rendered OS reduced-motion behavior and assistive-technology checks remain unverified. Narrow viewport evidence is not zoom evidence. A voluntary script is not real-player usability evidence.

Recovery/restore evidence, account recovery/export/deletion handling, abuse controls, named data upkeep ownership, coordinated migration/client cutover and the deployed SHA remain missing or operationally unverified as described in [beta-readiness.md](beta-readiness.md). No repository rate limiter was found on the inspected API routes; edge controls were not inspected. This review does not infer their absence outside the repository or prescribe an auth rewrite.

Keep the current scope: selected Asia clock only; narrow verified HuTao talent costs; production farming routes unavailable; no auto-completion from imports; unknown stock distinct from zero; focus independent from lifecycle; explicit session/revision/reset-safe writes. None of these constraints is waived by the passing tests.

After C5a, assess the remaining readiness gates and perform separately authorized beta validation. Choose C6 saved teams/journal or C7 events/savings only when actual usage evidence and data-maintenance capacity justify it. No product feature phase is automatically approved by this review.
