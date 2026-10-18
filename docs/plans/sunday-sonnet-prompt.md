# Implementation continuation — C2b data trust

The owner authorized Codex to finish Sonnet's interrupted C2a implementation. C2a is now complete locally: the Asia source gate is accepted, the production-default clock is enabled, and controlled-time browser acceptance passed. No push or deployment occurred.

For the next implementation, use the [bounded C2b plan](c2b-data-trust/implementation_plan.md) and [copyable implementation prompt](c2b-data-trust/implementation-prompt.md). Recommended implementation model: GPT-6.1 Sol with High effort. Read [CURRENT_HANDOFF](CURRENT_HANDOFF.md) first.

An independent C2a review can still inspect strict contracts, owner locking, shared revisions, reset normalization, rollback, SELECT-only reads, unknown resin, frontend ordering, and session isolation using the [walkthrough](c2a-clock-task-reliability/walkthrough.md). The browser acceptance used controlled test time; it does not claim a newly observed live overnight game reset.

Weekly discount and Transformer cooldown remain separate evidence gates. C2b is prepared, not implemented. Do not repeat the V2 migration, broaden the catalog, or start C3.

Preserve the mixed dirty tree and all eight hashes in [preservation-check.json](c2a-clock-task-reliability/preservation-check.json). No reset, clean, staging, commit, push, deployment, production migration, or optimizer work. Use only a guarded disposable loopback database for integration tests.
