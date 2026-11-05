# Project Celestia documentation

Start with [CURRENT_HANDOFF](plans/CURRENT_HANDOFF.md) for implemented status and the
[autonomous companion plan](plans/autonomous-companion/implementation_plan.md) for
the owner's 2026-10-25 goal, code audit, delivery order and acceptance criteria.
[Project Vision](PROJECT_VISION.md) and [Roadmap](ROADMAP.md) record its precedence
over historical scope. Run `pnpm companion:status` for local data/engine/advice
coverage; the report does not certify live-patch completeness.

## Current direction and precedence

The owner now wants an autonomous endgame companion with build assessment,
damage-based team generation, content-specific teams, account-value pull advice
and a fun simulator. Verified knowledge through version 7.1 and player convenience
are explicit requirements. Earlier exclusions of these features are superseded.
Existing equipment, inventory, goals and deterministic calculations remain useful
foundations. A global artifact optimizer is not required by this goal.

For product scope, the current vision, roadmap, and companion specification supersede older feature ambitions. For engineering, retain the architecture and applicable ADRs, including the explicit September amendments. Current code describes implemented behavior; a target specification does not make that behavior shipped.

- [Architecture](ARCHITECTURE.md)
- [Development guide](DEVELOPMENT_GUIDE.md)
- [UI/UX guidelines](UI_UX_GUIDELINES.md)
- [Feature specification process](FEATURE_SPECIFICATIONS.md)
- [Decisions](DECISIONS.md)
- [Companion direction ADR](adr/0012-genshin-companion-direction.md)
- [Authentication and completed security milestone](api/authentication.md)
- [Document review and code evidence](plans/genshin-companion/document_review.md)
- [Companion implementation handoff](plans/genshin-companion/implementation_plan.md)
- [Companion checklist](plans/genshin-companion/task.md)
- [Immediate 3A backend lint handoff](plans/3a-backend-lint/implementation_plan.md)

Historical feature documents preserve earlier contracts and milestone reasoning. Their September scope notices explain how to reuse them; their old phase numbers, unchecked boxes, placeholder mechanics, and proposed extensions are not the current work queue.

Owner's schedule (updated 2026-09-26): Codex implements on days other than Wednesday/Sunday. On Wednesday and Sunday, Antigravity's Sonnet 4.6 implements, with Codex providing architecture, planning, and review. The owner starts a fresh conversation for each Wednesday/Sunday session. Read [the current handoff](plans/CURRENT_HANDOFF.md) first; do not infer completion from prior chat history. This supersedes older schedule and model-role guidance.
