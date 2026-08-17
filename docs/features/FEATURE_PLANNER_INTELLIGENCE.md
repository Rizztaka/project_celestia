# Feature: Planner Intelligence Engine (Milestone 4D)

## Overview

The Planner Intelligence Engine is the fourth component of the Intelligence Core (Phase 4). Its purpose is to optimize the player's daily resin usage by cross-referencing their active `UpgradeGoal`s (Phase 3B), today's open domains (`domain-schedule.json`), and the character priority weights from the `CharacterIntelligenceService`.

## Endpoint

`GET /api/v1/games/genshin/intelligence/planner`

### Request Payload
None. Uses the authenticated user's ID to fetch data.

### Response Schema
```json
{
  "success": true,
  "data": {
    "currentResin": 160,
    "timeUntilCapped": "5h 20m",
    "route": [
      {
        "goalId": "uuid-of-upgrade-goal",
        "targetKey": "HuTao",
        "goalType": "CHARACTER_TALENT",
        "domainName": "Taishan Mansion",
        "resinCost": 80,
        "runs": 4,
        "explanations": [
          "Farm Taishan Mansion today because Hu Tao's talent books (Teachings of Diligence) are available.",
          "Hu Tao is your #1 build priority (Score: 32/100)."
        ]
      }
    ],
    "unallocatedResin": 0,
    "analysedAt": "2026-08-17T12:00:00Z"
  }
}
```

## Architectural Rules (ADR-0011)

The engine must strictly separate calculation logic from explanation string generation.

### 1. The Calculator

**Input:**
- User's `UpgradeGoal` array.
- Projected `resinAmount` from `DailyCompanion`.
- Current day of the week (0=Mon, 6=Sun) based on UTC.
- `IntelligenceResponse` from `CharacterIntelligenceService`.

**Logic:**
1. **Filter Valid Goals**: Iterate through `UpgradeGoal`s. Determine if the goal can be progressed today.
   - `CHARACTER_ASCENSION`: Bosses are available every day. (Valid)
   - `CHARACTER_TALENT`: Lookup the required book in `character-materials.json`. Check if the book drops today according to `domain-schedule.json`. (Valid if true, or if Sunday).
   - `WEAPON_ASCENSION`: Lookup required material in `weapon-materials.json` and check `domain-schedule.json`. (Valid if true, or if Sunday).
2. **Score Valid Goals**:
   - `baseScore` = 50.
   - `timeGatedBonus` = +20 if it's a Talent/Weapon domain (since they are only open 3 days a week, they take priority over permanent bosses).
   - `characterPriorityWeight` = `(100 - characterScore)` from the Character Intelligence engine. The worse a character is built, the higher the priority to farm for them. (If weapon, map weapon to the character equipping it).
   - `totalScore` = `baseScore + timeGatedBonus + characterPriorityWeight`.
3. **Allocate Resin**:
   - Sort valid goals by `totalScore` descending.
   - Resin costs: Boss = 40, Domain = 20.
   - Loop through the sorted goals and allocate the user's available resin. A goal can be allocated multiple "runs" until either the resin is depleted or the goal is reasonably advanced.

### 2. The Explainer

**Input:**
- The allocated route item from the Calculator.
- The `CharacterRecommendation` data.

**Logic:**
Generate strings based on the goal type and priority:
- "Farm [Domain] today because [Target]'s [Resource] is available."
- If the character score was < 60: "[Target] needs significant investment (Score: [Score]/100), making this a top priority."
