import { sourceCurrent } from './coverage';
import { setIdentityForSetId, weaponIdentity } from './equipment';
import { profileForCharacter, reviewedRole } from './identity';
import { signature } from './signature';
import { artifactInSlot, setPieceCount } from './snapshot';
import type {
  AnalysisInput,
  CharacterAnalysis,
  Finding,
  FindingCategory,
  FindingStatus,
  FindingValue,
  TriState,
} from './types';
import { artifactSlots, findingCategoryOrder, RULE_PACK_VERSION } from './types';
import { canonicalCombatStat, canonicalEquipmentStat } from './units';

const text = (code: string): FindingValue => ({ kind: 'text', code });
export function orderFindings(findings: Finding[]) {
  return [...findings].sort(
    (a, b) =>
      findingCategoryOrder.indexOf(a.category) - findingCategoryOrder.indexOf(b.category) ||
      (a.slot ?? 0) - (b.slot ?? 0) ||
      a.order - b.order ||
      a.ruleId.localeCompare(b.ruleId, 'en'),
  );
}
export function findingStatus(findings: Finding[]): FindingStatus {
  if (findings.some((f) => f.status === 'needs_attention')) return 'needs_attention';
  if (findings.some((f) => f.status === 'not_enough_data')) return 'not_enough_data';
  if (findings.some((f) => f.status === 'depends_on_conditions')) return 'depends_on_conditions';
  return 'fits';
}
export function analyzeCharacter(
  input: AnalysisInput,
  sourceOverrides?: Record<string, string>,
): CharacterAnalysis {
  const { character: c, roleId: requestedRole, team, hypothesis } = input;
  const hypotheticalSet = hypothesis?.kind === 'set_pieces' ? hypothesis : null;
  const selectedReference = hypotheticalSet ? setReference(hypotheticalSet.setId) : null;
  const effectivePieces = (reference: string) =>
    hypotheticalSet
      ? selectedReference === reference
        ? hypotheticalSet.pieces
        : 0
      : c.equipmentAvailable
        ? setPieceCount(c, reference)
        : 0;
  if (input.uid !== c.uid || input.rulePackVersion !== RULE_PACK_VERSION)
    throw new Error('ANALYSIS_CONTEXT_MISMATCH');
  const profile = c.metadataAvailable ? profileForCharacter(c.avatarId, c.skillDepotId) : null;
  const sourceReady =
    !!profile && profile.evidenceIds.every((id) => sourceCurrent(id, sourceOverrides));
  // C6 Furina/Xilonen alter the scope of the support patterns modeled here.
  const scopeReady = !([10000089, 10000103].includes(c.avatarId) && c.constellation >= 6);
  const observationReady = !c.observationConflict;
  const roleId =
    requestedRole === 'unspecified' && profile && sourceReady && scopeReady && observationReady
      ? profile.defaultRoleId
      : requestedRole;
  const role =
    profile && sourceReady && scopeReady && observationReady ? reviewedRole(profile, roleId) : null;
  const findings: Finding[] = [];
  function add(
    ruleId: string,
    category: FindingCategory,
    condition: TriState,
    status: FindingStatus,
    values: Record<string, FindingValue> = {},
    options: { team?: boolean; hypothesis?: boolean; source?: boolean } = {},
  ) {
    findings.push({
      ruleId,
      category,
      condition,
      status,
      characterKey: c.key,
      slot: team?.members.find((m) => m.characterKey === c.key)?.slot ?? null,
      roleId,
      values,
      evidenceIds: options.source === false ? [] : (profile?.evidenceIds ?? []),
      teamDependent: options.team ?? false,
      hypothesisDependent: options.hypothesis ?? false,
      order: findings.length,
    });
  }
  if (!role)
    add(
      'coverage',
      'missing_data',
      'unknown',
      'not_enough_data',
      {
        reason: text(
          requestedRole === 'general_checks'
            ? 'general_checks_selected'
            : !observationReady
              ? 'observation_conflict'
              : !sourceReady && profile
                ? 'source_changed'
                : !scopeReady
                  ? 'constellation_scope'
                  : profile && roleId === 'unspecified'
                    ? 'choose_role'
                    : 'unsupported',
        ),
      },
      { source: false },
    );
  const weapon =
    observationReady && c.equipmentAvailable && c.weapon ? weaponIdentity(c.weapon.itemId) : null;
  const compatible = c.weaponType && weapon ? c.weaponType === weapon.weaponType : null;
  add(
    'weapon-type',
    compatible === false
      ? 'verified_incompatibility'
      : compatible === null
        ? 'missing_data'
        : 'conditional_alternative',
    compatible === null ? 'unknown' : compatible ? 'true' : 'false',
    compatible === null ? 'not_enough_data' : compatible ? 'fits' : 'needs_attention',
    {},
    { source: false },
  );
  const uniqueSlots = new Set(c.artifacts.map((a) => a.slot));
  const exactArtifacts =
    observationReady &&
    c.equipmentAvailable &&
    c.artifacts.length === 5 &&
    uniqueSlots.size === 5 &&
    !uniqueSlots.has(null);
  const identityGaps = c.artifacts.filter((a) => !a.set?.referenceKey).map((a) => String(a.itemId));
  if (!exactArtifacts || identityGaps.length)
    add(
      'equipment-gaps',
      'missing_data',
      'unknown',
      'not_enough_data',
      { pieces: { kind: 'count', value: c.artifacts.length, of: 5 } },
      { source: false },
    );
  if (role && profile) {
    if ([10000089, 10000043].includes(c.avatarId) && (c.level === null || c.level < 90)) {
      add(
        'character-level',
        c.level === null ? 'missing_data' : 'progression',
        c.level === null ? 'unknown' : 'false',
        c.level === null ? 'not_enough_data' : 'depends_on_conditions',
        {
          level: { kind: 'level', base: c.level ?? 0, bonus: null },
          character: text(profile.referenceKey),
        },
      );
    }
    for (const slot of ['Sands', 'Goblet', 'Circlet'] as const) {
      const artifact = c.equipmentAvailable ? artifactInSlot(c, slot) : null;
      const changed = hypothesis?.kind === 'main_stat' && hypothesis.slot === slot;
      const id = changed ? hypothesis.statId : artifact?.mainStat?.id;
      const stat = id ? canonicalEquipmentStat(id) : null;
      const accepted = [...(role.mainStats[slot] ?? [])];
      // KQM explicitly permits CRIT Rate with Favonius for Xilonen; not a universal target.
      if (c.avatarId === 10000103 && slot === 'Circlet' && weapon?.referenceKey === 'FavoniusSword')
        accepted.push('critRate');
      // Skirk ATK circlet is a conditional alternative with a CRIT-granting set.
      if (
        c.avatarId === 10000114 &&
        slot === 'Circlet' &&
        effectivePieces('MarechausseeHunter') >= 4
      )
        accepted.push('atkPercent');
      const matches = stat ? accepted.includes(stat) : null;
      const mainStatCondition = stat ? role.conditionalMainStats?.[slot]?.[stat] : undefined;
      add(
        `main-stat-${slot}`,
        matches === false
          ? 'source_mismatch'
          : matches === null
            ? 'missing_data'
            : 'conditional_alternative',
        matches === null ? 'unknown' : matches ? 'true' : 'false',
        matches === null
          ? 'not_enough_data'
          : matches
            ? mainStatCondition
              ? 'depends_on_conditions'
              : 'fits'
            : 'needs_attention',
        {
          slot: text(slot),
          actual: text(stat ?? 'unknown'),
          accepted: text(accepted.join(',')),
          context: text(mainStatCondition ?? 'none'),
        },
        { hypothesis: changed },
      );
    }
    // Weapon Tier Ranking from KQM guide
    if (profile.guide?.weapons && profile.guide.weapons.length > 0 && c.weapon) {
      const cleanW = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const weaponKeyClean = cleanW(weapon?.referenceKey ?? c.weapon.referenceKey ?? '');
      const weaponNameClean = cleanW(c.weapon.name ?? weapon?.name ?? '');
      const matchedRec = profile.guide.weapons.find((w) => {
        const recClean = cleanW(w.name);
        return (
          recClean === weaponKeyClean ||
          recClean === weaponNameClean ||
          (weaponNameClean.length > 3 &&
            (weaponNameClean.includes(recClean) || recClean.includes(weaponNameClean)))
        );
      });

      if (matchedRec) {
        add(
          'weapon-tier',
          'conditional_alternative',
          'true',
          matchedRec.tier === 1 ? 'fits' : 'depends_on_conditions',
          {
            weapon: text(matchedRec.name),
            tier: text(String(matchedRec.tier)),
            category: text(matchedRec.category),
          },
        );
      } else {
        add('weapon-tier', 'source_mismatch', 'false', 'needs_attention', {
          weapon: text(c.weapon.name || 'equipped_weapon'),
          tier: text('unranked'),
          category: text('Alternative'),
        });
      }
    }
    const talents = role.talentPriority.map((kind) => c.talents.find((t) => t.kind === kind));
    const allTalentsKnown = talents.every(Boolean);
    const primaryTalentKind = role.talentPriority[0];
    const primaryTalent = c.talents.find((t) => t.kind === primaryTalentKind);
    let talentOrderValid = true;
    if (primaryTalent && talents.length > 1) {
      for (let i = 1; i < role.talentPriority.length; i++) {
        const secondary = c.talents.find((t) => t.kind === role.talentPriority[i]);
        if (secondary && secondary.baseLevel > primaryTalent.baseLevel) {
          talentOrderValid = false;
          break;
        }
      }
    }

    add(
      'talent-priority',
      talentOrderValid ? 'progression' : 'source_mismatch',
      allTalentsKnown ? (talentOrderValid ? 'true' : 'false') : 'unknown',
      allTalentsKnown
        ? talentOrderValid
          ? 'depends_on_conditions'
          : 'needs_attention'
        : 'not_enough_data',
      {
        priority: text(
          role.talentPriorityGroups
            ? role.talentPriorityGroups.map((group) => group.join(' = ')).join(',')
            : role.talentPriority.join(','),
        ),
        character: text(profile.referenceKey),
        ...Object.fromEntries(
          talents.flatMap((t) =>
            t
              ? [[t.kind!, { kind: 'level' as const, base: t.baseLevel, bonus: t.bonusLevel }]]
              : [],
          ),
        ),
      },
    );
    add('stat-priority', 'conditional_alternative', 'true', 'depends_on_conditions', {
      priority: text(role.priorityStats.join(',')),
      character: text(profile.referenceKey),
    });

    // Energy Recharge baseline evaluation against KQM guide
    const erStat = c.stats.find(
      (s) =>
        s.id === 'FIGHT_PROP_CHARGE_EFFICIENCY' || canonicalCombatStat(s.id) === 'energyRecharge',
    );
    const observedEr =
      erStat != null ? (erStat.unit === 'ratio' ? erStat.raw * 100 : erStat.raw) : null;
    const energyGuide = profile.guide?.energyRequirements?.toLowerCase() ?? '';
    const isZeroEr =
      energyGuide.includes('zero er') ||
      energyGuide.includes('skip burst') ||
      energyGuide.includes('not recommended to build er');

    if (observedEr !== null) {
      if (isZeroEr && observedEr > 140) {
        add('energy-context', 'conditional_alternative', 'false', 'depends_on_conditions', {
          reason: text('unnecessary_er'),
          observed: text(`${Math.round(observedEr)}%`),
        });
      } else if (
        (energyGuide.includes('200%') || energyGuide.includes('200%–250%')) &&
        observedEr < 180
      ) {
        add('energy-context', 'source_mismatch', 'false', 'needs_attention', {
          reason: text('energy_deficit'),
          observed: text(`${Math.round(observedEr)}%`),
        });
      } else {
        const specialEnergy = [10000114, 10000043, 10000047].includes(c.avatarId);
        add(
          c.avatarId === 10000114
            ? 'no-energy-burst'
            : c.avatarId === 10000043
              ? 'sucrose-energy'
              : c.avatarId === 10000047
                ? 'kazuha-energy'
                : 'energy-context',
          'conditional_alternative',
          specialEnergy ? 'unknown' : 'true',
          specialEnergy ? 'depends_on_conditions' : 'fits',
          { observed: text(`${Math.round(observedEr)}%`) },
        );
      }
    } else {
      add(
        c.avatarId === 10000114
          ? 'no-energy-burst'
          : c.avatarId === 10000043
            ? 'sucrose-energy'
            : c.avatarId === 10000047
              ? 'kazuha-energy'
              : 'energy-context',
        'conditional_alternative',
        'unknown',
        'depends_on_conditions',
      );
    }

    if (c.avatarId === 10000032)
      add('bennett-buff-scaling', 'conditional_alternative', 'true', 'depends_on_conditions');
    if (c.avatarId === 10000073)
      add('nahida-em-context', 'conditional_alternative', 'unknown', 'depends_on_conditions');

    const preferred =
      role.sets.find((s) => effectivePieces(s.referenceKey) >= s.pieces) ?? role.sets[0];
    const pieces = effectivePieces(preferred.referenceKey);
    const setKnown = hypotheticalSet || (exactArtifacts && !identityGaps.length);
    const setTier = preferred.tier ?? 1;
    const isTier1 = setTier === 1 && pieces >= preferred.pieces;

    add(
      'set-profile',
      pieces >= preferred.pieces
        ? 'conditional_alternative'
        : setKnown
          ? 'source_mismatch'
          : 'missing_data',
      pieces >= preferred.pieces ? 'true' : setKnown ? 'false' : 'unknown',
      pieces >= preferred.pieces
        ? isTier1
          ? 'fits'
          : 'depends_on_conditions'
        : setKnown
          ? 'depends_on_conditions'
          : 'not_enough_data',
      {
        set: text(preferred.referenceKey),
        pieces: { kind: 'pieces', count: pieces },
        tier: text(String(setTier)),
        ...(preferred.label ? { label: text(preferred.label) } : {}),
      },
      { hypothesis: !!hypotheticalSet },
    );
    if (team) {
      const others = team.members.filter((m) => m.characterKey !== c.key);
      const unknown = others.some((m) => !m.character || !m.element) || team.members.length < 4;
      if (c.avatarId === 10000112) {
        const matching =
          1 +
          others.filter((member) => member.element && ['Hydro', 'Cryo'].includes(member.element))
            .length;
        const nonmatching = others.some(
          (member) => member.element && !['Hydro', 'Cryo'].includes(member.element),
        );
        add(
          'escoffier-party',
          'conditional_alternative',
          nonmatching ? 'false' : unknown ? 'unknown' : matching === 4 ? 'true' : 'false',
          'depends_on_conditions',
          { matching: { kind: 'count', value: matching, of: 4 } },
          { team: true },
        );
      }
      if (c.avatarId === 10000114) {
        const invalid = others.some((m) => m.element && !['Hydro', 'Cryo'].includes(m.element));
        const truth = invalid
          ? 'false'
          : unknown
            ? 'unknown'
            : others.some((m) => m.element === 'Hydro')
              ? 'true'
              : 'false';
        add(
          'skirk-team',
          truth === 'false' ? 'source_mismatch' : 'conditional_alternative',
          truth,
          truth === 'false'
            ? 'needs_attention'
            : truth === 'unknown'
              ? 'not_enough_data'
              : 'depends_on_conditions',
          {},
          { team: true },
        );
      }
      if (c.avatarId === 10000103) {
        const eligible = others.filter(
          (m) => m.element && ['Pyro', 'Hydro', 'Electro', 'Cryo'].includes(m.element),
        ).length;
        const truth = eligible >= 2 ? 'true' : unknown ? 'unknown' : 'false';
        add(
          'xilonen-samples',
          truth === 'false' ? 'source_mismatch' : 'conditional_alternative',
          truth,
          truth === 'false'
            ? 'needs_attention'
            : truth === 'unknown'
              ? 'not_enough_data'
              : 'depends_on_conditions',
          { count: { kind: 'count', value: eligible, of: 2 } },
          { team: true },
        );
      }
      if (
        [10000043, 10000047].includes(c.avatarId) &&
        (hypotheticalSet
          ? selectedReference === 'ViridescentVenerer' && hypotheticalSet.pieces >= 4
          : setPieceCount(c, 'ViridescentVenerer') >= 4)
      ) {
        const target = others.some(
          (m) => m.element && ['Pyro', 'Hydro', 'Electro', 'Cryo'].includes(m.element),
        );
        const truth = target ? 'true' : unknown ? 'unknown' : 'false';
        add(
          'vv-target',
          'conditional_alternative',
          truth,
          truth === 'unknown' ? 'not_enough_data' : 'depends_on_conditions',
          {},
          { team: true, hypothesis: !!hypotheticalSet },
        );
      }
      if (
        c.avatarId === 10000114 &&
        (hypotheticalSet
          ? selectedReference === 'MarechausseeHunter' && hypotheticalSet.pieces >= 4
          : setPieceCount(c, 'MarechausseeHunter') >= 4)
      ) {
        const furina = others.find(
          (m) => m.character?.avatarId === 10000089 && m.character.skillDepotId === 8901,
        );
        add(
          'skirk-hunter',
          'conditional_alternative',
          furina ? 'true' : unknown ? 'unknown' : 'false',
          'depends_on_conditions',
          {},
          { team: true, hypothesis: !!hypotheticalSet },
        );
      }
    }
  }
  const ordered = orderFindings(findings);
  return {
    rulePackVersion: RULE_PACK_VERSION,
    uid: input.uid,
    characterKey: c.key,
    roleId,
    roleAssumed: requestedRole === 'unspecified' && !!role,
    teamId: team?.id ?? null,
    hypothesis,
    digest: signature({ input, sourceOverrides }),
    findings: ordered,
    actions: ordered.filter(
      (f) =>
        f.status === 'needs_attention' ||
        (['set-profile', 'character-level'].includes(f.ruleId) && f.condition === 'false'),
    ),
    status: findingStatus(ordered),
    coverage: {
      characterProfile: !!profile && sourceReady && scopeReady && observationReady,
      roleSupported: !!role,
      equipmentAvailable: c.equipmentAvailable,
      identityGaps,
    },
    observedAt: c.observedAt,
  };
}
function setReference(id: number) {
  return setIdentityForSetId(id)?.referenceKey ?? null;
}
export function roleOptions(c: {
  id: number;
  skillDepotId: number | null;
  metadataAvailable: boolean;
  constellation: number;
}) {
  const p = c.metadataAvailable ? profileForCharacter(c.id, c.skillDepotId) : null;
  return p &&
    !([10000089, 10000103].includes(c.id) && c.constellation >= 6) &&
    p.evidenceIds.every((id) => sourceCurrent(id))
    ? p.roles
    : [];
}
export { artifactSlots };
