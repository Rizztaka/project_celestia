import type { Character, TeamRecommendation } from '../types/genshin';
import { CHARACTERS } from '../data/characters';

interface ArchetypeTemplate {
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
];

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

export function generateBestTeams(
  availableIds: string[],
  focusCharacterId?: string,
): TeamRecommendation[] {
  const pool = CHARACTERS.filter((c) => availableIds.includes(c.id));
  if (pool.length < 4) {
    // If fewer than 4 owned, fallback to using all characters for guidance
    return generateTeamsFromPool(CHARACTERS, focusCharacterId);
  }
  return generateTeamsFromPool(pool, focusCharacterId);
}

function generateTeamsFromPool(
  pool: Character[],
  focusId?: string,
): TeamRecommendation[] {
  const results: TeamRecommendation[] = [];
  const focus = focusId ? pool.find((c) => c.id === focusId) : undefined;

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
        results.push({
          id: 'team-nefer-lunar',
          name: 'Nefer · Lunar-Bloom Symphony',
          archetype: 'Lunar-Bloom',
          members,
          synergyScore: 98,
          comfortScore: members.some((m) => m.roles.includes('Sustain')) ? 95 : 75,
          reasons: [
            'Nefer converts all blooms into high-velocity Seeds of Deceit.',
            `${bestHydro.name} provides sustained off-field Hydro application to trigger Lunar-Bloom.`,
            `${secondSlot.name} supplies EM boosting or Dendro resonance.`,
            'Special Charged Attacks deal massive non-split Dendro reaction damage.',
          ],
          rotation:
            'Support Skill/Burst → Hydro Enabler Q/E → Nefer E (Shadow Dance) → Special Charged Attack chain',
          resonance: calculateResonance(members),
        });
      }
    }
  }

  // 2. Evaluate all archetype templates
  for (const template of TEMPLATES) {
    if (results.some((r) => r.archetype === template.archetype)) continue;

    // Find candidates matching lead tags
    const leadCandidates = pool.filter((c) =>
      template.leadTags.some((tag) => c.tags.includes(tag)),
    );

    for (const lead of leadCandidates) {
      if (focus && lead.id !== focus.id && !template.supportTags.some((t) => focus.tags.includes(t))) {
        continue;
      }

      // Gather complementary supports: Sub-DPS, Buffer, Sustain
      const others = pool.filter((c) => c.id !== lead.id);

      // Find best buffer
      const buffer =
        others.find((c) => c.roles.includes('Buffer/Shred') && c.id !== lead.id) ||
        others.find((c) => c.tags.includes('VV') || c.tags.includes('Cinder-City'));

      // Find best off-field sub-dps
      const subDps = others.find(
        (c) =>
          c.roles.includes('Off-Field DPS') &&
          c.id !== lead.id &&
          c.id !== buffer?.id &&
          (template.requiredElements ? template.requiredElements.includes(c.element) : true),
      );

      // Find best sustain
      const sustain = others.find(
        (c) =>
          c.roles.includes('Sustain') &&
          c.id !== lead.id &&
          c.id !== buffer?.id &&
          c.id !== subDps?.id,
      );

      const chosen: Character[] = [lead];
      if (subDps) chosen.push(subDps);
      if (buffer && !chosen.includes(buffer)) chosen.push(buffer);
      if (sustain && !chosen.includes(sustain)) chosen.push(sustain);

      // Fill up to 4 if needed
      for (const candidate of others) {
        if (chosen.length >= 4) break;
        if (!chosen.includes(candidate)) {
          chosen.push(candidate);
        }
      }

      if (chosen.length === 4) {
        const hasSustain = chosen.some((m) => m.roles.includes('Sustain'));
        results.push({
          id: `team-${template.archetype}-${lead.id}`.toLowerCase(),
          name: `${lead.name} · ${template.name}`,
          archetype: template.archetype,
          members: chosen,
          synergyScore: template.baseSynergy,
          comfortScore: hasSustain ? 92 : 72,
          reasons: [
            `${lead.name} acts as the core ${lead.roles[0]} driving ${template.archetype}.`,
            `${chosen[1].name} enables high-frequency elemental chain reactions.`,
            `${chosen[2].name} amplifies team damage through buffs and resistance reduction.`,
            hasSustain
              ? `${chosen[3].name} guarantees safe clear windows with survivability.`
              : 'High aggressive offensive output with minimal downtime.',
          ],
          rotation: template.rotation,
          resonance: calculateResonance(chosen),
        });
        break; // One strong variant per archetype
      }
    }
  }

  return results.slice(0, 6);
}
