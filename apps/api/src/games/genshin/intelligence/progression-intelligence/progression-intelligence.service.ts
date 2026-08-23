import { createRequire } from 'module';

import { prisma } from '@/core/db/prisma.js';
import { NotFoundError } from '@/core/errors/app-error.js';
import { GenshinCharacterService } from '../../characters/character.service.js';

const require = createRequire(import.meta.url);
const ELEMENT_MAP: Record<string, string> = require('../../static/character-elements.json');

export interface ElementalSpread {
  element: string;
  count: number;
  percentage: number;
}

export interface ProgressionIntelligenceResponse {
  rosterCompletion: {
    owned: number;
    total: number;
    percentage: number;
    rank: string;
  };
  ascensionMaturity: {
    highlyAscended: number; // Ascension 5 or 6 (level 80+)
    totalOwned: number;
    percentage: number;
    rank: string;
  };
  elementalSpread: ElementalSpread[];
  analysedAt: string;
}

export class ProgressionIntelligenceService {
  public async analyzeProgression(userId: string): Promise<ProgressionIntelligenceResponse> {
    const account = await prisma.genshinAccount.findUnique({
      where: { userId },
    });
    if (!account) {
      throw new NotFoundError('No Genshin Impact account found for this user.');
    }

    const charService = new GenshinCharacterService();
    const roster = await charService.getCharactersForUser(userId);
    const totalAvailableCharacters = Object.keys(ELEMENT_MAP).length;
    const owned = roster.length;

    // 1. Roster Completion
    const completionPercentage = totalAvailableCharacters > 0 ? (owned / totalAvailableCharacters) * 100 : 0;
    let completionRank = 'Beginner';
    if (completionPercentage >= 90) completionRank = 'Archon of Collecting';
    else if (completionPercentage >= 70) completionRank = 'Veteran Collector';
    else if (completionPercentage >= 40) completionRank = 'Established Traveler';

    // 2. Ascension Maturity
    // Count characters with ascension >= 5 (meaning level 80+)
    const highlyAscended = roster.filter((char: any) => char.ascension >= 5).length;
    const maturityPercentage = owned > 0 ? (highlyAscended / owned) * 100 : 0;
    let maturityRank = 'Trainee';
    if (maturityPercentage >= 80) maturityRank = 'Abyss Ready';
    else if (maturityPercentage >= 50) maturityRank = 'Combat Veteran';
    else if (maturityPercentage >= 25) maturityRank = 'Rising Star';

    // 3. Elemental Spread
    const counts: Record<string, number> = {};
    for (const char of roster) {
      const element = ELEMENT_MAP[char.characterKey] || 'Unknown';
      counts[element] = (counts[element] || 0) + 1;
    }

    const elementalSpread: ElementalSpread[] = Object.entries(counts).map(([element, count]) => ({
      element,
      count,
      percentage: owned > 0 ? (count / owned) * 100 : 0,
    }));
    // Sort descending by count
    elementalSpread.sort((a, b) => b.count - a.count);

    return {
      rosterCompletion: {
        owned,
        total: totalAvailableCharacters,
        percentage: completionPercentage,
        rank: completionRank,
      },
      ascensionMaturity: {
        highlyAscended,
        totalOwned: owned,
        percentage: maturityPercentage,
        rank: maturityRank,
      },
      elementalSpread,
      analysedAt: new Date().toISOString(),
    };
  }
}

export const progressionIntelligenceService = new ProgressionIntelligenceService();
