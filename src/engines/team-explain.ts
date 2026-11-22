import type {
  Character,
  OwnedCharacterProfile,
  TeamWeaponAssignment,
  TeamExplanation,
  CharacterSwapAlternative,
  IdealSupportGap,
} from '../types/genshin';
import { CHARACTERS } from '../data/characters';
import {
  isAllowedTeammate,
  detectBennettC6Conflict,
  detectDualCarryContention,
  detectFurinaHealerDeficit,
  detectArlecchinoHealingConflict,
  detectMavuikaNightsoulDeficit,
  detectFreezeAuraDisruption,
  evaluateEnergyBattery,
} from './team-rules';
import type { ArchetypeTemplate } from './team-generator';

// Specific high-fidelity character rationales across 7.x/5.x meta units
const SPECIFIC_RATIONALES: Record<string, string> = {
  Mavuika: 'Channels immense Nightsoul transmission burst, granting high-multiplier off-field Pyro damage and team ATK buffs.',
  Citlali: 'Deploys sturdy Cryo shield, shreds elemental resistance via Cinder City, and applies constant Cryo off-field.',
  Chasca: 'Fires multi-elemental shadow-piercing bullets in Nightsoul Flight, exploiting diverse team element compositions.',
  Xilonen: 'Applies universal 36% all-element RES shred via Source Samples and activates Scroll of the Hero of Cinder City.',
  Kinich: 'Loops Grappling Hook swing shots in Nightsoul\'s Blessing to fire devastating Scalespiker cannon blasts.',
  Emilie: 'Deploys Lumidouce Case that levels up through Burning reactions to deliver continuous off-field Dendro nukes.',
  Clorinde: 'Fires piercing Wild Hunt pistol shots and Lunging thrusts in Night Vigil, triggering high-frequency reactions.',
  Arlecchino: 'Commands Masquerade of the Red Death via Bond of Life for non-overrideable Pyro normal attack hypercarries.',
  Sigewinne: 'Bounces restorative Rebound Hydro bubbles, delivering party-wide burst healing and skill DMG buffs.',
  Xianyun: 'Enables limitless high-jump plunging attacks for teammates while providing party-wide burst and continuous healing.',
  Navia: 'Fires high-caliber Rosula Shrapnel Gunbrella blasts powered by collected Crystallize shards.',
  Furina: 'Grants continuous off-field Hydro Salon Solitaire attacks and team-wide Fanfare damage amplification.',
  Neuvillette: 'Channels devastating Equitable Judgment Hydro beam scaling directly with Max HP and self-restoring health.',
  Wriothesley: 'Executes rapid-fire Cryo boxing combos enhanced by Chilling Penalty for Freeze and Melt.',
  Lyney: 'Fires Prop Arrow fireworks and summons Grin-Malkin Hat for explosive Mono-Pyro burst nukes.',
  Skirk: 'Manipulates abyssal space with Void-Severing strikes, accelerating freeze shatter cycles.',
  Escoffier: 'Serves culinary Cryo infusions with full-party healing and sub-zero Cryo damage buffs.',
  Varesa: 'Drives scorching Pyro assaults with explosive kinetic impacts and vaporize synergy.',
  Columbina: 'Channels celestial Moonsign resonance, amplifying all elemental reactions and off-field cryo presence.',
  Nefer: 'Drives primary on-field Dendro DMG with Phantasm Performance, absorbing Seeds of Deceit.',
  Bennett: 'Provides massive flat ATK buff via Fantastic Voyage and rapid Pyro particle generation.',
  Xiangling: 'Delivers high-multiplier off-field Pyro AoE damage with Pyronado without ICD.',
  KaedeharaKazuha: 'Gathers enemies with Chihayaburu, applying 40% elemental RES shred via 4pc VV.',
  Xingqiu: 'Provides rapid single-target Hydro rainswords, damage reduction, and stagger resistance.',
  Yelan: 'Deals massive off-field Hydro damage while ramping active character damage up to 50%.',
  Nahida: 'Tri-Karma Purification applies 1.5U Dendro and shares up to 250 EM to active carry.',
  RaidenShogun: 'Recharges team energy with Musou Shinsetsu while boosting burst damage of teammates.',
  Zhongli: 'Deploys an unbreakable Jade Shield with universal 20% all-element and physical RES shred.',
  Chevreuse: 'Triggers 40% Pyro/Electro RES shred and up to 40% ATK boost via Overloaded reactions.',
  Nilou: 'Transforms Dendro Cores into instantaneous Bountiful Cores with increased AoE.',
  Alhaitham: 'Projects Chisel-Light Mirrors for dense off-field and on-field Dendro damage.',
  HuTao: 'Guide to Afterlife converts HP into massive ATK for vaporizing charged attacks.',
  Gaming: "Performs Suanni's Gilded Dance plunging nuke attacks with self-contained HP fluctuation.",
  KamisatoAyaka: 'Frostflake Seki no To delivers frontloaded 20-hit Cryo burst slashes.',
  Keqing: 'Stellar Restoration blinks and delivers high-frequency Aggravate Electro slashes.',
  Eula: 'Glacial Illumination builds Lightfall Sword stacks for immense Physical nuke detonation.',
  Fischl: 'Oz delivers rapid off-field Electro strikes and triggers frequent A4 reaction lightning.',
  KukiShinobu: 'Grass Ring of Sanctification continuously triggers Hyperbloom cores with full EM.',
  Baizhu: 'Seamless Shielding and Healing alongside passive reaction bonus for Dendro cores.',
  SangonomiyaKokomi: 'High-volume Bake-Kurage healing and steady wide-area Hydro application.',
  Faruzan: 'Massive Anemo DMG bonus, Anemo RES shred, and Anemo CRIT DMG buff for Anemo carries.',
  Sucrose: 'Shares party-wide Elemental Mastery while providing crowd control and 4pc VV shred.',
  Charlotte: 'Delivers instant full-party Cryo burst healing and rapid continuous off-field Cryo application.',
  Layla: 'Deploys high-uptime Cryo shield with Shooting Stars off-field Cryo particle generation.',
  Thoma: 'Stacks Crimson Ooyoroi fiery collapses for continuous shielding and Burgeon detonation.',
  Mika: 'Provides party-wide burst healing alongside Physical DMG and ATK SPD acceleration.',
  Gorou: 'Buffs active Geo carries with DEF, Geo DMG Bonus, and Geo CRIT DMG through General\'s Banner.',
};

