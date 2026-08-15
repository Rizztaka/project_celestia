# FEATURE_CHARACTER_INTELLIGENCE.md

**Feature:** Character Intelligence Engine (Milestone 4A)
**Phase:** 4 — Intelligence Core
**Status:** Specification — Approved
**Last Updated:** August 2026

---

## Objective

Analyse a user's imported Genshin roster and produce a prioritised list of characters they
should build next, along with plain-language explanations for every recommendation.

The engine answers the question: *"Which character will yield the greatest account-wide
improvement if I invest in them today?"*

---

## Target Users

- Endgame players who want to optimise their next resource spend
- Returning players unsure where to re-invest
- Players farming for Spiral Abyss / Imaginarium Theater progression

---

## Architecture (SKILL: build-intelligence-engine)

The engine lives at:

```
apps/api/src/games/genshin/intelligence/
└── character-intelligence/
    ├── character-intelligence.calculator.ts   ← pure numeric scoring
    ├── character-intelligence.explainer.ts    ← score → string[]
    ├── character-intelligence.service.ts      ← orchestrator
    ├── character-intelligence.controller.ts   ← HTTP layer
    └── character-intelligence.routes.ts       ← route registration
```

---

## API Endpoint

```
GET /api/v1/games/genshin/intelligence/characters
Authorization: Bearer <JWT>
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "characterKey": "RaidenShogun",
        "rank": 1,
        "score": 87,
        "recommendation": "ASCEND_AND_LEVEL",
        "explanations": [
          "Raiden Shogun is Level 60 but ascension is only Phase 2 — ascending her will raise her stats and unlock a higher level cap.",
          "Her equipped weapon (Engulfing Lightning, Level 80) significantly outperforms her current level — ascending the character will let her weapon's stats land properly.",
          "She is a tier-1 sub_dps used in a wide variety of endgame team compositions.",
          "Her Burst talent is Level 1. Raising it to 8+ is one of the highest-ROI investments for this character."
        ]
      },
      {
        "characterKey": "Furina",
        "rank": 2,
        "score": 74,
        "recommendation": "LEVEL_TALENTS",
        "explanations": [
          "Furina's Burst talent is Level 3. Raising it to 8+ is one of the highest-ROI investments for this character.",
          "She is a tier-1 support used in a wide variety of endgame team compositions."
        ]
      }
    ],
    "skipped": [
      {
        "characterKey": "Venti",
        "reason": "Character data is complete — no high-priority gaps found."
      }
    ],
    "analysedAt": "2026-08-15T15:00:00.000Z"
  }
}
```

### Error Responses

| Status | Code | Condition |
|--------|------|-----------|
| `404` | `ACCOUNT_NOT_FOUND` | User has no imported Genshin account |
| `422` | `ROSTER_EMPTY` | Account exists but has zero characters |

---

## Scoring Heuristics — The Calculator

> **Rule:** The calculator is a pure function. Given the same input, it always returns the
> same output. No RNG. No external calls. No string explanations in this file.

### Input Shape

```typescript
interface CharacterInput {
  characterKey: string;
  level: number;           // 1–90
  ascension: number;       // 0–6
  constellation: number;   // 0–6
  talentNormal: number;    // 1–10 (base)
  talentSkill: number;     // 1–10 (base)
  talentBurst: number;     // 1–10 (base)
  equippedWeapon: {
    weaponKey: string;
    level: number;         // 1–90
    refinement: number;    // 1–5
  } | null;
}

interface StaticCharacterProfile {
  metaTier: 1 | 2 | 3;         // 1 = SS/S, 2 = A, 3 = B or below
  role: 'dps' | 'sub_dps' | 'support' | 'healer';
  priorityTalent: 'normal' | 'skill' | 'burst';
  weaponRarity: 4 | 5;
}
```

### Score Formula (0–100)

Each character accumulates points across five independent sub-scores, then total is clamped to 0–100:

---

#### Sub-score 1: Ascension Gap (max 35 pts)

Measures the gap between current ascension and the expected ascension for that level.

```
ascensionGap = expectedAscension(level) - ascension
score += min(35, ascensionGap × 12)
```

**`expectedAscension(level)` lookup table:**

| Level range | Expected ascension |
|---|---|
| 1–20 | 0 |
| 21–40 | 1 |
| 41–50 | 2 |
| 51–60 | 3 |
| 61–70 | 4 |
| 71–80 | 5 |
| 81–90 | 6 |

