---
name: reverse-engineer-anything
description: Guides AI agents (Gemini, Claude, Codex) in using REA (Reverse Engineer Anything) to analyze external Genshin applications, web apps, electron bundles, and binaries to extract verifiable architecture and logic for Project Celestia.
---

# Reverse Engineer Anything (REA) Protocol for Project Celestia

Use this skill whenever you need to deconstruct an external tool or community project (e.g., Seelie.me, Paimon.moe, Genshin Optimizer, Canvas-Genshin-Maps, InventoryKamera) into evidence-backed logic for Celestia.

## 1. Core Principles: Evidence Provenance

REA enforces strict truthfulness:
- **Seen**: Explicitly extracted from AST, code, network traces, or decompilation.
- **Guessed**: Inferred by the model from heuristics. Must be marked as an assumption.
- **Unknown**: Missing or inconclusive data. Never hallucinate defaults.

This matches Celestia's rules in `.agents/rules/architecture.md` and `.agents/skills/build-intelligence-engine/SKILL.md`.

## 2. Using REA Tools

Use the official [morluto/rea](https://github.com/morluto/rea) source and pin the inspected CLI version. Check its package `engines` and the actual runtime first. REA 6.5.0 requires Node `^22.19.0 || ^24.11.0 || >=26.0.0`; this checkout's Node 22.14.0 is unsupported. On this Windows machine it falsely differed between path and handle device IDs. The same input passed under Node 24.11.0 with integrity policy `fail`.

The commands below use an isolated supported runtime without changing Celestia's dependencies, system Node or agent configuration. Recheck each subcommand's `--help` before using a different version. Do not run `rea setup` as a prerequisite for static CLI analysis. Never bypass an integrity failure to obtain a successful result; first check runtime support, input hashes and stable file identity.

### A. JavaScript / Web / Electron Application Analysis
For extracted web bundles, node modules, or unpacked Electron `.asar` files:
```powershell
pnpm --package=node@24.11.0 --package=rea-agents@6.5.0 dlx rea analyze-javascript-application "<absolute-app-directory>" --source-path "<relative-selected-source.js>" --analysis-timeout-ms 30000 --format json
```

### B. Retained Network Capture Inspection
To inspect a locally recorded capture without fetching its URLs or guessing API contracts:
```powershell
pnpm --package=node@24.11.0 --package=rea-agents@6.5.0 dlx rea inspect-web-network-capture "<absolute-recording.har>" har --format json
```

### C. SQLite / Cache Database Extraction
For local client databases (such as desktop companion SQLite caches):
```powershell
pnpm --package=node@24.11.0 --package=rea-agents@6.5.0 dlx rea inspect-sqlite-database "<absolute-db.sqlite>" --format json
```

## 3. Translating REA Findings into Celestia Modules

Once REA reveals the mechanics, translate them into Celestia's architectural layers:

1. **Pure Calculator (`<feature>.calculator.ts`)**:
   Implement pure mathematical functions (e.g., drop rate formulas, 2-opt coordinate heuristics, 3-to-1 crafting conversions). Zero UI dependencies.
2. **Explainer (`<feature>.explainer.ts`)**:
   Produce human-readable reasoning from calculator results.
3. **Service & Repository (`<feature>.service.ts`)**:
   Orchestrate owned reads and calculations. Add persistence only when the feature needs an explicitly authorized write; preserve transaction isolation.
4. **React & TanStack Query**:
   Expose through clean API contracts in `packages/api-contracts` and query hooks in `apps/web`.

## 4. Multi-Agent Hand-off with REA
- **Gemini**: Executes REA analysis on the target, synthesizes the verified findings, and documents them in `docs/plans/<feature>/implementation_plan.md`.
- **Claude**: Reads the implementation plan, writes the pure TypeScript calculators, React components, and Vitest test suites.
- **Review**: Tests the implemented calculations and boundaries. Distinguishes runtime observations from source-derived findings and explicitly labeled modeling assumptions; records missing evidence. Passing tests do not establish that upstream data is current or that human acceptance occurred.

These are manual handoff roles, not an instruction to spawn agents. Apply only relevant findings to the owner's requested scope; analysis does not require copying an external application's design, assets or unnecessary capabilities.
