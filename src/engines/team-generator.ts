import type {
  Character,
  TeamRecommendation,
  OwnedCharacterProfile,
  OwnedWeapon,
} from '../types/genshin';
import { CHARACTERS } from '../data/characters';
import { getWeaponByKey } from '../data/weapons';
import { synthesizeTeamRotation } from './rotation-synthesizer';
import { assignOptimalTeamWeapons } from './weapon-solver';
import { getSavedWeapons } from '../services/storage';

export interface ArchetypeTemplate {
  name: string;
  archetype: string;
  leadTags: string[];
  requiredElements?: string[];
  supportTags: string[];
  rotation: string;
  baseSynergy: number;
}

const TEMPLATES: ArchetypeTemplate[] = [
  {
    name: 'Lunar-Bloom Dominion',
    archetype: 'Lunar-Bloom',
    leadTags: ['Lunar-Bloom'],
    requiredElements: ['Dendro', 'Hydro'],
    supportTags: ['Nod-Krai', 'Hydro-App', 'Dendro-Core', 'EM-Buffer', 'Healer'],
    rotation: 'Support Skill/Burst → Hydro Enabler Burst/Skill → Nefer E (Shadow Dance) → Enhanced Charged Attacks absorbing Seeds of Deceit',
    baseSynergy: 96,
  },
  {
    name: 'Vaporize Ascendance',
    archetype: 'Vaporize',
    leadTags: ['Vaporize'],
    requiredElements: ['Pyro', 'Hydro'],
    supportTags: ['Hydro-App', 'VV', 'Cinder-City', 'Huge-ATK-Buff', 'Universal-Buffer'],
    rotation: 'Hydro Enabler Burst/Skill → Buffer Skill/Burst (VV / Cinder City) → Bennett Q → Pyro Carry Skill & Combo',
    baseSynergy: 94,
  },
  {
    name: 'Hyperbloom Annihilation',
    archetype: 'Hyperbloom',
    leadTags: ['Hyperbloom-Trigger', 'Hyperbloom'],
    requiredElements: ['Dendro', 'Hydro', 'Electro'],
    supportTags: ['Dendro-Core', 'Hydro-App', 'Full-EM'],
    rotation: 'Nahida E Q → Hydro Enabler (Furina/Yelan/Xingqiu) Q E → Kuki E → Driver normal attacks to spawn and detonate cores',
    baseSynergy: 95,
  },
  {
    name: 'Quicken Aggravate / Spread',
    archetype: 'Quicken',
    leadTags: ['Aggravate', 'Spread'],
    requiredElements: ['Dendro', 'Electro'],
    supportTags: ['EM-Buffer', 'VV', 'Cinder-City', 'Electro-Battery'],
    rotation: 'Dendro Applier E Q → Anemo/Geo Swirl/Crystallize shred → Electro Sub-DPS E → On-field Carry Quicken DPS window',
    baseSynergy: 92,
  },
  {
    name: 'Nightsoul Overload Assault',
    archetype: 'Overload',
    leadTags: ['Overload-Only', 'Overload'],
    requiredElements: ['Pyro', 'Electro'],
    supportTags: ['Nightsoul', 'RES-Shred', 'ATK-Buffer', 'Fighting-Spirit'],
    rotation: 'Electro Sub-DPS E → Chevreuse Hold E (trigger Overload & shred) → Bennett Q / Mavuika Q → Electro/Pyro Carry DPS',
    baseSynergy: 91,
  },
  {
    name: 'Glacial Freeze / Melt',
    archetype: 'Freeze / Melt',
    leadTags: ['Freeze', 'Melt'],
    requiredElements: ['Cryo'],
    supportTags: ['Hydro-App', 'VV', 'Cryo-Buff', 'Nightsoul'],
    rotation: 'Cryo support E Q → Anemo VV Shred / Hydro Freeze → Enabler Burst → Cryo carry frontloaded burst/punches',
    baseSynergy: 89,
  },
  {
    name: 'Cinder Shrapnel Crystallize',
    archetype: 'Crystallize',
    leadTags: ['Gunbrella', 'Cinder-City'],
    requiredElements: ['Geo'],
    supportTags: ['Universal-Buffer', 'Hydro-App', 'Huge-ATK-Buff'],
    rotation: 'Zhongli/Xilonen E Q → Hydro/Pyro Off-field Q E → Navia Q E (Gunbrella blasts upon collecting 3-6 shards)',
    baseSynergy: 90,
  },
  {
    name: 'Plunge Liberation',
    archetype: 'Plunge',
    leadTags: ['Plunge-Buffer', 'Plunge-Nuke', 'Plunge-AoE'],
    requiredElements: ['Anemo'],
    supportTags: ['Team-Healer', 'Hydro-App', 'Universal-Buffer', 'Huge-ATK-Buff'],
    rotation: 'Sub-DPS E Q → Xianyun E Q (Jump buff + healing) → Bennett Q → Carry continuous high-jump plunge attacks',
    baseSynergy: 92,
  },
  {
    name: 'Tidal Hypercarry',
    archetype: 'Hydro Hypercarry',
    leadTags: ['Hydro', 'Catalyst', 'On-Field DPS'],
    requiredElements: ['Hydro'],
    supportTags: ['Universal-Buffer', 'VV', 'Team-Healer', 'Hydro-App'],
    rotation: 'Support Skill/Burst → Buffer VV Shred / Shield → Hydro enabler → Hydro Carry continuous attacks',
    baseSynergy: 94,
  },
];

