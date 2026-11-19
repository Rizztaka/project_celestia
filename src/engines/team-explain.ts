import type {
  Character,
  OwnedCharacterProfile,
  TeamWeaponAssignment,
  TeamExplanation,
  CharacterSwapAlternative,
} from '../types/genshin';
import {
  isAllowedTeammate,
  detectBennettC6Conflict,
  detectDualCarryContention,
  evaluateEnergyBattery,
} from './team-rules';
import type { ArchetypeTemplate } from './team-generator';

// Specific high-fidelity character rationales
const SPECIFIC_RATIONALES: Record<string, string> = {
  Nefer: 'Drives primary on-field Dendro DMG with Phantasm Performance, absorbing Seeds of Deceit.',
  Furina: 'Provides sustained off-field Hydro aura and team-wide Fanfare damage amplification.',
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
  Xilonen: 'Applies elemental RES shred via Samplers and holds Scroll of the Hero of Cinder City.',
  Mavuika: 'Nightsoul transmission burst provides immense off-field Pyro and active carry buffs.',
  Xianyun: 'Enables high-jump plunging attacks for party members and delivers continuous healing.',
  Alhaitham: 'Projects Chisel-Light Mirrors for dense off-field and on-field Dendro damage.',
  HuTao: 'Guide to Afterlife converts HP into massive ATK for vaporizing charged attacks.',
  Neuvillette: 'Channels devastating Equitable Judgment Hydro beam scaling directly with Max HP.',
  Clorinde: 'Rapid Night Vigil piercing gun-and-thrust combo driving high-frequency Overload/Aggravate.',
  Navia: 'Fires Rosula Shrapnel Gunbrella blasts powered by collected Crystallize elemental shards.',
  Gaming: "Performs Suanni's Gilded Dance plunging nuke attacks with self-contained HP fluctuation.",
  Wriothesley: 'Fast-paced Cryo boxing combos enhanced by Chilling Penalty for Freeze and Melt.',
  KamisatoAyaka: 'Frostflake Seki no To delivers frontloaded 20-hit Cryo burst slashes.',
  Keqing: 'Stellar Restoration blinks and delivers high-frequency Aggravate Electro slashes.',
  Eula: 'Glacial Illumination builds Lightfall Sword stacks for immense Physical nuke detonation.',
  Fischl: 'Oz delivers rapid off-field Electro strikes and triggers frequent A4 reaction lightning.',
  KukiShinobu: 'Grass Ring of Sanctification continuously triggers Hyperbloom cores with full EM.',
  Baizhu: 'Seamless Shielding and Healing alongside passive reaction bonus for Dendro cores.',
  SangonomiyaKokomi: 'High-volume Bake-Kurage healing and steady wide-area Hydro application.',
  Faruzan: 'Massive Anemo DMG bonus, Anemo RES shred, and Anemo CRIT DMG buff for Anemo carries.',
  Sucrose: 'Shares party-wide Elemental Mastery while providing crowd control and 4pc VV shred.',
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
};

/**
 * Computes trade-off pros and cons when substituting original with candidate.
 */
