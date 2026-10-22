# Commit readiness — 2026-10-22

Ready for the owner-authorized local commit. The exact proposed Git index was
materialized in a separate checkout and installed using the frozen lockfile.
No untracked source, working-tree build outputs or local secrets were reused.

The commit removes the model runtime and introduces deterministic build insights,
including the profile-reference contracts, presentation and 446-file catalog it
needs. The optional hand-authored KQM guide reader, source-acquisition drafts and
unrelated NIKKE/schema/account-data removal remain outside this commit. Mixed
files were staged selectively; their other working changes are preserved.

All **97 tests across eight files** pass with zero skipped tests, using one worker
and explicit synthetic settings. Contracts build, API/web production builds, web
types, and full API/web/contracts lint pass. The initial concurrent test attempt
hit catalog-scan timeouts and lacked admission-test environment settings; the
complete focused rerun passed after isolating execution and providing synthetic
settings. No production behavior was changed to accommodate those failures.

The tests cover rule boundaries, unknown states, source drift, all 129 catalog
entries, HTTP authentication/validation, private-field minimization, hypothetical
isolation, profile rendering/session handling, real Git byte preservation and all
39 archived source hashes. See `exact-commit-tests.json` and `commit-review.json`.

Fixed the obsolete model comment in the deployment example and pinned retirement
archives to exact bytes in Git attributes. Changed authored text is formatted;
immutable catalog and archived bytes retain their verified hashes.

This approves the disclosed first rule set, not a complete strategy optimizer.
Live account/database acceptance, pushing and deployment are not part of this
commit request. The preceding synthetic browser evidence remains in the walkthrough.
