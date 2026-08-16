import { createRequire } from 'module';

import { prisma } from '@/core/db/prisma.js';
import { NotFoundError, UnprocessableError } from '@/core/errors/app-error.js';

import type { CharacterWithArtifacts } from '../../characters/character.repository.js';
import { GenshinCharacterRepository } from '../../characters/character.repository.js';
import {
  type ArtifactInput,
  type ArtifactSubStat,
  type ArtifactWeightProfile,
  calculateArtifactScore,
} from './artifact-intelligence.calculator.js';
import { explainArtifactScore } from './artifact-intelligence.explainer.js';

// -------------------------------------------------------
// Static data — loaded once at module init
// -------------------------------------------------------

const require = createRequire(import.meta.url);

const artifactProfiles: Record<string, ArtifactWeightProfile> = require(
  '../../static/artifact-stat-weights.json',
);

// -------------------------------------------------------
// Response types
// -------------------------------------------------------

export interface EquippedArtifactOutput {
  slotKey: string;
  setKey: string;
  level: number;
  rarity: number;
  mainStatKey: string;
  slotScore: number;
  subStats: Array<{
    key: string;
    value: number;
    weight: number;
  }>;
}

export interface ArtifactRecommendation {
  characterKey: string;
  rank: number;
  artifactEfficiencyScore: number;
  recommendationScore: number;
  equippedArtifacts: EquippedArtifactOutput[];
  explanations: string[];
}

export interface SkippedCharacter {
  characterKey: string;
  reason: string;
}

export interface ArtifactIntelligenceResponse {
  recommendations: ArtifactRecommendation[];
  skipped: SkippedCharacter[];
  analysedAt: string;
}

// -------------------------------------------------------
// Service
// -------------------------------------------------------

export class ArtifactIntelligenceService {
  private readonly characterRepo: GenshinCharacterRepository;

  constructor() {
    this.characterRepo = new GenshinCharacterRepository();
  }

  async getRecommendations(userId: string): Promise<ArtifactIntelligenceResponse> {
    // 1. Verify account
    const account = await prisma.genshinAccount.findUnique({ where: { userId } });
    if (!account) {
      throw new NotFoundError('No Genshin Impact account found. Please import your data first.');
    }

    // 2. Fetch roster with equipped artifacts
    const roster: CharacterWithArtifacts[] = await this.characterRepo.findByAccountIdWithArtifacts(
      account.id,
    );

    if (roster.length === 0) {
      throw new UnprocessableError(
        'Your roster is empty. Import your character data to receive recommendations.',
      );
    }

    const recommendations: Array<ArtifactRecommendation & { _sortScore: number }> = [];
    const skipped: SkippedCharacter[] = [];

    // 3. Process each character
    for (const char of roster) {
      const profile = artifactProfiles[char.characterKey] ?? null;

      if (!profile) {
        skipped.push({
          characterKey: char.characterKey,
          reason: 'No artifact weight profile exists for this character yet.',
        });
        continue;
      }

      const equippedArtifactsInput: ArtifactInput[] = char.equippedArtifacts.map((a) => ({
        slotKey: a.slotKey,
        mainStatKey: a.mainStatKey,
        subStats: (a.subStats as unknown as ArtifactSubStat[]) ?? [],
      }));

      const breakdown = calculateArtifactScore(equippedArtifactsInput, profile);

      if (breakdown.artifactEfficiencyScore >= 60) {
        skipped.push({
          characterKey: char.characterKey,
          reason: `Artifact efficiency is ${breakdown.artifactEfficiencyScore}/100 — no urgent improvement needed.`,
        });
      } else {
        const explanations = explainArtifactScore(
          char.characterKey,
          breakdown,
          profile,
          equippedArtifactsInput,
        );

        const equippedArtifactsOutput: EquippedArtifactOutput[] = char.equippedArtifacts.map((a) => {
          const subStats = (a.subStats as unknown as ArtifactSubStat[]) ?? [];
          return {
            slotKey: a.slotKey,
            setKey: a.setKey,
            level: a.level,
            rarity: a.rarity,
            mainStatKey: a.mainStatKey,
            slotScore: breakdown.slotScores[a.slotKey]?.slotScore ?? 0,
            subStats: subStats.map((sub) => ({
              key: sub.key,
              value: sub.value,
              weight: profile.subStatWeights[sub.key] ?? 0,
            })),
          };
        });

        recommendations.push({
          characterKey: char.characterKey,
          rank: 0,
          artifactEfficiencyScore: breakdown.artifactEfficiencyScore,
          recommendationScore: breakdown.recommendationScore,
          equippedArtifacts: equippedArtifactsOutput,
          explanations,
          _sortScore: breakdown.recommendationScore,
        });
      }
    }

    // Edge case: if no characters could be analysed and none were skipped
    // (Should be impossible due to roster.length > 0 check, but safe fallback)
    if (recommendations.length === 0 && skipped.length === 0) {
      throw new UnprocessableError('No characters could be analysed.');
    }

    // 4. Sort (highest recommendation score first) and return top 5
    recommendations.sort((a, b) => b._sortScore - a._sortScore);

    const top5 = recommendations.slice(0, 5).map((rec, index) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _sortScore, ...rest } = rec;
      return {
        ...rest,
        rank: index + 1,
      };
    });

    return {
      recommendations: top5,
      skipped,
      analysedAt: new Date().toISOString(),
    };
  }
}
