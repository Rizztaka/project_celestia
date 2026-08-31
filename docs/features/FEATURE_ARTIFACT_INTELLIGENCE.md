# Feature: Artifact Intelligence Engine

**Milestone:** 4C — Artifact Intelligence  
**Endpoint:** `GET /api/v1/games/genshin/intelligence/artifacts`  
**Location:** `apps/api/src/games/genshin/intelligence/artifact-intelligence/`

---

## 1. Overview

The Artifact Intelligence Engine analyses the artifacts **currently equipped** on characters in a user's roster. For each character it:

1. Reads up to 5 equipped artifacts (flower, plume, sands, goblet, circlet).
2. Scores each artifact's sub-stats against that character's **ideal stat weight profile** (what stats they want vs. what they have).
3. Aggregates the 5 scores into a single **Artifact Efficiency Score (AES)** (0–100) for the character.
4. Surfaces the **top 5 characters** with the lowest AES — i.e., those who would benefit most from new artifacts.

> **Why surface the worst, not the best?**  
> The engine's purpose is to direct farming effort. The characters with the poorest artifact loads are the highest-ROI targets for the player to focus their resin on.

---

## 2. Scoring Methodology

### 2.1 — Why RV (Roll Value) over CV (Crit Value)?

| Method          | Formula                                                  | Problem                                                   |
| --------------- | -------------------------------------------------------- | --------------------------------------------------------- |
| Crit Value (CV) | `CR×2 + CD`                                              | Ignores non-crit builds (healers, EM carries, HP scalers) |
| Roll Value (RV) | `(substat value / max single-roll value) × weight × 100` | Weights every stat according to the character's build     |

**We use a weighted Roll Value (wRV) model.** It is the only correct approach for a platform that supports all character archetypes.

### 2.2 — Sub-stat Maximum Single-Roll Values

These are fixed game constants for 5★ artifacts (the only meaningful target):

| Sub-stat Key | Max Single Roll | Display Name      |
| ------------ | --------------- | ----------------- |
| `critRate_`  | 3.9%            | Crit Rate         |
| `critDMG_`   | 7.8%            | Crit DMG          |
| `enerRech_`  | 6.5%            | Energy Recharge   |
| `eleMas`     | 23              | Elemental Mastery |
| `hp_`        | 5.8%            | HP%               |
| `atk_`       | 5.8%            | ATK%              |
| `def_`       | 7.3%            | DEF%              |
| `hp`         | 298.75          | Flat HP           |
| `atk`        | 19.45           | Flat ATK          |
| `def`        | 23.15           | Flat DEF          |

### 2.3 — Per-Artifact Score Formula

For a single artifact with sub-stats `[{ key, value }, ...]` and a character weight profile `{ [statKey]: weight (0.0–1.0) }`:

```
weightedRolls(artifact) = Σ [ (subStatValue / MAX_ROLL[statKey]) × weight[statKey] ]

maxPossibleRolls = 6  (a +20 5★ artifact has up to 9 rolls; a realistic target is 6 "good" rolls)

artifactScore = clamp( weightedRolls / maxPossibleRolls × 100, 0, 100 )
```

The `maxPossibleRolls` constant of **6** is chosen because:

- A fresh 5★ artifact has 4 sub-stats.
- At +20, it gains 5 additional rolls (at +4, +8, +12, +16, +20).
- Expecting all 9 rolls to land on priority stats is unrealistic. 6 is a balanced "excellent" threshold.

### 2.4 — Main Stat Bonus

A correct main stat on goblet (element DMG), sands (desired scaling stat), or circlet (CR or CD) is worth a **+15 flat bonus** to that artifact's score (before the 100 clamp). This prevents penalising a character who has great sub-stats but the engine ignores the main stat entirely.

The slot-to-valid-main-stat mapping is encoded in the character profile (see Section 3).

### 2.5 — Artifact Efficiency Score (Character-Level)

The character's AES is the simple **arithmetic mean** of the scores of all 5 equipped artifact slots. Missing artifacts (empty slots) score **0**, incentivising the user to fill all slots.

```
AES = mean(slot_scores[flower, plume, sands, goblet, circlet])
```

### 2.6 — Score Inversion for Recommendations

The engine surfaces the **worst** AES characters, so the recommendation score is inverted:

```
recommendationScore = 100 - AES
```

This preserves the convention from 4A and 4B where a higher score = a more urgent recommendation.

---

## 3. Static Seed Data: `artifact-stat-weights.json`

### 3.1 — JSON Schema

```typescript
interface StatWeight {
  weight: number; // 0.0 = irrelevant, 0.5 = situational, 1.0 = BiS priority
}

interface SlotMainStats {
  sands: string[]; // valid mainStatKeys for sands (e.g. ["hp_", "atk_", "enerRech_"])
  goblet: string[]; // valid mainStatKeys for goblet (e.g. ["pyro_dmg_"])
  circlet: string[]; // valid mainStatKeys for circlet (e.g. ["critRate_", "critDMG_"])
}

interface ArtifactWeightProfile {
  subStatWeights: Record<string, number>; // statKey → weight 0.0–1.0
  mainStatPriority: SlotMainStats;
}
```

### 3.2 — JSON Shape Example

