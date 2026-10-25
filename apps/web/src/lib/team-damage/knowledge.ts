import metadata from './engine-metadata.json';

export const damageKnowledge = {
  title: 'How the DPS number is calculated',
  summary:
    'The generator compares the same observed builds, target and rotation for every candidate team. It is a reproducible benchmark, not a promise of live combat damage.',
  steps: [
    {
      title: '1. Rebuild each observed character',
      text: 'Character level, ascension, constellation, base talent levels, weapon level/refinement, artifact main stats and supported substats are converted into the simulator input.',
    },
    {
      title: '2. Apply the damage formula',
      text: 'For each hit, the engine applies talent multiplier × the relevant stat, additive damage bonuses, CRIT when it occurs, reaction modifiers, defense and resistance. Buffs and debuffs only count when the selected actions actually enable them.',
    },
    {
      title: '3. Run the same rotation',
      text: 'The chosen DPS is the driver. Teammates use their default Skill setup, then the driver uses Skill and Normal attacks. Cooldowns, energy, swap delay and failed actions remain enabled.',
    },
    {
      title: '4. Convert damage to DPS',
      text: 'DPS = total damage dealt ÷ elapsed test time. The result averages fixed-seed samples so candidate teams are compared under the same conditions.',
    },
  ],
  coverage: {
    engineVersion: metadata.version,
    characterForms: Object.keys(metadata.characters).length,
    weapons: Object.keys(metadata.weapons).length,
    artifactSets: Object.keys(metadata.sets).length,
  },
  patchNote:
    'This math remains useful for characters released through Genshin 7.1, but a character/form is only simulated when its source-backed profile exists in the pinned engine pack. Missing or unsupported 7.1 data stays unavailable instead of being guessed.',
} as const;