---

#### Sub-score 2: Talent Neglect (max 30 pts)

Focuses on the character's `priorityTalent`. Target is **Level 8** (Endgame standard).

```
priorityTalentLevel = character[priorityTalent]
talentGap = max(0, 8 - priorityTalentLevel)   // target baseline: level 8
score += min(30, talentGap × 5)
```

---

#### Sub-score 3: Meta Weight (max 20 pts)

A baseline boost for characters with wide team impact.

```
metaTier 1 → +20 pts
metaTier 2 → +10 pts
metaTier 3 → +0  pts
```

---

#### Sub-score 4: Weapon Mismatch (max 15 pts)

Detects a strong weapon on a neglected character.

```
if equippedWeapon != null:
  if equippedWeapon.level >= 60 AND character.level < 60:
    score += 15
  elif equippedWeapon.level >= 40 AND character.level < 40:
    score += 8
```

---

#### Sub-score 5: Level Cap Hit (–5 pts)

A character already at their level cap for their current ascension gets a small penalty.

```
if level == levelCapForAscension(ascension):
  score -= 5
```

**`levelCapForAscension` lookup:** `[20, 40, 50, 60, 70, 80, 90]` indexed by ascension.

---

#### Final Score

```
rawScore = sub1 + sub2 + sub3 + sub4 + sub5
score    = clamp(rawScore, 0, 100)
```

---

### Recommendation Label

| Condition | Label |
|---|---|
| `sub1 >= 24` (ascension gap ≥ 2) | `"ASCEND_AND_LEVEL"` |
| `sub2 >= 20` and `sub1 < 24` | `"LEVEL_TALENTS"` |
| `sub4 >= 8` and both gaps small | `"CLOSE_LEVEL_GAP"` |
| `score < 20` | → appears in `skipped[]`, not `recommendations[]` |

---

### Filtering & Sorting

- `score < 20` → placed in `skipped[]`
- Remaining → sorted descending by `score`
- Maximum **5 recommendations** returned (highly opinionated output)

---

## Explanation Engine — The Explainer

The explainer takes the calculator's raw output and produces human-readable bullets.
It is the **only** place where prose strings are generated.

### Rules

1. Each explanation references **concrete values** from the character's data (no invented numbers).
2. Explanations are **ordered** from most impactful to least.
3. A sub-score of 0 generates no bullet for that category.

### Explanation Templates (per sub-score)

**Ascension Gap:**
> `"{name} is Level {level} but only Ascension {ascension} — ascending them will raise their stats and unlock a higher level cap."`

**Talent Neglect:**
> `"{name}'s {priorityTalentLabel} talent is Level {talentLevel}. Raising it to 8+ is one of the highest-ROI investments for this character."`
> `"As a {role}, their {priorityTalentLabel} directly scales their primary contribution to a team."`

**Meta Weight (only when metaTier === 1):**
> `"{name} is a tier-1 {role} used in a wide variety of endgame team compositions."`

**Weapon Mismatch:**
> `"{name} is equipped with {weaponName} (Level {wLevel}) but is only Level {cLevel} — ascending the character will let their weapon's stats land properly."`

**Level Cap Hit:** *(no bullet — the ascension sub-score already covers this)*

---

## Static Seed File — `character-profiles.json`

**Path:** `apps/api/src/games/genshin/static/character-profiles.json`

### Schema

```json
{
  "_comment": "Meta profiles for the Character Intelligence Engine. Patch 5.x. metaTier: 1=SS/S, 2=A, 3=B/C.",
  "HuTao": {
    "metaTier": 1,
    "role": "dps",
    "priorityTalent": "skill",
    "weaponRarity": 5
  },
  "Venti": {
    "metaTier": 1,
    "role": "support",
    "priorityTalent": "burst",
    "weaponRarity": 5
  },
  "RaidenShogun": {
    "metaTier": 1,
    "role": "sub_dps",
    "priorityTalent": "burst",
    "weaponRarity": 5
  },
  "Zhongli": {
    "metaTier": 1,
    "role": "support",
    "priorityTalent": "skill",
    "weaponRarity": 5
  },
  "Furina": {
    "metaTier": 1,
    "role": "support",
    "priorityTalent": "burst",
    "weaponRarity": 5
  }
}
```