/**
 * Evaluates candidate character suitability for a team slot across 4 dimensions:
 * 1. Role match (up to 30 pts)
 * 2. Elemental resonance & archetype elemental requirements (up to 25 pts)
 * 3. Synergy tag overlap with template (up to 25 pts)
 * 4. Armory weapon availability & profile investment (up to 20 pts)
 * Total: 0–100 pts
 */
export function scoreCandidateForSlot(
  candidate: Character,
  role: 'Buffer' | 'SubDPS' | 'Sustain',
  template: ArchetypeTemplate,
  currentMembers: Character[],
  weaponBag: OwnedWeapon[],
  profiles?: Record<string, OwnedCharacterProfile>,
): number {
  let roleScore = 0;
  let resonanceScore = 0;
  let tagScore = 0;
  let weaponScore = 0;

  // 1. Role match (up to 30 pts)
  if (role === 'Buffer') {
    if (candidate.roles.includes('Buffer/Shred')) {
      roleScore += 20;
    }
    const bufferTags = [
      'Universal-Buffer',
      'VV',
      'Cinder-City',
      'ATK-Buffer',
      'EM-Buffer',
      'RES-Shred',
      'Huge-ATK-Buff',
    ];
    if (candidate.tags.some((t) => bufferTags.includes(t))) {
      roleScore += 10;
    }
  } else if (role === 'SubDPS') {
    if (candidate.roles.includes('Off-Field DPS')) {
      roleScore += 25;
    } else if (candidate.roles.includes('On-Field DPS')) {
      roleScore += 10;
    }
    const subDpsTags = ['Hydro-App', 'Electro-Battery', 'Dendro-Core', 'Nightsoul', 'Off-Field'];
    if (candidate.tags.some((t) => subDpsTags.includes(t))) {
      roleScore += 5;
    }
  } else if (role === 'Sustain') {
    if (candidate.roles.includes('Sustain')) {
      roleScore += 25;
    }
    const sustainTags = ['Healer', 'Shield', 'Team-Healer'];
    if (candidate.tags.some((t) => sustainTags.includes(t))) {
      roleScore += 5;
    }
  }
  roleScore = Math.min(30, Math.max(0, roleScore));

  // 2. Elemental resonance & required elements (up to 25 pts)
  if (template.requiredElements && template.requiredElements.includes(candidate.element)) {
    const isMissingRequired = !currentMembers.some((m) => m.element === candidate.element);
    resonanceScore += isMissingRequired ? 20 : 10;
  }
  const sameElementCount = currentMembers.filter((m) => m.element === candidate.element).length;
  if (sameElementCount === 1) {
    // Adding candidate creates a 2-member resonance
    resonanceScore += 5;
  }
  resonanceScore = Math.min(25, Math.max(0, resonanceScore));

  // 3. Synergy tag overlap (up to 25 pts)
  if (template.supportTags && template.supportTags.length > 0) {
    let matchedCount = 0;
    for (const tag of template.supportTags) {
      if (candidate.tags.includes(tag)) {
        matchedCount++;
      }
    }
    tagScore += matchedCount * 7;
  }
  if (
    candidate.tags.includes('VV') ||
    candidate.tags.includes('Cinder-City') ||
    candidate.tags.includes('Universal-Buffer')
  ) {
    tagScore += 6;
  }
  tagScore = Math.min(25, Math.max(0, tagScore));

  // 4. Weapon availability & investment in armory (up to 20 pts)
  weaponScore = 8; // Baseline class availability
  if (weaponBag && weaponBag.length > 0) {
    const matchingWeapons = weaponBag.filter((w) => {
      const db = getWeaponByKey(w.key) || getWeaponByKey(w.name);
      return db && db.weaponType === candidate.weapon;
    });

    if (matchingWeapons.length > 0) {
      const has5Star = matchingWeapons.some((w) => {
        const db = getWeaponByKey(w.key) || getWeaponByKey(w.name);
        return db && db.rarity === 5;
      });
      const has4Star = matchingWeapons.some((w) => {
        const db = getWeaponByKey(w.key) || getWeaponByKey(w.name);
        return db && db.rarity === 4;
      });

      if (has5Star) {
        weaponScore = 14;
      } else if (has4Star) {
        weaponScore = 10;
      }
    }
  }

  if (profiles && profiles[candidate.id]) {
    const prof = profiles[candidate.id];
    if (prof.level >= 80) weaponScore += 3;
    if (prof.constellation > 0) weaponScore += 3;
  }
  weaponScore = Math.min(20, Math.max(0, weaponScore));

  return Math.min(100, Math.max(0, roleScore + resonanceScore + tagScore + weaponScore));
}

