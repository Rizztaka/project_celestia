import { UnprocessableError } from '@/core/errors/app-error.js';

import { GenshinCharacterService } from '../../characters/character.service.js';
import { characterElements as elements } from '../../companion/character-reference.js';
import { calculateComposition, resonanceElements } from './team-composition.calculator.js';
import { explainComposition } from './team-composition.explainer.js';

export function describeComposition(characterKeys: string[]) {
  if (
    characterKeys.some(
      (key) =>
        !Object.hasOwn(elements, key) ||
        !resonanceElements.some((element) => element === elements[key]),
    )
  )
    throw new UnprocessableError('Element data is unavailable for a selected character.');
  const recommendation = calculateComposition(characterKeys, elements);
  return { recommendation, score: recommendation.score, ...explainComposition(recommendation) };
}

export async function evaluateOwnedTeam(userId: string, characterKeys: string[]) {
  const roster = await new GenshinCharacterService().getCharactersForUser(userId);
  const owned = new Set(roster.map((character) => character.characterKey));
  if (characterKeys.some((key) => !owned.has(key)))
    throw new UnprocessableError('Choose characters from your imported roster.');
  return describeComposition(characterKeys);
}