// Curated reaction workflows per archetype
const REACTION_WORKFLOWS: Record<string, string> = {
  'Lunar-Bloom':
    'Hydro & Dendro Aura → Lunar-Bloom (Seeds of Deceit) → Nefer Shadow Dance Enhanced Charged Attacks',
  'Bountiful-Bloom':
    'Hydro & Dendro Aura → Golden Chalice\'s Bounty (Instant-burst Bountiful Cores) → High AoE Bloom DMG',
  Vaporize:
    'Hydro Application → Buffer / VV Shred → Bennett Burst (ATK Buff) → Pyro Carry Forward/Reverse Vaporize',
  National:
    'Hydro Enabler (Xingqiu/Yelan) Q → Bennett Q → Xiangling Q Pyronado (Snapshot ATK Buff) → Constant Vaporize',
  Hyperbloom:
    'Dendro Application → Hydro Trigger (Dendro Cores) → Full-EM Electro Trigger (Hyperbloom Detonation)',
  Burgeon:
    'Dendro Application → Hydro Trigger (Dendro Cores) → Pyro Trigger (Burgeon AoE Explosion)',
  Quicken:
    'Dendro + Electro Aura (Quicken) → High-frequency Spread / Aggravate Reactions',
  Overload:
    'Electro Aura → Pyro Trigger (Overloaded) → Chevreuse 40% Dual RES Shred → Carry Burst DPS Window',
  Freeze:
    'Hydro Application → Cryo Aura (Freeze CC) → Blizzard Strayer +40% CRIT Rate Burst Execution',
  'Freeze / Melt':
    'Cryo/Hydro Aura Setup → Buffer Shred → High-multiplier Reverse/Forward Melt or Freeze Execution',
  Melt:
    'Cryo/Pyro Aura Setup → Buffer Shred → High-multiplier Reverse/Forward Melt Nuke',
  Crystallize:
    'Geo Attack on Aura → Crystallize Shards → Navia Gunbrella Shrapnel Blasts',
  'Mono-Geo':
    'Gorou General\'s War Banner → Zhongli Shield → Geo Resonance & Albedo/Chiori Off-field → On-field Geo Carry',
  Plunge:
    'Sub-DPS Setup → Xianyun Burst (High Jump + Plunge Buff) → Buffer Burst → Continuous Plunge Attacks',
  'Hydro Hypercarry':
    'Hydro Resonance → Buffer VV / Furina Fanfare → Shield Defense → Hydro Beam / Hydro Slashes',
  'Electro Hypercarry':
    'Electro Resonance → Buffer VV / Sara ATK Buff → Bennett Burst → Raiden / Clorinde On-field Carry',
  'Anemo Hypercarry':
    'Faruzan Burst (Anemo Shred & Buff) → Buffer Shield/ATK → Anemo Carry Plunge or Normal Attack Window',
  Physical:
    'Cryo + Electro Aura (Superconduct -40% Physical RES) → Physical Carry Normal/Charged DPS Sequence',
  'Mono-Pyro':
    'Pyro Resonance (+25% ATK) → Anemo VV Shred (+40% Shred) → Bennett Q → On-Field Pyro Carry Continuous DMG',
  'Mono-Hydro':
    'Hydro Resonance (+25% Max HP) → Anemo VV Shred → Furina Fanfare → Continuous Hydro Slashes',
  'Skirk-Freeze':
    'Cryo & Hydro Application → Escoffier / Furina Buffs → Skirk Void Domain & Sub-Zero Shatter Execution',
};

