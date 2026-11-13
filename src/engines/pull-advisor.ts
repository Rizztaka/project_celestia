import type { PullAdvice } from '../types/genshin';
import { CHARACTERS } from '../data/characters';

// Notable 5-star target pool for accounts
const PULL_CANDIDATES = [
  'Xilonen',
  'Mavuika',
  'Citlali',
  'Nefer',
  'Lauma',
  'Furina',
  'Neuvillette',
  'Nahida',
  'KaedeharaKazuha',
  'Zhongli',
  'Yelan',
  'Arlecchino',
  'RaidenShogun',
  'Baizhu',
  'Xianyun',
  'Navia',
  'Alhaitham',
  'Clorinde',
  'Chasca',
  'Kinich',
];

export function evaluatePullRecommendations(ownedIds: string[]): PullAdvice[] {
  const ownedSet = new Set(ownedIds);
  const ownedCharacters = CHARACTERS.filter((c) => ownedSet.has(c.id));

  // Analyze account gaps
  const hasUniversalBuffer = ownedCharacters.some(
    (c) => c.tags.includes('Universal-Buffer') || c.tags.includes('Cinder-City') || c.tags.includes('VV'),
  );
  const hasOfffieldHydro = ownedCharacters.some(
    (c) => c.element === 'Hydro' && c.roles.includes('Off-Field DPS'),
  );
  const hasTopSustain = ownedCharacters.some(
    (c) => c.roles.includes('Sustain') && (c.rarity === 5 || c.id === 'Bennett' || c.id === 'KukiShinobu'),
  );
  const hasDendroCore = ownedCharacters.some(
    (c) => c.element === 'Dendro' && (c.id === 'Nahida' || c.id === 'Baizhu'),
  );
  const hasNefer = ownedSet.has('Nefer');

  const adviceList: PullAdvice[] = [];

  for (const candidateId of PULL_CANDIDATES) {
    const char = CHARACTERS.find((c) => c.id === candidateId);
    if (!char) continue;

    // RULE 1: IF THE PLAYER ALREADY OWNS THIS CHARACTER, NEVER TELL THEM TO PULL C0!
    if (ownedSet.has(candidateId)) {
      continue;
    }

    let score = 50;
    const unlocked: string[] = [];
    const benefits: string[] = [];
    let caution: string | undefined;

    // Specific character synergy evaluations
    if (char.id === 'Lauma') {
      if (hasNefer) {
        score = 98;
        unlocked.push('Optimal Nefer Lunar-Bloom');
        benefits.push('Your account has Nefer! Lauma elevates Moonsign and shreds Dendro/Hydro resistance simultaneously.');
      } else {
        score = 75;
        benefits.push('Strong off-field Hydro enabler and Moonsign booster for Nod-Krai archetypes.');
      }
    } else if (char.id === 'Furina') {
      if (!hasOfffieldHydro || !hasUniversalBuffer) {
        score = 97;
        unlocked.push('Universal Team Damage Amplification');
        benefits.push('Provides up to +75% all-element damage bonus and autonomous off-field Hydro damage.');
      } else {
        score = 90;
        benefits.push('Top-tier universal support slotting into almost any team.');
      }
      if (!hasTopSustain) {
        caution = 'Requires a teamwide healer (like Baizhu, Xianyun, or Charlotte) to maximize Fanfare stacks.';
      }
    } else if (char.id === 'Xilonen') {
      if (!hasUniversalBuffer) {
        score = 96;
        unlocked.push('Cinder City 40% DMG Buff & 36% Res Shred');
        benefits.push('Zero-energy 36% resistance shred + 40% damage bonus with high-frequency healing.');
      } else {
        score = 88;
        benefits.push('Top-tier Geo and PHEC buffer who replaces or complements Kazuha.');
      }
    } else if (char.id === 'Mavuika') {
      score = 95;
      unlocked.push('Nightsoul Burst & Pyro Supremacy');
      benefits.push('Unrivaled off-field Pyro application with massive teamwide burst damage amplification.');
    } else if (char.id === 'Nahida') {
      if (!hasDendroCore) {
        score = 96;
        unlocked.push('Hyperbloom, Quicken & Bountiful Bloom');
        benefits.push('Absolute cornerstone of all Dendro teams with 1.5U Tri-Karma cleansing and 250 EM share.');
      } else {
        score = 85;
      }
    } else if (char.id === 'KaedeharaKazuha') {
      if (!hasUniversalBuffer) {
        score = 94;
        unlocked.push('Elemental Damage Buffing & CC');
        benefits.push('40% VV resistance shred with tight grouping and smooth rotations.');
      } else {
        score = 82;
      }
    } else if (char.id === 'Zhongli') {
      if (!hasTopSustain) {
        score = 93;
        unlocked.push('Unbreakable Survivability & Universal Shred');
        benefits.push('100% uptime shield that makes your account immune to interruption and shreds 20% all resistances.');
      } else {
        score = 78;
        benefits.push('Premier comfort pick for carry characters vulnerable to knockback.');
      }
    } else if (char.id === 'Neuvillette') {
      score = 92;
      unlocked.push('Self-Sustaining Hydro Hypercarry');
      benefits.push('Extremely easy floor clear with immense area beam damage and built-in healing.');
    } else if (char.id === 'Yelan') {
      if (!hasOfffieldHydro) {
        score = 91;
        unlocked.push('Double Hydro & High Single-Target DPS');
        benefits.push('Coordinated Hydro attacks paired with an escalating 1%–50% damage buff for on-field carries.');
      } else {
        score = 80;
      }
    } else if (char.id === 'Nefer') {
      score = 88;
      unlocked.push('Lunar-Bloom Special Reaction DPS');
      benefits.push('Devastating Dendro on-field carry with unique Seed of Deceit reaction mechanics.');
    } else {
      score = 70;
      benefits.push(`High personal DPS and elemental versatility for endgame challenges.`);
    }

    let tier: PullAdvice['tier'] = 'Situational';
    if (score >= 94) tier = 'Must Pull';
    else if (score >= 85) tier = 'High Value';
    else if (score < 70) tier = 'Skip / Redundant';

    adviceList.push({
      character: char,
      score,
      tier,
      unlockedArchetypes: unlocked,
      accountBenefits: benefits,
      caution,
    });
  }

  // Sort descending by value score
  return adviceList.sort((a, b) => b.score - a.score);
}
