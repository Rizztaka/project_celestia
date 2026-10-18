# Genshin companion continuation checklist

## Documentation pass

- [x] Review project vision, roadmap, architecture, development and UI guidance.
- [x] Review every existing feature specification and ADR, plus authentication documentation.
- [x] Compare representative implementation paths with document claims.
- [x] Choose a bounded companion feature portfolio.
- [x] Update vision, roadmap, guidance, legacy scope notices, and decision record.
- [x] Preserve existing backend lint evidence and plan.
- [x] Save code-backed findings and implementation handoff.
- [ ] Implement product changes — outside this documentation pass.

## Implementation queue

- [x] Finish 3A backend lint coverage using its existing plan; see [validation handoff](../3a-backend-lint/walkthrough.md).
- [ ] Obtain Render live deployed SHA through existing authenticated access when available.
- [x] C1a: safe import scope and equipment relationships; see [walkthrough](../c1a-safe-imports/walkthrough.md).
- [x] C1b: provenance, freshness, and goal continuity; see [walkthrough](../c1b-import-provenance/walkthrough.md).
- [x] C2a: supported Asia clock, task cadences, explicit period writes; see current handoff for coverage limits.
- [x] C2b: bounded verified-data gate and unsupported states; focused review/corrections complete.
- [x] C3a: owned URL-addressable equipment read view; [local acceptance](../c3a-character-equipment/walkthrough.md).
- [ ] C3b: focus, priority and goal lifecycle, separately authorized.
- [ ] C3: focus characters, equipment detail, goal lifecycle.
- [ ] C4: Today and weekly plan.
- [ ] C5: beta, usability, navigation transition, operational review.
- [ ] Evaluate C6/C7 only after core-loop feedback.

No push, deployment, hosting creation, account-security reimplementation, or source-code change is included in the documentation pass.
