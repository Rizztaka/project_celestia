# ADR 0011: Intelligence Engine Architecture (Calculator vs Explainer)

## Context
Phase 4 of Project Celestia introduces the "Intelligence Core," which analyzes user accounts to provide recommendations (e.g., Character priorities, Team compositions). Generating accurate, trustworthy, and actionable recommendations requires complex logic. If not properly structured, this logic can quickly become a tangled mess of arbitrary heuristics and hardcoded strings, making the system difficult to test, debug, and expand. 

Furthermore, the user must understand *why* a recommendation was made. A black-box AI or arbitrary scoring system violates the core principle of Celestia: "explainable, personalized recommendations."

## Decision
All Intelligence Engines within Phase 4 will adhere to a strict **Calculator vs Explainer** separation pattern:

1. **The Calculator (Pure Math & Logic)**
   - Responsible entirely for scoring, ranking, and classifying data.
   - Must be a **pure function**: deterministic, zero side-effects, and relying solely on passed inputs. No RNG or external API calls (e.g., LLMs).
   - Returns a structured numeric breakdown (e.g., `ScoreBreakdown` containing individual sub-scores) and enums/labels.
   - **Must never generate strings** meant for human reading.

2. **The Explainer (Translation to Human Context)**
   - Responsible entirely for translating the `ScoreBreakdown` into human-readable rationale.
   - Must be a **pure function** mapping numbers and labels to strings.
   - **Must never perform arithmetic scoring** or alter the ranking logic.
   - Explanations must use concrete numbers from the user's data (e.g., "Level 60 but Ascension 2").

3. **The Orchestrator (Service)**
   - The Service layer fetches necessary state from the database, runs the data through the Calculator, passes the results to the Explainer, and returns the final JSON to the Controller.

## Consequences

**Positive:**
- **Testability**: Pure functions without side-effects or external dependencies are trivial to unit test, ensuring the engine remains mathematically accurate as the game evolves.
- **Maintainability**: Changing how a score is calculated does not break the explanation logic, and updating the tone of an explanation does not risk breaking the recommendation sorting.
- **Trust**: Users see exactly how their account data influenced the recommendation, building trust in the platform.

**Negative:**
- Requires writing boilerplate interfaces to bridge the Calculator and Explainer.
- Slight redundancy in passing character state to both functions.
