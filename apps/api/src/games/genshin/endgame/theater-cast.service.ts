import { createRequire } from 'node:module';

import type { TheaterCastRequest, TheaterCastResponse } from '@celestia/api-contracts';

import { GenshinAccountRepository } from '../accounts/account.repository.js';
import { GenshinCharacterRepository } from '../characters/character.repository.js';
import { calculateTheaterCast } from './theater-rules.calculator.js';
import { explainTheaterCast } from './theater-rules.explainer.js';
const require = createRequire(import.meta.url);
const elements: Record<string, string> = require('../static/character-elements.json');
export class TheaterCastService {
  constructor(
    private readonly accounts = new GenshinAccountRepository(),
    private readonly characters = new GenshinCharacterRepository(),
  ) {}
  async preview(userId: string, rules: TheaterCastRequest): Promise<TheaterCastResponse> {
    const account = await this.accounts.findByUserId(userId);
    const roster = account ? await this.characters.findByAccountId(account.id) : [];
    const result = calculateTheaterCast(
      roster.map((c) => ({
        characterKey: c.characterKey,
        level: c.level,
        element: elements[c.characterKey] ?? null,
        identity: /^(Traveler|Aether|Lumine)/.test(c.characterKey) ? 'Traveler' : c.characterKey,
      })),
      rules,
    );
    return { result, explanations: explainTheaterCast(result, rules) };
  }
}
