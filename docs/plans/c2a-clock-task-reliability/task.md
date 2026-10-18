# C2a implementation checklist

Updated 2026-10-02. Sonnet began implementation; Codex completed the interrupted phase at the owner's explicit request. **C2a implementation and local acceptance complete; selected Asia enabled.** Read [walkthrough.md](walkthrough.md) for exact evidence and limits. Independent review/release are separate.

- [x] Read current handoff, linked walkthroughs, accepted plan, review, and Sonnet's pasted progress; preserve pre-existing work and baseline hashes.
- [x] Accept and attribute the complete Asia timing evidence: official notice, current weekly screenshot, and the owner's explicit firsthand daily reset confirmation. Record the limits of the retrospective observation.
- [x] Verify Asia timezone and weekly timing from the owner's October 1 in-game screenshots (Asia, build 7.1.0, Monday 04:00 GMT+8); record source references and hashes.
- [x] Record the owner's explicit confirmation of daily commissions at 04:00 UTC+8 / 01:30 IST from overnight play; do not mislabel commission help screenshots as exact timing evidence.
- [x] Keep production clock-dependent actions unavailable while that gate remains open; keep weekly discount/cooldown advice unavailable.
- [x] Document ADR 0013 and the dedicated strict V2 API; fail all retired endpoints closed.
- [x] Add the user-owned routine table and constraints without legacy backfill or destructive migration.
- [x] Implement injected provider projections and SELECT-only reads, including Today Domains and Planner Intelligence.
- [x] Implement owner-locked revision/period-aware writes, atomic first creation, and stale sibling normalization.
- [x] Migrate daily/weekly Planner UI: explicit server selection, unknown/zero resin, manual Transformer record, aggregate claim editor, and read-only legacy summary.
- [x] Implement one shared cache/revision, serialized local saves, visible conflicts, no automatic write retry, monotonic time, and boundary/focus/reconnect refresh.
- [x] Preserve auth-session cache isolation and independent supporting-panel failure behavior.
- [x] Add service/HTTP/client-helper/indirect-consumer tests plus PostgreSQL concurrency, rollback, SELECT-only, constraints, migration upgrade, and import isolation cases.
- [x] Include routine integration tests alongside import integration tests in CI configuration. No remote CI run is claimed.
- [x] Run direct full Vitest with the guarded disposable database; run uncached lint/types/builds and formatting checks.
- [x] Check actual browser flows: unknown/zero resin, selected-but-unverified clock, manual use, weekly unknown/disabled editor, visible stale-save conflict, legacy display, and mobile layout.
- [x] Exercise the enabled daily/weekly UI in an isolated injected-clock fixture: confirmed partial flags, zero/unknown weekly totals, automatic Sunday-to-Monday rollover, and retained manual observations. This is not game-source evidence.
- [x] After source acceptance, enable the production-default provider and verify browser flows across exact reset boundaries with a controlled test clock: both Monday rollover and daily-only rollover. No availability override; no live elapsed-time reset observation claimed.
- [x] Recheck protected hashes; preserve unrelated AI/environment/dependency changes and the Turbo test log.
- [x] Write the implementation walkthrough and update current handoff, ADR, API, and relevant feature status notes.
- [x] Prepare the bounded C2b implementation plan/prompt and next-phase model/effort recommendation, without implementing C2b.
- [ ] Separate release work: independent reviewer acceptance, any live overnight observation, and an explicitly authorized release. No push/deployment/production migration has been performed.
