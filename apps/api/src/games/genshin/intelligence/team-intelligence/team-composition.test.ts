import { beforeEach, describe, expect, it, vi } from 'vitest';

const { roster } = vi.hoisted(() => ({ roster: vi.fn() }));
vi.mock('../../characters/character.service.js', () => ({
  GenshinCharacterService: class {
    getCharactersForUser = roster;
  },
}));

import { calculateComposition, resonanceElements } from './team-composition.calculator.js';
import { explainComposition } from './team-composition.explainer.js';
import { evaluationSchema } from './team-composition.schema.js';
import { describeComposition, evaluateOwnedTeam } from './team-composition.service.js';

describe('custom team composition', () => {
  beforeEach(() =>
    roster.mockResolvedValue(
      ['Bennett', 'Xiangling', 'Xingqiu', 'RaidenShogun'].map((characterKey) => ({ characterKey })),
    ),
  );
  it.each(resonanceElements)('detects %s resonance and requires a complete party', (element) => {
    const elements = { A: element, B: element, C: 'Unknown', D: 'Unknown' };
    const partial = calculateComposition(['A', 'B'], elements);
    expect(partial.resonanceElements).toEqual([element]);
    expect(explainComposition(partial).resonances[0].active).toBe(false);
    const full = calculateComposition(['A', 'B', 'C', 'D'], elements);
    expect(explainComposition(full).resonances[0]).toMatchObject({ element, active: true });
  });
  it.each([
    [['Bennett', 'Xingqiu'], 'Vaporize'],
    [['Bennett', 'Kaeya'], 'Melt'],
    [['Nahida', 'Xingqiu', 'KukiShinobu'], 'Hyperbloom'],
    [['Kazuha', 'Xingqiu'], 'Swirl'],
    [['Nahida', 'Fischl'], 'Aggravate'],
  ])('reports potential reactions for %j', (keys, reaction) => {
    expect(describeComposition(keys).recommendation.reactions).toContain(reaction);
  });
  it('does not infer Swirl from Anemo and Geo alone', () => {
    expect(describeComposition(['Kazuha', 'Zhongli']).recommendation.reactions).not.toContain(
      'Swirl',
    );
  });
  it('evaluates only the authenticated player roster', async () => {
    const result = await evaluateOwnedTeam('owner', [
      'Bennett',
      'Xiangling',
      'Xingqiu',
      'RaidenShogun',
    ]);
    expect(roster).toHaveBeenCalledWith('owner');
    expect(result.resonances).toContainEqual(
      expect.objectContaining({ name: 'Fervent Flames', active: true }),
    );
    await expect(evaluateOwnedTeam('owner', ['Mavuika'])).rejects.toThrow('imported roster');
  });
  it('rejects missing static metadata rather than inventing elements', () => {
    expect(() => describeComposition(['UnknownCharacter'])).toThrow('Element data');
    expect(() => describeComposition(['constructor'])).toThrow('Element data');
  });
  it.each([
    { characterKeys: ['Bennett', 'Bennett'] },
    { characterKeys: ['a', 'b', 'c', 'd', 'e'] },
    { characterKeys: [''] },
    { characterKeys: [], userId: 'someone-else' },
  ])('rejects invalid or owner-supplied request bodies %j', (body) => {
    expect(evaluationSchema.safeParse(body).success).toBe(false);
  });
  it('is deterministic and supports empty and incomplete parties', () => {
    expect(describeComposition([]).recommendation.complete).toBe(false);
    expect(describeComposition(['Bennett'])).toEqual(describeComposition(['Bennett']));
  });
});
