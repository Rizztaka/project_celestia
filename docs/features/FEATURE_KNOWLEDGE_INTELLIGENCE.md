# Feature: Knowledge Intelligence Engine (Milestone 4F)

## Overview
The **Knowledge Intelligence Engine** is the final module of the Phase 4 Intelligence Core. Unlike the other engines that focus on strict optimization and recommendations, this engine focuses on **Player Insights & Trivia**. 

It aggregates data across the entire account (Characters, Weapons, Artifacts, and Phase 3 progression) to generate personalized, fun, and insightful "Did you know?" facts about the user's account.

## Core Mechanics (Deterministic)
The engine runs a series of "Insight Analyzers" over the user's roster. Each analyzer checks a specific condition and, if met, generates an insight string. The service then randomly selects 3-5 insights to present to the user on a daily rotating basis (seeded by the current date and user ID).

### Insight Analyzers:
1. **The Hoarder**: Identifies if the user is hoarding a massive amount of artifacts but only has a few equipped.
2. **The Specialist**: Identifies if the user heavily favors a specific element (e.g., "70% of your fully leveled characters are Pyro").
3. **The Relic**: Identifies the user's oldest / lowest ID artifact that is still equipped on a character.
4. **The Powerhouse**: Identifies the character with the absolute highest raw stat (e.g., highest HP, highest ATK) based on main stats.
5. **The Unsung Hero**: Identifies a highly-invested 4-star character that outperforms the user's average 5-stars.

## Technical Architecture

- **`knowledge-intelligence.calculator.ts`**: Contains the pure logic for each Insight Analyzer.
- **`knowledge-intelligence.explainer.ts`**: Converts the mathematical results of the analyzers into fun, engaging trivia sentences.
- **`knowledge-intelligence.service.ts`**: Fetches all account data, runs the analyzers, and uses a seeded random number generator to pick the daily insights.
- **`knowledge-intelligence.controller.ts`**: Exposes `GET /api/v1/games/genshin/intelligence/knowledge`.

## Frontend Integration
- A new **Knowledge Tab** on the Intelligence Page, or a "Daily Insight" widget displayed prominently at the top of the Intelligence Page dashboard.
- Features a stylized, perhaps "Akasha Terminal" themed UI for delivering the trivia.