function evaluateSwapTradeOffs(
  original: Character,
  candidate: Character,
): { pros: string[]; cons: string[] } {
  const pros: string[] = [];
  const cons: string[] = [];

  // Element comparison
  if (candidate.element !== original.element) {
    pros.push(`+Introduces ${candidate.element} elemental interactions`);
    cons.push(`-Alters party elemental resonance and energy battery dynamics`);
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
    };
  }
  if (original.id === 'KaedeharaKazuha' && candidate.id === 'Lynette') {
    return {
      pros: ['+Accessible F2P 4★ Anemo VV shredder', '+Ousia Arkhe alignment support'],
      cons: ['-Lacks grouping crowd control', '-No party elemental damage buff'],
    };
  }
  if (original.id === 'Xingqiu' && candidate.id === 'Yelan') {
    return {
      pros: ['+Higher personal off-field damage', '+Ramping +1% to +50% active damage bonus'],
      cons: ['-Lacks damage reduction, stagger resistance, and micro-healing'],
    };
  }
  if (original.id === 'Yelan' && candidate.id === 'Xingqiu') {
    return {
      pros: ['+Provides orbital sword defensive damage reduction', '+Generates high energy particles with Sacrificial'],
      cons: ['-Lower personal damage ceiling than Yelan', '-Lacks Yelan\'s ramping damage buff'],
    };
  }
  if (original.id === 'Zhongli' && (candidate.id === 'Diona' || candidate.id === 'Layla')) {
    return {
      pros: ['+Provides Cryo resonance or reaction application', '+Faster skill cooldowns'],
      cons: ['-Shield duration and strength are lower than Jade Shield', '-Lacks universal 20% all-element RES shred'],
    };
  }
  if (original.id === 'Bennett' && candidate.id === 'Chevreuse') {
    return {
      pros: ['+40% dual Pyro & Electro RES shred for Overload teams', '+Mobile healing without circle restriction'],
      cons: ['-Restricted strictly to Pyro/Electro compositions', '-Lower flat ATK buff than Bennett'],
    };
  }
  if (original.id === 'Furina' && candidate.id === 'SangonomiyaKokomi') {
    return {
      pros: ['+Dedicated team healing with zero party HP drain', '+Hold Thrilling Tales for ATK buff'],
      cons: ['-Lacks Furina\'s massive party-wide Fanfare damage boost', '-Sub-DPS damage is lower'],
    };
  }

  // General role-based comparison
  if (candidate.roles.includes('Sustain') && !original.roles.includes('Sustain')) {
    pros.push('+Adds dedicated survivability (healing / shield)');
  }
  if (!candidate.roles.includes('Sustain') && original.roles.includes('Sustain')) {
    cons.push('-Removes dedicated sustain unit; requires high defensive execution');
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
  }

  if (pros.length === 0) pros.push(`+Fulfills ${candidate.roles[0]} slot requirements`);
  if (cons.length === 0) cons.push(`-Slightly lower mechanical synergy than default recommendation`);

  return { pros: pros.slice(0, 2), cons: cons.slice(0, 2) };
}

/**
 * Generates natural-language rationales, reaction flow, energy diagnosis,
 * and accessible swap alternatives with trade-offs.
 */
export function generateTeamExplanation(
  team: Character[],
  template: ArchetypeTemplate,
  availablePool: Character[],
  profiles?: Record<string, OwnedCharacterProfile>,
  weaponAssignments?: TeamWeaponAssignment[],
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

  // 4. Anti-synergy warnings collection
  const antiSynergyWarnings: string[] = [];
  const bennettConflict = detectBennettC6Conflict(team, profiles);
  if (bennettConflict.hasConflict && bennettConflict.warning) {
    antiSynergyWarnings.push(bennettConflict.warning);
  }
  const dualCarryConflict = detectDualCarryContention(team);
  if (dualCarryConflict.hasContention && dualCarryConflict.warning) {
    antiSynergyWarnings.push(dualCarryConflict.warning);
  }
  if (energyResult.warnings.length > 0) {
    antiSynergyWarnings.push(...energyResult.warnings);
  }

  // 5. Accessible Swap Alternatives (1-2 alternatives per slot)
  const alternatives: CharacterSwapAlternative[] = [];

  for (const member of team) {
    const currentOthers = team.filter((m) => m.id !== member.id);

    const validCandidates = availablePool.filter((c) => {
      // Must not already be in the team
      if (team.some((m) => m.id === c.id)) return false;
      // Must be allowed by archetype exclusivity rules
      return isAllowedTeammate(
        template.archetype,
        c,
        currentOthers,
        template.exclusiveElements,
      );
    });

    // Score candidates based on matching member's roles and element
    const scoredCandidates = validCandidates
      .map((c) => {
        let score = 50;
        // Role match
        if (c.roles.some((r) => member.roles.includes(r))) score += 25;
        // Same element bonus
        if (c.element === member.element) score += 15;
        // High rarity / investment
        if (c.rarity === 5) score += 5;
        if (profiles?.[c.id]?.level && profiles[c.id].level >= 80) score += 5;
        return { candidate: c, score };
      })
      .sort((a, b) => b.score - a.score);

    // Pick top 1 or 2 candidates
    for (const item of scoredCandidates.slice(0, 2)) {
      const tradeOffs = evaluateSwapTradeOffs(member, item.candidate);
      const impact = item.candidate.element === member.element ? 0 : -3;

      alternatives.push({
        originalCharacterId: member.id,
        alternativeCharacter: item.candidate,
        tradeOffPros: tradeOffs.pros,
        tradeOffCons: tradeOffs.cons,
        compatibilityImpact: impact,
      });
    }
  }

  return {
    roleRationale,
    reactionWorkflow,
    energyAssessment,
    alternatives,
    antiSynergyWarnings: antiSynergyWarnings.length > 0 ? antiSynergyWarnings : undefined,
  };
}
