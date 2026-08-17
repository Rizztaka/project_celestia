# Global Multi-Agent Handoff Protocol

This workspace operates using a manual, dual-model orchestrated workflow between Gemini (Lead Architect) and Claude Sonnet (Precision Implementer).

## The Artifact Handoff Rule
To ensure zero context is lost when the human orchestrator switches models in the IDE, all inter-agent communication MUST be persisted via artifacts.

1. **Planning to Execution (Gemini -> Claude)**: 
   Gemini will always write a detailed `implementation_plan.md` (and a `task.md` checklist) to the artifact directory. **Claude**: When you are invoked, you MUST read the `implementation_plan.md` before writing any code.

2. **Execution to Review (Claude -> Gemini)**: 
   When Claude finishes execution, Claude MUST write a `walkthrough.md` artifact summarizing what was done, what was tested, and any edge cases. **Gemini**: When you are invoked for review, you MUST read `walkthrough.md` to verify the execution.

**Always check the artifacts directory for the latest state of the workflow.**
