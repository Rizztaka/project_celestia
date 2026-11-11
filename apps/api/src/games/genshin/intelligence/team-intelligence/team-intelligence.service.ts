import type {
  CandidateEndgameTeam,
  ElementalShieldType,
  MemberGearSummary,
} from '@celestia/api-contracts';
import { createRequire } from 'module';

import { UnprocessableError } from '@/core/errors/app-error.js';

import {
  AccountContextProvider,
  type Artifact,
  resolveCharacterFormIdentity,
  resolveCharacterKey,
} from '../../account-data/account-context-provider.service.js';
import type { CharacterWithWeapon } from '../../characters/character.repository.js';
import { GenshinCharacterService } from '../../characters/character.service.js';
import { ImportedAccountService } from '../../importer/imported-account.service.js';
import { ShowcaseService } from '../../showcase/showcase.service.js';
import type { ShowcaseCharacterRecord } from '../readiness-intelligence/readiness-input.adapter.js';
import {
  type CharacterInput,
  scoreAllTemplates,
  type TeamScoreBreakdown,
  type TeamTemplate,
  type TemplateRoleResult,
} from './team-intelligence.calculator.js';
import { explainTeamScore } from './team-intelligence.explainer.js';

// -------------------------------------------------------
// Static data — loaded once at module init
// -------------------------------------------------------

const require = createRequire(import.meta.url);

const { templates: META_TEMPLATES } = require('../../static/team-templates.json') as {
  templates: TeamTemplate[];
};

const CHARACTER_ELEMENTS = require('../../static/character-elements.json') as Record<
  string,
  string
>;

const VALID_PRIMARY_ELEMENTS = new Set<ElementalShieldType>([
  'Pyro',
  'Hydro',
  'Cryo',
  'Electro',
  'Geo',
  'Dendro',
]);

const SHIELDERS = new Set([
  'Zhongli',
  'Layla',
  'Kirara',
  'Diona',
  'Thoma',
  'Noelle',
  'Citlali',
  'Dehya',
  'Baizhu',
]);

const HEALERS = new Set([
  'Bennett',
  'SangonomiyaKokomi',
  'Kokomi',
  'Baizhu',
  'Jean',
  'Xianyun',
  'KukiShinobu',
  'Yaoyao',
  'Barbara',
  'Charlotte',
  'Sigewinne',
  'Chevreuse',
  'Qiqi',
  'Dori',
  'Mika',
  'Noelle',
]);

// -------------------------------------------------------
// Response types
// -------------------------------------------------------

export interface TeamRosterSlot {
  roleId: string;
  label: string;
  element: string | null;
  characterKey: string | null;
  investmentScore: number;
  isRequired: boolean;
  flex: boolean;
}

export interface TeamRecommendation {
  rank: number;
  templateId: string;
  templateName: string;
  archetype: string;
  reaction: string;
  score: number;
  isBuildable: boolean;
  roster: TeamRosterSlot[];
  explanations: string[];
}

export interface TeamIntelligenceResponse {
  recommendations: TeamRecommendation[];
  analysedAt: string;
}

export type RosterRecordInput = CharacterInput | CharacterWithWeapon | ShowcaseCharacterRecord;

// -------------------------------------------------------
// Normalization Helpers
// -------------------------------------------------------

function isShowcaseRecord(entry: RosterRecordInput): entry is ShowcaseCharacterRecord {
  return 'key' in entry && !('characterKey' in entry);
}

function extractShowcaseTalent(
  talents: ShowcaseCharacterRecord['talents'],
  kind: 'normal' | 'skill' | 'burst',
  fallbackIdx: number,
): number {
  if (!talents) return 6;
  if (!Array.isArray(talents)) {
    const talentMap = talents as Record<'normal' | 'skill' | 'burst', number | null>;
    const val = talentMap[kind];
    return typeof val === 'number' && Number.isFinite(val) ? val : 6;
  }
  const byKind = talents.find((t) => t.kind === kind);
  if (byKind && typeof byKind.baseLevel === 'number') return byKind.baseLevel;
  const byIndex = talents[fallbackIdx];
  if (byIndex && typeof byIndex.baseLevel === 'number') return byIndex.baseLevel;
  return 6;
}