/**
 * Computes trade-off pros, cons, and explicit reason why the alternative has a lower score.
 */
function evaluateSwapTradeOffs(
  original: Character,
  candidate: Character,
): { pros: string[]; cons: string[]; whyLowerScore: string } {
  const pros: string[] = [];
  const cons: string[] = [];
  let whyLowerScore = '';

  // Element comparison
  if (candidate.element !== original.element) {
    pros.push(`+Introduces ${candidate.element} elemental interactions`);
    cons.push(`-Alters party elemental resonance and energy battery dynamics`);
    whyLowerScore = `Alters party ${original.element} elemental resonance and particle battery generation.`;
  }

  // Specific high-frequency unit comparisons
  if (original.id === 'KaedeharaKazuha' && candidate.id === 'Sucrose') {
    return {
      pros: [
        '+Shares massive flat EM to party via passive talents',
        '+Equips Catalyst weapons (TTDS for +48% ATK buff)',
      ],
      cons: [
        '-Lacks Kazuha\'s direct 40% Elemental DMG Bonus',
        '-Less convenient grouping suction than Chihayaburu',
      ],
      whyLowerScore: "Lacks Kazuha's 40% direct Elemental DMG Bonus and suction crowd control, offering flat EM instead.",
    };
  }
  if (original.id === 'KaedeharaKazuha' && candidate.id === 'Lynette') {
    return {
      pros: ['+Accessible F2P 4★ Anemo VV shredder', '+Ousia Arkhe alignment support'],
      cons: ['-Lacks grouping crowd control', '-No party elemental damage buff'],
      whyLowerScore: "Provides no party elemental damage buff and lacks crowd control grouping.",
    };
  }
  if (original.id === 'Xingqiu' && candidate.id === 'Yelan') {
    return {
      pros: ['+Higher personal off-field damage', '+Ramping +1% to +50% active damage bonus'],
      cons: ['-Lacks damage reduction, stagger resistance, and micro-healing'],
      whyLowerScore: "Trades Xingqiu's defensive damage reduction, stagger resistance, and micro-healing for personal damage.",
    };
  }
  if (original.id === 'Yelan' && candidate.id === 'Xingqiu') {
    return {
      pros: ['+Provides orbital sword defensive damage reduction', '+Generates high energy particles with Sacrificial'],
      cons: ['-Lower personal damage ceiling than Yelan', '-Lacks Yelan\'s ramping damage buff'],
      whyLowerScore: "Lower personal damage ceiling than Yelan and lacks her ramping active damage amplification.",
    };
  }
  if (original.id === 'Zhongli' && (candidate.id === 'Diona' || candidate.id === 'Layla')) {
    return {
      pros: ['+Provides Cryo resonance or reaction application', '+Faster skill cooldowns'],
      cons: ['-Shield duration and strength are lower than Jade Shield', '-Lacks universal 20% all-element RES shred'],
      whyLowerScore: "Lacks Zhongli's universal 20% all-element RES shred and near-impenetrable Jade Shield durability.",
    };
  }
  if (original.id === 'Bennett' && candidate.id === 'Chevreuse') {
    return {
      pros: ['+40% dual Pyro & Electro RES shred for Overload teams', '+Mobile healing without circle restriction'],
      cons: ['-Restricted strictly to Pyro/Electro compositions', '-Lower flat ATK buff than Bennett'],
      whyLowerScore: "Restricts party composition strictly to Pyro and Electro, locking out other elemental supports.",
    };
  }
  if (original.id === 'Furina' && candidate.id === 'SangonomiyaKokomi') {
    return {
      pros: ['+Dedicated team healing with zero party HP drain', '+Hold Thrilling Tales for ATK buff'],
      cons: ['-Lacks Furina\'s massive party-wide Fanfare damage boost', '-Sub-DPS damage is lower'],
      whyLowerScore: "Lacks Furina's massive party-wide Fanfare damage amplification, trading aggressive team scaling for safety.",
    };
  }

  // General role-based comparison
  if (candidate.roles.includes('Sustain') && !original.roles.includes('Sustain')) {
    pros.push('+Adds dedicated survivability (healing / shield)');
  }
  if (!candidate.roles.includes('Sustain') && original.roles.includes('Sustain')) {
    cons.push('-Removes dedicated sustain unit; requires high defensive execution');
    whyLowerScore = 'Removes dedicated sustain protection, leaving the party vulnerable to incoming lethal damage.';
  }
  if (candidate.roles.includes('Buffer/Shred') && !original.roles.includes('Buffer/Shred')) {
    pros.push('+Provides party amplification or resistance shred');
  }
  if (candidate.tags.includes('VV') || candidate.tags.includes('Cinder-City')) {
    pros.push('+Supplies Viridescent Venerer or Cinder City shred buffs');
  }
  if (candidate.rarity > original.rarity) {
    pros.push('+Higher base stats and premium scaling');
  } else if (candidate.rarity < original.rarity) {
    pros.push('+More accessible 4★ constellation progression');
    if (!whyLowerScore) {
      whyLowerScore = 'Lower baseline stats and personal damage scaling than 5★ default.';
    }
  }

  if (pros.length === 0) pros.push(`+Fulfills ${candidate.roles[0]} slot requirements`);
  if (cons.length === 0) cons.push(`-Slightly lower mechanical synergy than default recommendation`);
  if (!whyLowerScore) {
    whyLowerScore = `Provides lower offensive amplification and synergy tag alignment than ${original.name}.`;
  }

  return { pros: pros.slice(0, 2), cons: cons.slice(0, 2), whyLowerScore };
}