function calculateResonance(members: Character[]): string[] {
  const counts: Record<string, number> = {};
  for (const m of members) {
    counts[m.element] = (counts[m.element] || 0) + 1;
  }
  const resonances: string[] = [];
  if (counts['Pyro'] >= 2) resonances.push('Fervent Flames: +25% ATK');
  if (counts['Hydro'] >= 2) resonances.push('Soothing Water: +25% Max HP');
  if (counts['Dendro'] >= 2) resonances.push('Sprawling Greenery: +50 to +100 EM');
  if (counts['Cryo'] >= 2) resonances.push('Shattering Ice: +15% CRIT Rate against Frozen/Cryo');
  if (counts['Geo'] >= 2) resonances.push('Enduring Rock: +15% Shield Strength & +15% DMG dealt');
  if (counts['Anemo'] >= 2) resonances.push('Impetuous Winds: -15% Stamina & +10% Movement Speed');
  if (counts['Electro'] >= 2) resonances.push('High Voltage: Electro reactions generate Energy particles');
  return resonances;
}

export function applyConstellationModifiers(
  team: Character[],
  baseSynergy: number,
  profiles?: Record<string, OwnedCharacterProfile>,
): { synergyScore: number; extraReasons: string[] } {
  if (!profiles) return { synergyScore: baseSynergy, extraReasons: [] };

  let synergyScore = baseSynergy;
  const extraReasons: string[] = [];

  for (const member of team) {
    const prof = profiles[member.id];
    if (!prof) continue;

    const c = prof.constellation;
    if (member.id === 'Xiangling' && c >= 4) {
      synergyScore += 4;
      extraReasons.push('Xiangling C4: Pyronado duration increased by +40% (+4s uptime).');
    }
    if (member.id === 'Bennett' && c >= 1) {
      synergyScore += 3;
      extraReasons.push('Bennett C1: Fantastic Voyage ATK buff has no HP restriction.');
    }
    if (member.id === 'Bennett' && c >= 6) {
      const hasPhysicalOrConflict = team.some((m) =>
        ['Eula', 'Razor', 'Keqing', 'Ayaka'].includes(m.id),
      );
      if (hasPhysicalOrConflict) {
        extraReasons.push(
          'Caution: Bennett C6 Pyro Infusion overrides Physical/Normal attack damage.',
        );
      } else {
        const hasPyroMelee = team.some(
          (m) =>
            m.id !== 'Bennett' &&
            m.element === 'Pyro' &&
            ['Sword', 'Claymore', 'Polearm'].includes(m.weapon),
        );
        if (hasPyroMelee) {
          synergyScore += 3;
          extraReasons.push(
            'Bennett C6: +15% Pyro DMG Bonus for Sword, Claymore, and Polearm carries.',
          );
        }
      }
    }
    if (member.id === 'Faruzan' && c >= 6) {
      synergyScore += 7;
      extraReasons.push(
        'Faruzan C6: Pressurized Collapse pressurized vortexes provide massive Anemo CRIT DMG & energy particles.',
      );
    }
    if (member.id === 'Furina' && c >= 2) {
      synergyScore += 6;
      extraReasons.push(
        'Furina C2: Hyper-accelerated Fanfare ramping and massive HP overflow.',
      );
    } else if (member.id === 'Furina' && c >= 1) {
      synergyScore += 3;
      extraReasons.push('Furina C1: Grants 150 immediate Fanfare stacks on Burst cast.');
    }
    if (member.id === 'Nahida' && c >= 2) {
      synergyScore += 6;
      extraReasons.push('Nahida C2: Critical Bloom/Hyperbloom & Quicken DEF shred.');
    }
    if (member.id === 'RaidenShogun' && c >= 2) {
      synergyScore += 6;
      extraReasons.push(
        'Raiden Shogun C2: Secret Art: Musou Shinsetsu ignores 60% of opponent DEF.',
      );
    }
    if (member.id === 'Xilonen' && c >= 2) {
      synergyScore += 5;
      extraReasons.push(
        'Xilonen C2: Universal party buffs based on element types without triggering Sampler state.',
      );
    }
  }

  return { synergyScore: Math.min(100, synergyScore), extraReasons };
}

