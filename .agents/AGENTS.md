# Global Multi-Agent Handoff Protocol

This workspace operates using a manual, multi-model orchestrated workflow between Gemini, Claude, and ChatGPT.

## Agent Roles
- **Gemini**: Acts primarily as Architect, Researcher, and Reviewer. Responsible for deep context planning, architecture enforcement, and code review.
- **Claude**: Acts primarily as Implementer. Executes the technical plan, focusing on precision, UI aesthetics, and strict adherence to the architecture.
- **ChatGPT**: Acts as an independent architecture, review, and prioritization reviewer.

## The Weekly Workflow
- **Monday–Saturday**: Planning phase. Architecture, research, planning, audits, and breaking down milestones.
- **Sunday**: Implementation phase. One Sunday represents one coherent milestone, not an arbitrary collection of unrelated tasks. Every important implementation should include appropriate tests in the same implementation cycle.

## The Artifact Handoff Rule
To ensure zero context is lost when the human orchestrator switches models in the IDE, all inter-agent communication MUST be persisted via artifacts.

1. **Planning to Execution (Gemini -> Claude)**: 
   Gemini will always write a detailed `implementation_plan.md` (and a `task.md` checklist) to the artifact directory. **Claude**: When you are invoked, you MUST read the `implementation_plan.md` before writing any code.

2. **Execution to Review (Claude -> Gemini)**: 
   When Claude finishes execution, Claude MUST write a `walkthrough.md` artifact summarizing what was done, what was tested, and any edge cases. **Gemini**: When you are invoked for review, you MUST read `walkthrough.md` to verify the execution.

**Always check the artifacts directory for the latest state of the workflow.**

## MCP Configurations & Permissions
- **github-mcp-server**: Keep, but restrict permissions appropriately. Do not use for destructive actions without explicit user consent.
- **postgres-mcp-server**: Keep, but NEVER connect it to production with unrestricted write access. Agents must not have unrestricted production DB access.
- **prisma-mcp-server**: Keep for local schema management and migrations.
- **supabase-mcp-server**: Keep, but restrict production access. 
- *Note: Production secrets must never be unnecessarily exposed to AI agents.*