function getSupportAdvantage(char: Character, _template: ArchetypeTemplate): string {
  if (char.id === 'Furina') return 'massive team-wide Fanfare damage amplification and off-field Hydro application';
  if (char.id === 'Xilonen') return 'universal 36% all-element RES shred and Cinder City 40% elemental DMG buff';
  if (char.id === 'KaedeharaKazuha') return '40% elemental damage bonus and Viridescent Venerer resistance shred';
  if (char.id === 'Bennett') return 'unmatched flat ATK buff scaling from base weapon ATK and rapid battery generation';
  if (char.id === 'Nahida') return 'unrivaled 1.5U Tri-Karma Dendro application and 250 party Elemental Mastery sharing';
  if (char.id === 'Zhongli') return 'unbreakable Jade Shield protection and universal 20% all-element resistance shred';
  if (char.id === 'Mavuika') return 'Nightsoul burst amplification and high-damage off-field Pyro support';
  if (char.id === 'Baizhu') return 'continuous shields, team-wide burst healing, and reaction bonus amplification';
  if (char.id === 'Chevreuse') return 'dual 40% Pyro & Electro resistance shred and ATK buffs for Overload';
  if (char.id === 'Escoffier') return 'full-party Cryo infusion healing and specialized freeze combat scaling';
  return `${char.roles.join('/')} utility and elemental synergy`;
}

