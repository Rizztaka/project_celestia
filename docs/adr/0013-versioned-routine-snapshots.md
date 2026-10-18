# ADR 0013: Versioned routine snapshots and explicit period writes

**Date:** 2026-09-30  
**Status:** Implemented locally; Asia clock evidence accepted and policy activated 2026-10-02. Not deployed.

## Context

Legacy companion reads created rows and reset flags. Independent daily and weekly writes had no shared revision, old daily flags could survive partial updates after reset, and defeated-boss flags did not establish reward claims. Legacy resin timestamps did not prove a manual observation.

The owner authorized Codex to continue Sonnet's interrupted C2a implementation. This decision implements the bounded [C2a plan](../plans/c2a-clock-task-reliability/implementation_plan.md), supersedes ADR 0009's read-time resets for routed daily/weekly functionality, and enforces ADR 0010 for indirect Planner reads too.

## Decision

- Add one user-owned `GenshinRoutineState`, independent of imports/accounts. Retain legacy tables without backfill. Display old values separately; never infer current resin, Transformer use time, or reward claims from them.
- Serve a complete, read-only V2 snapshot at `/api/v1/companion/routine?contractVersion=2`. The dedicated namespace is the chosen compatibility path. Retired daily/weekly GET and PATCH endpoints fail with `409 COMPANION_CLIENT_UPDATE_REQUIRED`; there are no V2 aliases at the old paths.
- Validate strict request schemas at the service boundary. Every mutation carries contract version and expected revision. Except settings, every mutation carries server selection and the current daily period, with the weekly period added for weekly claims. Null periods are valid for manual actions only while the selected clock is unavailable.
- Serialize all routine writes by locking the stable owner row in a PostgreSQL transaction, including first creation. Read stored state, sample one acceptance time after the lock, check revision/server/period, normalize expired daily and weekly state, apply the action, and increment revision once. Reject conflicts without automatic retries. Construct the response inside the transaction so projection/read failures roll back the write.
- Inject game-specific clock and projection behavior through `ICompanionProvider`. Platform orchestration does not import Genshin implementations. Unsupported or unselected servers provide no period metadata.
- Enable the fixed Asia policy after accepting the evidence recorded in [sources.md](../plans/c2a-clock-task-reliability/sources.md): official timezone/daily-mechanic text, in-game weekly rules, and the owner's explicit firsthand daily reset confirmation. Daily reset is 04:00 UTC+8; weekly reset is Monday at that time. Tests may explicitly disable availability or inject time; the application has no environment variable or HTTP clock override. No other server is enabled.
- Resin is explicitly unknown until manually recorded, including an explicit zero. The snapshot exposes its original checkpoint and server time so clients preserve partial regeneration ticks. Future or invalid checkpoints remain unknown.
- Transformer records last manual use only. Teapot is a daily reminder, not a capacity assertion. Weekly input is the user-confirmed aggregate reward-claim total, with null meaning unknown. The 1000 input ceiling is a storage limit, not a game allowance. No resin debit, material credit, per-boss advice, discount, or cooldown is inferred.
- The frontend uses one routine query/revision, confirmed responses, no optimistic rollback, no automatic mutation retry, and one local pending save. Older revisions/projections cannot replace newer data. Countdown time is anchored to server time and monotonic elapsed time. Focus, visibility, reconnect, and boundary refreshes restore authoritative state; local one-second ticks do not poll the API. The existing token-scoped QueryClient isolation is retained.
- Today Domains and Planner Intelligence reject unavailable clocks with actionable 422 errors; Planner also rejects unknown resin. Existing recommendation calculations remain unchanged.

## Consequences and release boundary

This intentionally rejects simultaneous different-field saves instead of silently merging them. Manual resin and Transformer records remain useful before import and while the clock is unavailable. Selected Asia enables daily/weekly completion and clock-dependent reads. Activation verifies timing only; C2b catalog trust and optional discount/cooldown evidence remain separate.

The migration is additive and was tested on a disposable loopback database, including a populated C1b schema upgrade. A future release needs separate authorization, backup, migration before the new API, and coordinated frontend/API cutover. Do not run old and new APIs as concurrent writers. Retain the new table on rollback; old code would hide new records and restore write-on-GET behavior. Prefer a forward fix or disabling affected routes over destructive reversal.

See the [walkthrough](../plans/c2a-clock-task-reliability/walkthrough.md) for validation and remaining gates.
