# Release validation follow-up

The owner authorized pushing, merging and deploying the reviewed deterministic
migration and premium UI on 2026-10-22. PR #2 initially failed before running its
suite because the inherited C5 formatting guard still required the old UI entry
page, stylesheet and deleted starter CSS to retain their historical hashes.

The guard now keeps the sole unchanged historical document exception. Updated UI
source participates in normal formatting checks, and the AI/starter retirement
archives remain preserved. The existing regression verifies the remaining
exception and still rejects changed historical bytes. All 33 verification-harness
tests pass locally in the isolated release checkout. The two UI test reports were
formatted as JSON without changing their data. No product logic, schema or
account data is changed by this follow-up. Full remote CI must pass before merge.

The next full run passed 1,596 tests and exposed three legacy equipment-rendering
test failures. The harness now supplies the query provider required by source
descriptions and renders the progression header where talent semantics now live.
Assertions retain unknown/empty/opaque-data and session isolation coverage while
using the current copy. All six equipment client tests pass in isolation.
