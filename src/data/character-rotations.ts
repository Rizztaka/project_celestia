import { CharacterRotationProfile } from '../types/genshin';
import { parseActionShorthand } from '../engines/rotation-synthesizer';

export const CHARACTER_ROTATIONS: Record<string, CharacterRotationProfile> = {
  nefer: {
    primarySequence: parseActionShorthand('E > 3CA > E > 3CA'),
    stage: 'on-field-carry',
    estimatedFieldTime: 10.5,
    notes: 'Cast Skill (Shadow Dance), unleash 3 enhanced Charged Attacks absorbing Seeds of Deceit, recast Skill and repeat.',
    tags: ['Nod-Krai', 'Lunar-Bloom'],
  },
  furina: {
    primarySequence: parseActionShorthand('E > Q'),
    alternateSequence: parseActionShorthand('Q > E'),
    stage: 'sustain-setup',
    estimatedFieldTime: 2.5,
    notes: 'Cast E then Q so Salon Solitaire starts draining party HP immediately, maximizing Fanfare stack accumulation.',
    tags: ['Universal-Buffer', 'Hydro-App'],
  },
  bennett: {
    primarySequence: parseActionShorthand('Q > E'),
    stage: 'buffer-shred',
    estimatedFieldTime: 2.0,
    notes: 'Burst for Inspiration Field ATK buff, then tap Skill to generate Pyro particles to funnel into Sub-DPS / Carry.',
    tags: ['Huge-ATK-Buff', 'Healer', 'Battery'],
  },
  kazuha: {
    primarySequence: parseActionShorthand('hE > Plunge > Q'),
    alternateSequence: parseActionShorthand('tE > Plunge > Q'),
    stage: 'buffer-shred',
    estimatedFieldTime: 3.0,
    notes: 'Hold E into Plunge for enemy suction and 40% VV resistance shred, then Burst for elemental absorption and team DMG% bonus.',
    tags: ['VV', 'Universal-Buffer', 'Crowd-Control'],
  },
  kaedeharakazuha: {
    primarySequence: parseActionShorthand('hE > Plunge > Q'),
    alternateSequence: parseActionShorthand('tE > Plunge > Q'),
    stage: 'buffer-shred',
    estimatedFieldTime: 3.0,
    notes: 'Hold E into Plunge for enemy suction and 40% VV resistance shred, then Burst for elemental absorption and team DMG% bonus.',
    tags: ['VV', 'Universal-Buffer', 'Crowd-Control'],
  },
  zhongli: {
    primarySequence: parseActionShorthand('hE'),
    alternateSequence: parseActionShorthand('hE > Q'),
    stage: 'sustain-setup',
    estimatedFieldTime: 2.0,
    notes: 'Hold E to generate unbroken Jade Shield and 20% universal RES shred. Cast Burst only for emergency crowd-control petrification.',
    tags: ['Shield', 'RES-Shred'],
  },
  nahida: {
    primarySequence: parseActionShorthand('hE > Q'),
    stage: 'sub-dps',
    estimatedFieldTime: 2.5,
    notes: 'Hold E to mark up to 8 targets with Tri-Karma Purification, then Burst for Shrine of Maya up to 250 EM team share.',
    tags: ['Dendro-Core', 'EM-Buffer'],
  },
  xiangling: {
    primarySequence: parseActionShorthand('Q > E'),
    stage: 'sub-dps',
    estimatedFieldTime: 2.5,
    notes: 'Cast Pyronado inside Bennett circle to snapshot ATK buff and catch particles, drop Guoba for additional chili pepper buff.',
    tags: ['Pyro-Enabler', 'Off-Field-DPS'],
  },
  xingqiu: {
    primarySequence: parseActionShorthand('Q > E > E'),
    stage: 'sub-dps',
    estimatedFieldTime: 3.0,
    notes: 'Cast Raincutter burst, followed by twin Guhua sword slashes (with Sacrificial Sword reset) to generate Hydro particles.',
    tags: ['Hydro-App', 'Interruption-RES'],
  },
  yelan: {
    primarySequence: parseActionShorthand('Q > E > N1'),
    stage: 'sub-dps',
    estimatedFieldTime: 2.5,
    notes: 'Depth-Clarion Dice burst for ramping damage buff, Lingering Lifeline dash for mobility and particle generation.',
    tags: ['Hydro-App', 'Universal-Buffer'],
  },
  hutao: {
    primarySequence: parseActionShorthand('E > 8N2CD > Q'),
    stage: 'on-field-carry',
    estimatedFieldTime: 9.5,
    notes: 'Guide to Afterlife Skill entering Paramita Papilio, weave N2C with jump or dash cancels, finishing with Spirit Soother burst.',
    tags: ['Vaporize', 'Melt'],
  },
  navia: {
    primarySequence: parseActionShorthand('Q > hE > 3NA > hE > 3NA'),
    stage: 'on-field-carry',
    estimatedFieldTime: 8.5,
    notes: 'Pre-cast Burst for passive artillery shard generation, Hold Skill to unleash Gunbrella shots at max 3-6 shrapnel stacks.',
    tags: ['Gunbrella', 'Crystallize'],
  },
  raiden: {
    primarySequence: parseActionShorthand('E > [Team Rotation] > Q > 3N3C > N1C'),
    stage: 'on-field-carry',
    estimatedFieldTime: 8.5,
    notes: 'Open with E for team burst damage bonus. After teammates burst, unleash Musou Shinsetsu to regenerate team energy.',
    tags: ['Electro-Battery', 'Burst-DPS'],
  },
  raidenshogun: {
    primarySequence: parseActionShorthand('E > [Team Rotation] > Q > 3N3C > N1C'),
    stage: 'on-field-carry',
    estimatedFieldTime: 8.5,
    notes: 'Open with E for team burst damage bonus. After teammates burst, unleash Musou Shinsetsu to regenerate team energy.',
    tags: ['Electro-Battery', 'Burst-DPS'],
  },
  arlecchino: {
    primarySequence: parseActionShorthand('E > [Supports] > CA > 5N3D'),
    stage: 'on-field-carry',
    estimatedFieldTime: 9.5,
    notes: 'Cast Skill applying Blood-Debt Directive, swap to supports while it upgrades to Blood-Debt Due, then CA to absorb and normal attack.',
    tags: ['Bond-Of-Life'],
  },
  mavuika: {
    primarySequence: parseActionShorthand('E > Q > 3N3D'),
    stage: 'on-field-carry',
    estimatedFieldTime: 9.0,
    notes: 'Nightsoul transformation burst into high-frequency Pyro infused attacks, capitalizing on team Fighting Spirit stacks.',
    tags: ['Nightsoul', 'ATK-Buffer'],
  },
  xilonen: {
    primarySequence: parseActionShorthand('E > 2NA > Q'),
    stage: 'buffer-shred',
    estimatedFieldTime: 2.5,
    notes: 'Skill into rollerblading Source Samples activation via 2 normal attacks for up to 36% all-element RES shred and Cinder City buff.',
    tags: ['Cinder-City', 'Universal-Buffer', 'Healer'],
  },
  alhaitham: {
    primarySequence: parseActionShorthand('Q > 2NA > E > 3NA > CA > 3NA'),
    stage: 'on-field-carry',
    estimatedFieldTime: 10.0,
    notes: 'Burst to generate 3 Chisel-Light mirrors, refreshing mirrors sequentially with Skill and Charged Attack for continuous projection attacks.',
    tags: ['Quicken', 'Spread'],
  },
  baizhu: {
    primarySequence: parseActionShorthand('E > Q'),
    stage: 'sustain-setup',
    estimatedFieldTime: 2.0,
    notes: 'Cast E for instant teamwide healing, then Q for continuous Seamless Shields, healing, and Dendro reaction damage bonus.',
    tags: ['Team-Healer', 'Shield'],
  },
  chevreuse: {
    primarySequence: parseActionShorthand('hE > Q'),
    stage: 'buffer-shred',
    estimatedFieldTime: 2.5,
    notes: 'After teammate triggers Overload, unleash Hold Skill to fire Overcharged Ball, granting party +40% ATK and 40% Pyro/Electro shred.',
    tags: ['Overload-Only', 'RES-Shred', 'ATK-Buffer'],
  },
  xianyun: {
    primarySequence: parseActionShorthand('E > Plunge > Q'),
    stage: 'buffer-shred',
    estimatedFieldTime: 3.0,
    notes: 'Skyladder leap into plunge, followed by Burst to grant high-jump capability and massive plunging attack additive damage.',
    tags: ['Plunge-Buffer', 'Team-Healer', 'VV'],
  },
  neuvillette: {
    primarySequence: parseActionShorthand('E > Q > 3CA'),
    stage: 'on-field-carry',
    estimatedFieldTime: 11.0,
    notes: 'Cast Skill and Burst to produce Sourcewater Droplets, then channel continuous Equitable Judgment Hydro laser beams.',
    tags: ['Hydro-Carry'],
  },
};

/**
 * Returns a character's curated rotation profile, case-insensitively, or undefined.
 */
export function getCharacterRotation(characterIdOrName: string): CharacterRotationProfile | undefined {
  if (!characterIdOrName) return undefined;
  const key = characterIdOrName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return CHARACTER_ROTATIONS[key];
}
