# C5c follow-up review and next-step decision

Review completed 2026-10-13; source checks and fresh verification ran 2026-10-12
in the existing dirty D: master checkout, HEAD
`2d8820a48db83d7c62feebd849f2f1c2d3488bb6`, empty index.

**No new blocking application-code finding was identified in the reviewed scope.
C5c is suitable for the next bounded local engineering milestone. Production
release and beta invitations remain gated.**

## Scope and findings

Reconciled the C1–C5c roadmap, current handoff, companion specification, prior
reviews and outstanding readiness gates. Reviewed the C5c policy and application
composition, domain route wiring, parser/error handling, token buckets and identity
normalization, memory/concurrency/abort lifecycle, GOOD resource/schema/service
guards, bounded repository snapshots, unit/composed HTTP/PostgreSQL tests and
synthetic browser helper/evidence. Inspected current auth, user-profile and
Settings/session boundaries to choose the next phase.

The review found no route to a large import parser before authentication, no
preview/commit budget split, no active-penalty eviction, and no release of a permit
while an awaited service operation is still running. Input and inherited-snapshot
limits reject overflow instead of silently truncating state. Counter capacity,
single-process/restart/shared-peer behavior and slow-upload limitations are
documented rather than represented as provider protection.

This is a follow-up source/evidence review with fresh whole-suite regression
verification, not a new line-by-line audit of every historical feature, a separate
reviewer/model, external security certification, accessibility sign-off or human
usability study. No application, schema, contract, dependency or tooling source
was changed. Historical browser evidence was reviewed, not repeated.

## Fresh validation and fixture finding

At review start, all **47 C5c changed-file manifest entries**, **26 preservation
entries** and **seven raw evidence captures** matched their hashes. The
[starting record](review-starting-state.json) captures all 846 repository files
before review additions; normal environment contents were not read.

The first unchanged recovery command failed before migrations or application
tests, during fresh-resource setup. The historical stopped C5b fixture reported
missing PostgreSQL internal catalog files `global/6100` and `base/4/4171`.
The cause of those missing files is not established. Its safe
[failed result](review-initial-recovery-failure.json) records successful cleanup
and stopping its exact owned process. The old directory, descriptor, source and
historical reports were not repaired, deleted or rewritten.

A first attempt to initialize a replacement using an ambient subprocess
environment failed the existing private-ACL guard before initialization. The
helper removed its still-empty newly allocated directory. Using the recovery
tool's existing isolated-environment function passed that same guard; no guard
or permission check was weakened.

A **new separate synthetic fixture** was initialized with installed PostgreSQL
18.4, verified current-user-only Windows ACLs, loopback binding and fresh system
identity. [Provenance](review-fixture-provenance.md) and
[descriptor](review-fixture.json) identify its retained stopped directory. The
unchanged real command then passed:

```powershell
$env:NODE_ENV = 'test'
$env:DOTENV_CONFIG_PATH = 'NUL'
pnpm run recovery:rehearse --fixture 'D:\Genshin Personal\project-celestia\docs\plans\c5c-request-safety\review-fixture.json' --verify
```

- **950 tests / 51 files**, zero failed/skipped; **113 actual PostgreSQL cases**.
  The unchanged historical verifier classifier still reports its six suites / 106
  cases; the seven C5c cases are separately confirmed in the raw test report.
- All twenty application tables / 46 seeded rows, thirteen migration receipts,
  metadata and 214 constraints matched after restore. Thirty authenticated/denial
  HTTP requests, 27 checks and 39 SELECTs passed. Source and restore snapshots
  remained unchanged by reads and the separate verification database.
- Shared/API/web types/builds, API/web lint, guarded migrations/schema validation
  and diff, repository formatting/integrity and diff checks all passed through
  the preserved full entry point. Total rehearsal duration: **181,631 ms**.
- Fresh source/restore/verification databases, roles and tablespaces were removed;
  generated credentials were removed; the exact owned process stopped. Final
  exclusive loopback binds verified ports 55448, 45448 and 45449 available.
  Private synthetic archives/logs and the stopped replacement cluster remain
  outside Git. No ordinary database or production account was used.

See [fresh recovery evidence](review-recovery-results.json),
[entrypoint results](review-entrypoint-results.json),
[safe test counts](review-test-results-summary.json) and
[review preservation/cleanup](review-validation.json). Raw Vitest output remains
private because inherited test names can contain synthetic database URLs.

**Reproduction note:** older C5a/C5b/C5c commands and the historical C5c browser
helper point to the old fixture. The browser helper hardcodes that descriptor;
it does not automatically use the replacement. Use the explicit review fixture
for recovery. A future browser harness must explicitly select and verify the new
fixture. The retained historical browser acceptance remains evidence of its
original successful run, not a claim that its old fixture is healthy now.

## Next bounded phase: C5d account-data controls

Current `platform/users/user.routes.ts` exposes an own-profile GET, while Settings
has profile/routine links but no export/delete workflow. `requireAuth` verifies
JWT signatures/expiry/subject without querying subject existence. This is
consistent with the current absence of account deletion, but a deletion feature
must also close stale-token and concurrent-write resurrection paths.

Recommend **C5d: account export and deliberate deletion**, within the existing
C5 account-data readiness gate. The [complete execution prompt](../c5d-account-data/implementation-prompt.md)
defines versioned self-only export, current-password confirmation, transactional
active-data deletion, deleted-subject denial, bounded expensive work, exact
other-owner preservation and real database/browser race tests. It preserves
retained NIKKE/history data and distinguishes a Celestia export from GOOD or a
restore promise. C5d is proposed and **has not started**.

This is a concrete remaining engineering gap; adding C6/C7 now would bypass the
roadmap's real-use evidence requirement. No new product direction is necessary
to complete this account-data foundation. Broader direction should be discussed
before optional saved teams/journal/events/savings expansion.

## Settings and remaining gates

Use **GPT-6 Astra / Extra high (`xhigh`)**, as shown in the screenshot. It is a
quality-first recommendation for ownership, reauthentication, all-table deletion
and concurrency requirements, consistent with current
[official model-selection guidance](https://developers.openai.com/api/docs/guides/model-selection).
It is not a benchmark claim or a claim that maximum effort is always preferable.
Keep **This computer**, turn **New worktree off**, use the same D: checkout and
one agent in implementation mode. No custom environment setup is needed for the
installed workflow. A new chat can use the complete prompt; none was created.
No permissions or other app settings were changed.

Keeping the checkout avoids transferring this substantial uncommitted state and
recreating installed dependencies/fixture context. Current
[official worktree documentation](https://learn.chatgpt.com/docs/environments/git-worktrees)
does support applying selected-branch uncommitted changes; that is not the reason
to rule out worktrees universally.

The [readiness assessment](beta-readiness.md) remains the release boundary:
actual ingress/proxy policy and deployed origins/CI; production backup operator,
access/retention/cadence/RPO/RTO and representative restore; account recovery and
broader token/backup erasure procedures; accessibility; accountable source upkeep;
and voluntary human feedback remain open. C5d will address only its stated
application-data slice. No beta invitations, C6/C7, staging, commits, pushes,
deployment or remote CI were performed.