export function normalizeRosterToCharacterInputs(
  roster: ReadonlyArray<RosterRecordInput>,
): CharacterInput[] {
  return roster.map((entry) => {
    if (isShowcaseRecord(entry)) {
      const characterKey = resolveCharacterKey(entry.key, entry.id, entry.name);
      const level = entry.level ?? 1;
      const defaultAscension =
        level >= 80 ? 6 : level >= 70 ? 5 : level >= 60 ? 4 : level >= 40 ? 2 : 0;
      const wKey = entry.weapon?.weaponKey ?? entry.weapon?.key ?? entry.weapon?.name ?? null;
      return {
        characterKey,
        level,
        ascension: entry.ascension ?? defaultAscension,
        constellation: entry.constellation ?? 0,
        talentNormal: extractShowcaseTalent(entry.talents, 'normal', 0),
        talentSkill: extractShowcaseTalent(entry.talents, 'skill', 1),
        talentBurst: extractShowcaseTalent(entry.talents, 'burst', 2),
        equippedWeapon:
          entry.weapon && wKey
            ? {
                weaponKey: wKey.replace(/[^A-Za-z0-9_]/g, '') || wKey,
                level: entry.weapon.level ?? 1,
                refinement: entry.weapon.refinement ?? 1,
              }
            : null,
      };
    }

    return {
      characterKey: entry.characterKey,
      level: entry.level,
      ascension: entry.ascension,
      constellation: entry.constellation,
      talentNormal: entry.talentNormal,
      talentSkill: entry.talentSkill,
      talentBurst: entry.talentBurst,
      equippedWeapon: entry.equippedWeapon
        ? {
            weaponKey: entry.equippedWeapon.weaponKey,
            level: entry.equippedWeapon.level,
            refinement: entry.equippedWeapon.refinement,
          }
        : null,
    };
  });
}