/**
 * Generates natural-language rationales, reaction flow, energy diagnosis,
 * accessible swap alternatives with trade-offs, and ideal missing support gaps.
 */
export function generateTeamExplanation(
  team: Character[],
  template: ArchetypeTemplate,
  availablePool: Character[],
  profiles?: Record<string, OwnedCharacterProfile>,
  weaponAssignments?: TeamWeaponAssignment[],
  scoreTeamFn?: (members: Character[]) => number,
): TeamExplanation {
  // 1. Role rationale per slot
  const roleRationale: Record<string, string> = {};
  for (const member of team) {
    if (SPECIFIC_RATIONALES[member.id]) {
      roleRationale[member.id] = SPECIFIC_RATIONALES[member.id];
    } else if (member.roles.includes('On-Field DPS')) {
      roleRationale[member.id] = `${member.name} acts as the primary on-field carry driving ${template.archetype} damage.`;
    } else if (member.roles.includes('Off-Field DPS')) {
      roleRationale[member.id] = `${member.name} provides sustained off-field ${member.element} application and sub-DPS.`;
    } else if (member.roles.includes('Buffer/Shred')) {
      roleRationale[member.id] = `${member.name} amplifies party damage with buffs and resistance shred.`;
    } else if (member.roles.includes('Sustain')) {
      roleRationale[member.id] = `${member.name} ensures party survivability through reliable healing and shielding.`;
    } else {
      roleRationale[member.id] = `${member.name} fulfills key team synergy requirements.`;
    }
  }

  // 2. Reaction workflow summary
  const reactionWorkflow =
    REACTION_WORKFLOWS[template.archetype] ||
    template.rotation ||
    'Execute support buffs → Enabler skill/burst → On-field carry DPS sequence';

  // 3. Energy assessment
  const energyResult = evaluateEnergyBattery(team, weaponAssignments);
  const energyAssessment = {
    status: energyResult.status,
    warnings: energyResult.warnings,
  };

  // 4. Anti-synergy warnings collection (deduplicated)
  const antiSynergyWarningsList: string[] = [];
  const bennettConflict = detectBennettC6Conflict(team, profiles);
  if (bennettConflict.hasConflict && bennettConflict.warning) {
    antiSynergyWarningsList.push(bennettConflict.warning);
  }
  const dualCarryConflict = detectDualCarryContention(team);
  if (dualCarryConflict.hasContention && dualCarryConflict.warning) {
    antiSynergyWarningsList.push(dualCarryConflict.warning);
  }
  const furinaDeficit = detectFurinaHealerDeficit(team);
  if (furinaDeficit.hasDeficit && furinaDeficit.warning) {
    antiSynergyWarningsList.push(furinaDeficit.warning);
  }
  const arlecchinoConflict = detectArlecchinoHealingConflict(team);
  if (arlecchinoConflict.hasConflict && arlecchinoConflict.warning) {
    antiSynergyWarningsList.push(arlecchinoConflict.warning);
  }
  const mavuikaDeficit = detectMavuikaNightsoulDeficit(team);
  if (mavuikaDeficit.hasDeficit && mavuikaDeficit.warning) {
    antiSynergyWarningsList.push(mavuikaDeficit.warning);
  }
  const freezeDisruption = detectFreezeAuraDisruption(team, template.archetype);
  if (freezeDisruption.hasDisruption && freezeDisruption.warning) {
    antiSynergyWarningsList.push(freezeDisruption.warning);
  }
  if (energyResult.warnings.length > 0) {
    antiSynergyWarningsList.push(...energyResult.warnings);
  }
  const antiSynergyWarnings =
    antiSynergyWarningsList.length > 0 ? Array.from(new Set(antiSynergyWarningsList)) : undefined;

  // 5. Accessible Swap Alternatives (1-2 alternatives per slot)
  const alternatives: CharacterSwapAlternative[] = [];
  const baseTeamScore = scoreTeamFn ? scoreTeamFn(team) : 0;

  for (const member of team) {
    const currentOthers = team.filter((m) => m.id !== member.id);

    const validCandidates = availablePool.filter((c) => {
      if (team.some((m) => m.id === c.id)) return false;
      return isAllowedTeammate(
        template.archetype,
        c,
        currentOthers,
        template.exclusiveElements,
      );
    });

    const scoredCandidates = validCandidates
      .map((c) => {
        let score = 50;
        if (c.roles.some((r) => member.roles.includes(r))) score += 25;
        if (c.element === member.element) score += 15;
        if (c.rarity === 5) score += 5;
        if (profiles?.[c.id]?.level && profiles[c.id].level >= 80) score += 5;
        return { candidate: c, score };
      })
      .sort((a, b) => b.score - a.score);

    for (const item of scoredCandidates.slice(0, 2)) {
      const tradeOffs = evaluateSwapTradeOffs(member, item.candidate);
      let impact: number;
      if (scoreTeamFn) {
        const candidateTeam = [...currentOthers, item.candidate];
        const candidateScore = scoreTeamFn(candidateTeam);
        impact = candidateScore - baseTeamScore;
      } else {
        impact = item.candidate.element === member.element ? 0 : -3;
      }

      alternatives.push({
        originalCharacterId: member.id,
        alternativeCharacter: item.candidate,
        tradeOffPros: tradeOffs.pros,
        tradeOffCons: tradeOffs.cons,
        compatibilityImpact: impact,
        whyLowerScore: tradeOffs.whyLowerScore,
      });
    }
  }

  // 6. Ideal Missing Supports Identification
  const idealMissingSupports: IdealSupportGap[] = [];
  if (template.idealSupports && template.idealSupports.length > 0) {
    const ownedOrTeamIds = new Set([
      ...availablePool.map((c) => c.id),
      ...team.map((c) => c.id),
    ]);

    for (const idealId of template.idealSupports) {
      if (ownedOrTeamIds.has(idealId)) continue;
      const idealChar = CHARACTERS.find((c) => c.id === idealId);
      if (!idealChar) continue;

      // Identify who they would upgrade/replace in the current team
      const currentTeammate =
        team.find((m) => m.roles.some((r) => idealChar.roles.includes(r))) ||
        team.find((m) => m.element === idealChar.element) ||
        team[2] ||
        team[1];

      idealMissingSupports.push({
        characterId: idealChar.id,
        characterName: idealChar.name,
        role: idealChar.roles[0],
        element: idealChar.element,
        replacementForRole: currentTeammate ? currentTeammate.name : 'Support Slot',
        impactSummary: `Unlocking ${idealChar.name} would significantly upgrade this team via ${getSupportAdvantage(idealChar, template)}.`,
      });

      if (idealMissingSupports.length >= 3) break;
    }
  }

  return {
    roleRationale,
    reactionWorkflow,
    energyAssessment,
    alternatives,
    antiSynergyWarnings,
    idealMissingSupports: idealMissingSupports.length > 0 ? idealMissingSupports : undefined,
  };
}
