# Deterministic build insights — owner-directed migration, 2026-10-22

The owner explicitly requested removing AI entirely and asked for implementation
in this chat. This supersedes all pending model evaluation/promotion instructions.
No further provider tests, model setup, quota waits or AI acceptance runs apply.

Implement now:

1. Remove provider clients, SDK, active chat UI/routes/config and model evaluation
   tooling. Preserve retired source/test bytes under this plan as historical .raw
   files. Preserve all pinned data, licenses, profile descriptions, source/release
   history and unrelated work. Never read or print local secret values.
2. Add an authenticated read-only build-insights module using the existing
   equipment repository and hash-validated profile references for the full catalog.
   Separate typed pure evaluation from explanations. Apply the existing ADR 0011
   score-free applicability extension; do not invent a ranking/score.
3. Show automatic recorded-equipment insights and optional hypothetical weapon
   comparison. Shared typed rules initially cover compatibility, artifact piece
   bounds, Harbinger HP gating and known artifact activation conditions. Every
   unsupported item retains its complete sourced description and explicit modeled
   coverage gap. Unknown combat events/refinements stay unknown. No questionnaire,
   fake chat, auto-equipping, global best-build claim or damage/ER solver.
4. Replace both character/team chat entry points, preserve descriptions/unlocked
   appearance and ownership/session boundaries. Retain existing deterministic
   companion engines; do not present their heuristic scores as verified optimums.
5. Test useful deterministic completions, thresholds/unknowns/source drift,
   incompatible weapons, incomplete/invalid equipment, unowned characters, all
   catalog references, comparison isolation, read-only/auth behavior and zero
   model runtime dependencies. Run affected types/build/lint/tests and UI checks.

Future coverage expands through reviewed typed rules and source diffs, not regex
execution of guide prose. Rule/source versions and explicit coverage make scope
auditable. Determinism makes behavior reproducible; verified rules and independent
fixtures establish correctness. This milestone does not promise a complete Genshin
combat simulator or all-character strategy optimization.