function computeTeamComfortScore(memberKeys: ReadonlyArray<string>): number {
  let score = 45;
  let hasShielder = false;
  let hasHealer = false;

  for (const key of memberKeys) {
    if (SHIELDERS.has(key)) {
      hasShielder = true;
      score += 25;
    }
    if (HEALERS.has(key)) {
      hasHealer = true;
      score += 20;
    }
  }

  if (hasShielder && hasHealer) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

function resolvePrimaryElement(
  memberKeys: ReadonlyArray<string>,
  template?: TeamTemplate,
): ElementalShieldType | undefined {
  if (template) {
    for (const el of template.reactionElements) {
      if (VALID_PRIMARY_ELEMENTS.has(el as ElementalShieldType)) {
        return el as ElementalShieldType;
      }
    }
  }

  for (const key of memberKeys) {
    const el = CHARACTER_ELEMENTS[key];
    if (el && VALID_PRIMARY_ELEMENTS.has(el as ElementalShieldType)) {
      return el as ElementalShieldType;
    }
  }

  return undefined;
}

function estimateMemberInvestmentDps(
  memberKeys: ReadonlyArray<string>,
  charMap: Map<string, CharacterInput>,
  baseScore: number,
): number {
  let totalLevel = 0;
  let count = 0;
  for (const key of memberKeys) {
    const c = charMap.get(key);
    if (c) {
      totalLevel += c.level;
      count += 1;
    }
  }
  const avgLevel = count > 0 ? totalLevel / count : 80;
  const levelFactor = Math.min(1.1, Math.max(0.6, avgLevel / 80));
  return Math.max(25, Math.min(100, Math.round(baseScore * levelFactor)));
}

// -------------------------------------------------------
// Service
// -------------------------------------------------------

export class TeamIntelligenceService {
  private readonly accountContextProvider: AccountContextProvider;

  constructor(
    accountContextProvider?: AccountContextProvider,
    characterService = new GenshinCharacterService(),
  ) {
    this.accountContextProvider =
      accountContextProvider ??
      new AccountContextProvider(
        new ImportedAccountService(),
        new ShowcaseService(),
        characterService,
      );
  }

  /**
   * Evaluates meta team templates directly against a provided roster without
   * querying the database. Used by both authenticated and public showcase flows.
   */
  getRecommendationsForRoster(
    rosterInput: ReadonlyArray<RosterRecordInput>,
    options?: { limit?: number },
  ): TeamRecommendation[] {
    const roster = normalizeRosterToCharacterInputs(rosterInput);
    if (roster.length < 4) {
      return [];
    }

    const allBreakdowns: TeamScoreBreakdown[] = scoreAllTemplates(META_TEMPLATES, roster);
    const buildable = allBreakdowns.filter((b) => b.isBuildable);
    if (buildable.length === 0) {
      return [];
    }

    const limit = options?.limit ?? 3;
    const selected = buildable.slice(0, limit);
    const templateById = new Map<string, TeamTemplate>(META_TEMPLATES.map((t) => [t.id, t]));

    return selected.map((breakdown, index) => {
      const template = templateById.get(breakdown.templateId)!;
      const explanations = explainTeamScore(breakdown, template);

      const rosterSlots: TeamRosterSlot[] = breakdown.roles.map((role: TemplateRoleResult) => ({
        roleId: role.roleId,
        label: role.label,
        element: role.element,
        characterKey: role.filledBy,
        investmentScore: role.investmentScore,
        isRequired: role.isRequired,
        flex: role.flex,
      }));

      return {
        rank: index + 1,
        templateId: breakdown.templateId,
        templateName: template.name,
        archetype: template.archetype,
        reaction: template.reaction,
        score: breakdown.score,
        isBuildable: breakdown.isBuildable,
        roster: rosterSlots,
        explanations,
      };
    });
  }

  /**
   * Converts buildable team recommendations and available roster units into
   * `CandidateEndgameTeam[]` complete with 4-member lineups, primary element,
   * investment-scaled baseDps, defensive comfortScore, and instance gear assignments.
   *
   * Also synthesizes disjoint secondary/tertiary teams from remaining unused roster
   * units when the roster contains >= 8 or >= 12 characters so multi-team endgame
   * solvers (`evaluateAbyssJoint` and `evaluateOnslaughtJoint`) can evaluate disjoint allocations.
   */
  buildCandidateEndgameTeams(
    recommendations: ReadonlyArray<TeamRecommendation>,
    rosterInput: ReadonlyArray<CharacterWithWeapon | CharacterInput>,
    artifacts?: ReadonlyArray<Artifact>,
  ): CandidateEndgameTeam[] {
    const normalizedRoster = normalizeRosterToCharacterInputs(rosterInput);
    if (normalizedRoster.length < 4) {
      return [];
    }

    // Sort roster by investment descending for deterministic slot completion & disjoint team building
    const sortedRoster = [...normalizedRoster].sort(
      (a, b) => b.level - a.level || b.ascension - a.ascension,
    );
    const charMap = new Map<string, CharacterInput>(sortedRoster.map((c) => [c.characterKey, c]));

    // Map characterKey -> CharacterWithWeapon (if full DB records with IDs were supplied)
    const rawCharByKey = new Map<string, CharacterWithWeapon>();
    for (const item of rosterInput) {
      if ('id' in item && typeof item.id === 'string') {
        rawCharByKey.set(item.characterKey, item as CharacterWithWeapon);
      }
    }

    const templateById = new Map<string, TeamTemplate>(META_TEMPLATES.map((t) => [t.id, t]));
    const candidateTeams: CandidateEndgameTeam[] = [];
    const seenSignatures = new Set<string>();

    const buildGearForMembers = (
      memberKeys: [string, string, string, string],
    ): MemberGearSummary[] => {
      const gearList: MemberGearSummary[] = [];
      for (const key of memberKeys) {
        const rawChar = rawCharByKey.get(key);
        const weaponInstanceId = rawChar?.equippedWeapon?.id ?? rawChar?.equippedWeaponId ?? null;
        const weaponId = rawChar?.equippedWeapon?.weaponKey ?? null;
        const charArtifacts =
          rawChar && artifacts
            ? artifacts.filter((a) => a.equippedCharacterId === rawChar.id).map((a) => a.id)
            : [];

        if (weaponInstanceId || weaponId || charArtifacts.length > 0) {
          gearList.push({
            weaponId,
            weaponInstanceId,
            artifactInstanceIds: charArtifacts,
          });
        }
      }
      return gearList;
    };

    const completeFourMembers = (
      initialKeys: string[],
      pool: ReadonlyArray<CharacterInput>,
    ): [string, string, string, string] | null => {
      const members: string[] = [];
      for (const k of initialKeys) {
        if (k && !members.includes(k)) {
          members.push(k);
        }
      }
      for (const candidate of pool) {
        if (members.length >= 4) break;
        if (!members.includes(candidate.characterKey)) {
          members.push(candidate.characterKey);
        }
      }
      if (members.length < 4) return null;
      return [members[0]!, members[1]!, members[2]!, members[3]!];
    };

    const addCandidateTeam = (
      id: string,
      name: string,
      memberKeys: [string, string, string, string],
      baseScore: number,
      template?: TeamTemplate,
    ) => {
      const sig = [...memberKeys].sort((a, b) => a.localeCompare(b)).join('|');
      if (seenSignatures.has(sig)) return;
      seenSignatures.add(sig);

      const primaryElement = resolvePrimaryElement(memberKeys, template);
      const baseDps = estimateMemberInvestmentDps(memberKeys, charMap, baseScore);
      const comfortScore = computeTeamComfortScore(memberKeys);
      const gear = buildGearForMembers(memberKeys);

      candidateTeams.push({
        id,
        name,
        memberKeys,
        ...(primaryElement ? { primaryElement } : {}),
        baseDps,
        comfortScore,
        gear,
      });
    };

    // 1. Convert provided TeamRecommendations into CandidateEndgameTeams
    const seedRecs =
      recommendations.length > 0
        ? recommendations
        : this.getRecommendationsForRoster(sortedRoster, { limit: META_TEMPLATES.length });

    for (let i = 0; i < seedRecs.length; i++) {
      const rec = seedRecs[i]!;
      const filledKeys = rec.roster
        .map((slot) => slot.characterKey)
        .filter((k): k is string => Boolean(k));
      const completed = completeFourMembers(filledKeys, sortedRoster);
      if (!completed) continue;

      const template = templateById.get(rec.templateId);
      addCandidateTeam(
        `${rec.templateId}_${i + 1}`,
        rec.templateName,
        completed,
        rec.score,
        template,
      );
    }

    // 2. Iteratively search for disjoint teams from remaining unused characters
    // so multi-team solvers (Abyss 2-team and Onslaught 3-team) have disjoint candidates.
    const usedInDisjointChain = new Set<string>();
    if (candidateTeams.length > 0) {
      for (const k of candidateTeams[0]!.memberKeys) {
        usedInDisjointChain.add(k);
      }
    }

    for (let stage = 2; stage <= 3; stage++) {
      const remainingPool = sortedRoster.filter((c) => !usedInDisjointChain.has(c.characterKey));
      if (remainingPool.length < 4) break;

      const disjointRecs = this.getRecommendationsForRoster(remainingPool, { limit: 2 });
      if (disjointRecs.length > 0) {
        const bestDisjoint = disjointRecs[0]!;
        const filled = bestDisjoint.roster
          .map((s) => s.characterKey)
          .filter((k): k is string => Boolean(k));
        const completed = completeFourMembers(filled, remainingPool);
        if (completed) {
          const tpl = templateById.get(bestDisjoint.templateId);
          addCandidateTeam(
            `disjoint_${bestDisjoint.templateId}_${stage}`,
            bestDisjoint.templateName,
            completed,
            bestDisjoint.score,
            tpl,
          );
          for (const k of completed) {
            usedInDisjointChain.add(k);
          }
          continue;
        }
      }

      // If no strict template matched the remaining pool, form a balanced 4-unit squad from highest-invested remaining units
      const fallbackFour = completeFourMembers([], remainingPool);
      if (fallbackFour) {
        addCandidateTeam(`disjoint_squad_${stage}`, `${fallbackFour[0]} Squad`, fallbackFour, 65);
        for (const k of fallbackFour) {
          usedInDisjointChain.add(k);
        }
      }
    }

    return candidateTeams;
  }

  /**
   * Analyses the authenticated user's roster via `AccountContextProvider`
   * and returns the top 3 most buildable, meta-relevant team compositions.
   *
   * Throws:
   *  - NotFoundError (404) if the user has no Genshin account.
   *  - UnprocessableError (422) if the roster has fewer than 4 characters.
   *  - UnprocessableError (422) if no buildable team can be assembled.
   */
  async getRecommendations(userId: string): Promise<TeamIntelligenceResponse> {
    const { context: accountContext, rawRoster } =
      await this.accountContextProvider.getForUser(userId);

    const conflictedFormKeys = new Set(
      accountContext.issues
        .filter((issue) => issue.code === 'conflicting_builds')
        .map((issue) => issue.formKey),
    );
    const charContextByFormKey = new Map(accountContext.characters.map((c) => [c.formKey, c]));

    const verifiedRoster = rawRoster.filter((char) => {
      const identity = resolveCharacterFormIdentity({ key: char.characterKey });
      const formKey = identity?.formKey;
      const charContext = formKey ? charContextByFormKey.get(formKey) : undefined;
      return (
        charContext?.buildState !== 'conflicted' && !(formKey && conflictedFormKeys.has(formKey))
      );
    });

    if (verifiedRoster.length < 4) {
      throw new UnprocessableError(
        'Your roster needs at least 4 characters to form a team. Import your character data first.',
      );
    }

    const recommendations = this.getRecommendationsForRoster(verifiedRoster, { limit: 3 });

    if (recommendations.length === 0) {
      throw new UnprocessableError(
        'Your roster does not satisfy the required roles for any known team archetype. ' +
          'Import more characters and try again.',
      );
    }

    return {
      recommendations,
      analysedAt: new Date().toISOString(),
    };
  }
}