export function generateBestTeams(
  availableIds: string[],
  focusCharacterId?: string,
  rosterProfiles?: Record<string, OwnedCharacterProfile>,
  ownedWeapons?: OwnedWeapon[],
  allowCatalogFallback: boolean = false,
): TeamRecommendation[] {
  const ownedSet = new Set(availableIds);
  const pool = CHARACTERS.filter((c) => ownedSet.has(c.id));

  // If focus character is specified and not owned:
  if (focusCharacterId && !ownedSet.has(focusCharacterId)) {
    if (!allowCatalogFallback) {
      return [];
    }
    const catalogPool = CHARACTERS.map((c) => ({
      ...c,
      isOwned: ownedSet.has(c.id),
    }));
    const teams = generateTeamsFromPool(catalogPool, focusCharacterId, rosterProfiles, ownedWeapons);
    return teams.map((t) => ({ ...t, isTheoretical: true }));
  }

  if (pool.length < 4) {
    if (!allowCatalogFallback) {
      return [];
    }
    const catalogPool = CHARACTERS.map((c) => ({
      ...c,
      isOwned: ownedSet.has(c.id),
    }));
    const teams = generateTeamsFromPool(catalogPool, focusCharacterId, rosterProfiles, ownedWeapons);
    return teams.map((t) => ({ ...t, isTheoretical: true }));
  }

  const ownedPool = pool.map((c) => ({
    ...c,
    isOwned: true,
  }));
  return generateTeamsFromPool(ownedPool, focusCharacterId, rosterProfiles, ownedWeapons);
}

export const generateTeamRecommendations = generateBestTeams;