```json
{
  "_comment": "Artifact stat weight profiles for the Artifact Intelligence Engine. Patch 5.x.",
  "HuTao": {
    "subStatWeights": {
      "critRate_": 1.0,
      "critDMG_": 1.0,
      "hp_": 0.75,
      "eleMas": 0.75,
      "enerRech_": 0.25,
      "atk_": 0.0,
      "atk": 0.0,
      "hp": 0.0,
      "def": 0.0,
      "def_": 0.0
    },
    "mainStatPriority": {
      "sands": ["hp_"],
      "goblet": ["pyro_dmg_"],
      "circlet": ["critRate_", "critDMG_"]
    }
  }
}
```

### 3.3 — Archetypes & Representative Characters to Seed on Day 1

| Profile Key    | Archetype                 | Priority Sub-stats | Priority Main Stats       |
| -------------- | ------------------------- | ------------------ | ------------------------- |
| `HuTao`        | Pyro DPS (HP scaler)      | CR, CD, HP%, EM    | HP%, Pyro DMG, CR/CD      |
| `Arlecchino`   | Pyro DPS (ATK scaler)     | CR, CD, ATK%       | ATK%, Pyro DMG, CR/CD     |
| `RaidenShogun` | Electro Sub-DPS           | CR, CD, ER, ATK%   | ER, Electro DMG, CR/CD    |
| `Furina`       | Hydro Support (HP scaler) | HP%, ER, CR, CD    | HP%, Hydro DMG/HP%, HP%   |
| `Kazuha`       | Anemo Support (EM carry)  | EM, ER, CR, CD     | EM, Anemo DMG, EM         |
| `Bennett`      | ATK Buffer / Healer       | HP%, ER, CR        | HP%, Pyro DMG/HP%, CR/HP% |
| `Yelan`        | Hydro Sub-DPS (HP scaler) | CR, CD, HP%, ER    | HP%, Hydro DMG, CR/CD     |
| `Zhongli`      | Geo Shield (HP scaler)    | HP%, DEF%, ER      | HP%, Geo DMG/HP%, HP%     |
| `XingQiu`      | Hydro Off-fielder         | CR, CD, ATK%, ER   | ATK%, Hydro DMG, CR/CD    |
| `Nahida`       | Dendro Support (EM carry) | EM, CR, CD         | EM, Dendro DMG, CR/EM     |

---

## 4. API Response Shape

### `GET /api/v1/games/genshin/intelligence/artifacts`

#### Success Response — 200

```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "characterKey": "RaidenShogun",
        "rank": 1,
        "artifactEfficiencyScore": 31,
        "recommendationScore": 69,
        "equippedArtifacts": [
          {
            "slotKey": "flower",
            "setKey": "EmblemOfSeveredFate",
            "level": 20,
            "rarity": 5,
            "mainStatKey": "hp",
            "slotScore": 28,
            "subStats": [
              { "key": "critRate_", "value": 6.6, "weight": 1.0 },
              { "key": "atk_", "value": 5.2, "weight": 0.5 },
              { "key": "hp", "value": 209, "weight": 0.0 },
              { "key": "def", "value": 19, "weight": 0.0 }
            ]
          }
        ],
        "explanations": [
          "Raiden Shogun's artifacts average 31/100 efficiency — well below the recommended 60+ threshold.",
          "Her Circlet has a DEF% main stat — switching to CR or CD would yield a significant damage increase.",
          "Only 1 of 5 artifacts has a Crit Rate or Crit DMG sub-stat, which is her highest-priority stat."
        ]
      }
    ],
    "skipped": [
      {
        "characterKey": "HuTao",
        "reason": "Artifact efficiency is 76/100 — no significant improvement detected."
      }
    ],
    "analysedAt": "2026-08-16T17:00:00Z"
  }
}
```

#### Error Responses

| Status | `error.code`           | Cause                                                       |
| ------ | ---------------------- | ----------------------------------------------------------- |
| 404    | `NOT_FOUND`            | User has no `GenshinAccount`                                |
| 422    | `UNPROCESSABLE_ENTITY` | Roster is empty, or no character has any equipped artifacts |

---

## 5. Data Access Pattern

The service must query characters **with their equipped artifacts**:

```typescript
// New type to be added to character.repository.ts
type CharacterWithArtifacts = GenshinCharacter & {
  equippedArtifacts: GenshinArtifact[];
};
```

This requires a new repository method:

```typescript
findByAccountIdWithArtifacts(accountId: string): Promise<CharacterWithArtifacts[]>
```

using `include: { equippedArtifacts: true }` in the Prisma query.

---

## 6. Sub-stat JSON Runtime Type

The `subStats` Prisma field is `Json`. At runtime it is cast to:

```typescript
interface ArtifactSubStat {
  key: string; // e.g. "critRate_", "hp_", "eleMas"
  value: number; // raw value (e.g. 6.6 for 6.6% CR)
}
```

The service must safely cast: `char.equippedArtifacts[i].subStats as ArtifactSubStat[]`.

---

## 7. Edge Cases

| Case                                                              | Handling                                                                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Character has no artifact profile in `artifact-stat-weights.json` | Skip character — push to `skipped` with reason `"No artifact weight profile found for this character."` |
| Character has 0 equipped artifacts                                | AES = 0, recommendationScore = 100 (highest urgency)                                                    |
| Artifact is rarity < 5★                                           | Still scored normally; no special penalty. The scores will naturally be low due to fewer/smaller rolls. |
| Sub-stat key not in `MAX_ROLL` table                              | Treat weight as 0, contribution = 0. Log a warning (does not throw).                                    |
| Main stat key matches a preferred sub-stat                        | Do NOT double-count. Main stat scoring is handled by the separate `mainStatPriority` check per slot.    |
| `AES >= 60`                                                       | Character is pushed to `skipped` — artifacts are good enough.                                           |
