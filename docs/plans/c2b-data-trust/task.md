# C2b implementation checklist

Started 2026-10-02 by Codex in the existing local checkout. Preserve C2a and unrelated work; no migration, commit, deployment, or C3 work.

- [x] Read the current handoff, C2b plan, C2a evidence/walkthrough, companion direction, ADRs 0012/0013, and C1b/import contract; inspect existing diff.
- [x] Inventory ten catalogs and advice consumers; record exact source coverage and gaps.
- [x] Implement typed validation, field/range evidence and dependency fingerprints.
- [x] Guard material, Today, Planner calculator, event and weekly advice; preserve routine/import behavior.
- [x] Represent each excluded goal and unknown imported stock; include every supported upgrade cost.
- [x] Verify independently derived counts, malformed catalogs/joins, stock uncertainty, SELECT-only reads and regressions.
- [x] Run direct full Vitest with guarded disposable PostgreSQL, lint, builds/types, changed-file formatting and preservation checks.
- [x] Verify actual browser flows, stop temporary services, write walkthrough and update CURRENT_HANDOFF.

Positive-example acceptance passed: official HoYoLAB calculator responses independently establish all three HuTao base talent selections from 1–6. The browser and tests show the sourced costs, including Mora. Ascension, other candidates and farming routes remain unavailable. See [sources](sources.md) and [walkthrough](walkthrough.md); no whole-patch coverage is claimed.