function generateTeamsFromPool(
  pool: Character[],
  focusId?: string,
  rosterProfiles?: Record<string, OwnedCharacterProfile>,
  ownedWeapons?: OwnedWeapon[],
): TeamRecommendation[] {
  const results: TeamRecommendation[] = [];
  const focus = focusId ? pool.find((c) => c.id === focusId) : undefined;
  const weaponBag = ownedWeapons || getSavedWeapons();

  // 1. Check for Nefer first if present or focused
  const nefer = pool.find((c) => c.id === 'Nefer');
  if ((!focus || focus.id === 'Nefer') && nefer) {
    const hydroPartners = pool.filter((c) => c.element === 'Hydro' && c.id !== 'Nefer');
    const dendroOrBuffers = pool.filter(
      (c) =>
        c.id !== 'Nefer' &&
        (c.element === 'Dendro' ||
          c.roles.includes('Buffer/Shred') ||
          c.roles.includes('Sustain')),
    );

    if (hydroPartners.length >= 1 && dendroOrBuffers.length >= 2) {
      const bestHydro =
        hydroPartners.find((c) => c.id === 'Lauma') ||
        hydroPartners.find((c) => c.id === 'Furina') ||
        hydroPartners.find((c) => c.id === 'Yelan') ||
        hydroPartners.find((c) => c.id === 'Xingqiu') ||
        hydroPartners[0];

      const remainingBuffers = dendroOrBuffers.filter((c) => c.id !== bestHydro.id);
      const secondSlot =
        remainingBuffers.find((c) => c.id === 'Nahida') ||
        remainingBuffers.find((c) => c.id === 'Baizhu') ||
        remainingBuffers[0];
      const thirdSlot =
        remainingBuffers.find(
          (c) => c.id !== secondSlot.id && (c.roles.includes('Sustain') || c.id === 'KukiShinobu'),
        ) ||
        remainingBuffers.find((c) => c.id !== secondSlot.id) ||
        pool.find((c) => ![nefer.id, bestHydro.id, secondSlot.id].includes(c.id))!;

      if (thirdSlot) {
        const members = [nefer, bestHydro, secondSlot, thirdSlot];
        const stepped = synthesizeTeamRotation(members);
        const neferMods = applyConstellationModifiers(members, 98, rosterProfiles);
        const weaponAssignments = assignOptimalTeamWeapons(members, weaponBag, rosterProfiles);
        results.push({
          id: 'team-nefer-lunar',
          name: 'Nefer · Lunar-Bloom Symphony',
          archetype: 'Lunar-Bloom',
          members,
          synergyScore: neferMods.synergyScore,
          compositionCompatibilityScore: neferMods.synergyScore,
          comfortScore: members.some((m) => m.roles.includes('Sustain')) ? 95 : 75,
          reasons: [
            'Nefer converts all blooms into high-velocity Seeds of Deceit.',
            `${bestHydro.name} provides sustained off-field Hydro application to trigger Lunar-Bloom.`,
            `${secondSlot.name} supplies EM boosting or Dendro resonance.`,
            'Special Charged Attacks deal massive non-split Dendro reaction damage.',
            ...neferMods.extraReasons,
          ],
          rotation:
            stepped.summaryString ||
            'Support Skill/Burst → Hydro Enabler Q/E → Nefer E (Shadow Dance) → Special Charged Attack chain',
          steppedRotation: stepped,
          resonance: calculateResonance(members),
          weaponAssignments,
        });
      }
    }
  }

  // 2. Evaluate all archetype templates
  for (const template of TEMPLATES) {
    if (results.some((r) => r.archetype === template.archetype)) continue;

    // Find candidates matching lead tags or focus
    const focusCanLead =
      focus &&
      (template.leadTags.some((tag) => focus.tags.includes(tag)) ||
        (focus.roles.includes('On-Field DPS') &&
          (!template.requiredElements || template.requiredElements.includes(focus.element))));

    const leadCandidates = pool.filter((c) => {
      if (focusCanLead) {
        return c.id === focus.id;
      }
      if (focus && c.id === focus.id) {
        return template.leadTags.some((tag) => c.tags.includes(tag));
      }
      return (
        template.leadTags.some((tag) => c.tags.includes(tag)) ||
        (c.roles.includes('On-Field DPS') &&
          (!template.requiredElements || template.requiredElements.includes(c.element)))
      );
    });

    for (const lead of leadCandidates) {
      if (focus && lead.id !== focus.id) {
        const canFitAsSupport =
          template.supportTags.some((t) => focus.tags.includes(t)) ||
          (template.requiredElements ? template.requiredElements.includes(focus.element) : false) ||
          focus.roles.some((r) => ['Off-Field DPS', 'Buffer/Shred', 'Sustain'].includes(r));
        if (!canFitAsSupport) continue;
      }

      // Gather complementary supports: Sub-DPS, Buffer, Sustain
      const others = pool.filter((c) => c.id !== lead.id);

      const chosen: Character[] = [lead];
      if (focus && focus.id !== lead.id && !chosen.some((m) => m.id === focus.id)) {
        chosen.push(focus);
      }

      // If template has requiredElements not yet in chosen, prioritize fulfilling them first
      const missingElements = (template.requiredElements || []).filter(
        (el) => !chosen.some((m) => m.element === el),
      );

      for (const missingEl of missingElements) {
        if (chosen.length >= 4) break;
        const matchingCandidates = others
          .filter((c) => !chosen.some((m) => m.id === c.id) && c.element === missingEl)
          .map((c) => {
            const sSub = scoreCandidateForSlot(c, 'SubDPS', template, chosen, weaponBag, rosterProfiles);
            const sBuf = scoreCandidateForSlot(c, 'Buffer', template, chosen, weaponBag, rosterProfiles);
            const sSus = scoreCandidateForSlot(c, 'Sustain', template, chosen, weaponBag, rosterProfiles);
            return { character: c, score: Math.max(sSub, sBuf, sSus) };
          })
          .sort((a, b) => b.score - a.score);

        if (matchingCandidates.length > 0) {
          chosen.push(matchingCandidates[0].character);
        }
      }

      // Check missing roles
      const needsSubDps = !chosen.some((m) => m.roles.includes('Off-Field DPS'));
      const needsBuffer = !chosen.some(
        (m) =>
          m.roles.includes('Buffer/Shred') ||
          m.tags.includes('VV') ||
          m.tags.includes('Cinder-City') ||
          m.tags.includes('Universal-Buffer'),
      );
      const needsSustain = !chosen.some((m) => m.roles.includes('Sustain'));

      // Slot 1: Best Sub-DPS (Off-Field DPS enabler) if still needed
      if (needsSubDps && chosen.length < 4) {
        const subDpsCandidates = others
          .filter((c) => !chosen.some((m) => m.id === c.id))
          .map((c) => ({
            character: c,
            score: scoreCandidateForSlot(c, 'SubDPS', template, chosen, weaponBag, rosterProfiles),
          }))
          .sort((a, b) => b.score - a.score);

        if (subDpsCandidates.length > 0 && subDpsCandidates[0].score >= 20) {
          chosen.push(subDpsCandidates[0].character);
        }
      }

      // Slot 2: Best Buffer / Shred if still needed
      if (needsBuffer && chosen.length < 4) {
        const bufferCandidates = others
          .filter((c) => !chosen.some((m) => m.id === c.id))
          .map((c) => ({
            character: c,
            score: scoreCandidateForSlot(c, 'Buffer', template, chosen, weaponBag, rosterProfiles),
          }))
          .sort((a, b) => b.score - a.score);

        if (bufferCandidates.length > 0 && bufferCandidates[0].score >= 20) {
          chosen.push(bufferCandidates[0].character);
        }
      }

      // Slot 3: Best Sustain (Healer / Shielder) if still needed
      if (needsSustain && chosen.length < 4) {
        const sustainCandidates = others
          .filter((c) => !chosen.some((m) => m.id === c.id))
          .map((c) => ({
            character: c,
            score: scoreCandidateForSlot(c, 'Sustain', template, chosen, weaponBag, rosterProfiles),
          }))
          .sort((a, b) => b.score - a.score);

        if (sustainCandidates.length > 0 && sustainCandidates[0].score >= 20) {
          chosen.push(sustainCandidates[0].character);
        }
      }

      // Fill remaining slots up to 4 if needed using best general score
      while (chosen.length < 4) {
        const remaining = others
          .filter((c) => !chosen.some((m) => m.id === c.id))
          .map((c) => {
            const sSub = scoreCandidateForSlot(c, 'SubDPS', template, chosen, weaponBag, rosterProfiles);
            const sBuf = scoreCandidateForSlot(c, 'Buffer', template, chosen, weaponBag, rosterProfiles);
            const sSus = scoreCandidateForSlot(c, 'Sustain', template, chosen, weaponBag, rosterProfiles);
            return { character: c, score: Math.max(sSub, sBuf, sSus) };
          })
          .sort((a, b) => b.score - a.score);

        if (remaining.length === 0) break;
        chosen.push(remaining[0].character);
      }

      // Ensure all required elements are present
      if (
        template.requiredElements &&
        !template.requiredElements.every((el) => chosen.some((m) => m.element === el))
      ) {
        continue;
      }

      if (chosen.length === 4) {
        const hasSustain = chosen.some((m) => m.roles.includes('Sustain'));
        const stepped = synthesizeTeamRotation(chosen);
        const constMods = applyConstellationModifiers(chosen, template.baseSynergy, rosterProfiles);
        const weaponAssignments = assignOptimalTeamWeapons(chosen, weaponBag, rosterProfiles);
        results.push({
          id: `team-${template.archetype}-${lead.id}`.toLowerCase(),
          name: `${lead.name} · ${template.name}`,
          archetype: template.archetype,
          members: chosen,
          synergyScore: constMods.synergyScore,
          compositionCompatibilityScore: constMods.synergyScore,
          comfortScore: hasSustain ? 92 : 72,
          reasons: [
            `${lead.name} acts as the core ${lead.roles[0]} driving ${template.archetype}.`,
            `${chosen[1].name} enables high-frequency elemental chain reactions.`,
            `${chosen[2].name} amplifies team damage through buffs and resistance reduction.`,
            hasSustain
              ? `${chosen[3].name} guarantees safe clear windows with survivability.`
              : 'High aggressive offensive output with minimal downtime.',
            ...constMods.extraReasons,
          ],
          rotation: stepped.summaryString || template.rotation,
          steppedRotation: stepped,
          resonance: calculateResonance(chosen),
          weaponAssignments,
        });
        break; // One strong variant per archetype
      }
    }
  }

  if (focus) {
    return results.filter((r) => r.members.some((m) => m.id === focus.id)).slice(0, 6);
  }

  return results.slice(0, 6);
}
