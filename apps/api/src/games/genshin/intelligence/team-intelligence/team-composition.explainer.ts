import type { Composition, ResonanceElement } from './team-composition.calculator.js';

const resonances: Record<ResonanceElement, { name: string; description: string }> = {
  Pyro: { name: 'Fervent Flames', description: '+25% ATK; affected by Cryo for 40% less time.' },
  Hydro: {
    name: 'Soothing Water',
    description: '+25% Max HP; affected by Pyro for 40% less time.',
  },
  Anemo: {
    name: 'Impetuous Winds',
    description: '+10% movement speed, -5% skill cooldown, -15% stamina consumption.',
  },
  Electro: {
    name: 'High Voltage',
    description:
      'Superconduct, Overloaded, Electro-Charged, Quicken, Aggravate or Hyperbloom generates an Electro particle (5s cooldown); affected by Hydro for 40% less time.',
  },
  Cryo: {
    name: 'Shattering Ice',
    description:
      '+15% CRIT Rate against Frozen or Cryo-affected enemies; affected by Electro for 40% less time.',
  },
  Geo: {
    name: 'Enduring Rock',
    description:
      '+15% shield strength; while shielded, +15% damage dealt and damaging enemies lowers their Geo RES by 20% for 15s.',
  },
  Dendro: {
    name: 'Sprawling Greenery',
    description:
      '+50 Elemental Mastery; Burning, Quicken or Bloom grants +30 and Aggravate, Spread, Hyperbloom or Burgeon grants +20 for 6s, with independent durations.',
  },
};

export function explainComposition(result: Composition) {
  return {
    resonances: result.resonanceElements.map((element) => ({
      element,
      ...resonances[element],
      active: result.complete,
    })),
    explanations: [
      result.complete
        ? 'Four slots filled. Elemental resonances are active.'
        : 'Fill all four slots to activate elemental resonance.',
      ...(result.reactions.length
        ? [
            `Potential reactions: ${result.reactions.join(', ')}. Element coverage alone does not establish rotations, application rate or damage.`,
          ]
        : ['Add complementary elements to enable reaction synergies.']),
      'Choose a damage dealer, compatible off-field support and sustain; check energy needs and rotations in game.',
    ],
  };
}
