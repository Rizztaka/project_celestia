# Project Celestia documentation

Start with [CURRENT_HANDOFF](plans/CURRENT_HANDOFF.md) for implemented status, then [Project Vision](PROJECT_VISION.md), [Roadmap](ROADMAP.md), and [Genshin Companion](features/FEATURE_GENSHIN_COMPANION.md) for product direction. C3a [equipment API](api/character-equipment.md) and [acceptance](plans/c3a-character-equipment/walkthrough.md) record the latest local slice; C3b remains separate.

## Current direction and precedence

The owner selected a Genshin companion focus and delegated feature selection in September 2026. Equipped artifacts and inventory remain; artifact optimization is excluded.

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
