import { createRequire } from 'module';
import { prisma } from '@/core/db/prisma.js';
import { NotFoundError, UnprocessableError } from '@/core/errors/app-error.js';
import { GenshinCharacterService } from '../../characters/character.service.js';
import type { CharacterWithWeapon } from '../../characters/character.repository.js';
import {
  scoreAllTemplates,
  type TeamTemplate,
  type TeamScoreBreakdown,
  type CharacterInput,
  type TemplateRoleResult,
} from './team-intelligence.calculator.js';
import { explainTeamScore } from './team-intelligence.explainer.js';

// -------------------------------------------------------
// Static data — loaded once at module init
// -------------------------------------------------------

const require = createRequire(import.meta.url);

const { templates: META_TEMPLATES } = require(
  '../../static/team-templates.json',
) as { templates: TeamTemplate[] };

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

// -------------------------------------------------------
// Service
// -------------------------------------------------------

export class TeamIntelligenceService {
  private readonly characterService: GenshinCharacterService;

  constructor() {
    this.characterService = new GenshinCharacterService();
  }

  /**
   * Analyses the authenticated user's roster and returns the top 3 most
   * buildable, meta-relevant team compositions, with plain-language
   * explanations for each.
   *
   * Throws:
   *  - NotFoundError (404) if the user has no Genshin account.
   *  - UnprocessableError (422) if the roster has fewer than 4 characters.
   *  - UnprocessableError (422) if no buildable team can be assembled.
   */
  async getRecommendations(userId: string): Promise<TeamIntelligenceResponse> {
    // ── 1. Verify account exists ──────────────────────────────────────────
    const account = await prisma.genshinAccount.findUnique({ where: { userId } });
    if (!account) {
      throw new NotFoundError(
        'No Genshin Impact account found. Please import your data first.',
      );
    }

    // ── 2. Fetch roster ───────────────────────────────────────────────────
    const rawRoster: CharacterWithWeapon[] =
      await this.characterService.getCharactersForUser(userId);

    if (rawRoster.length < 4) {
      throw new UnprocessableError(
        'Your roster needs at least 4 characters to form a team. Import your character data first.',
      );
    }

    // ── 3. Shape roster into calculator inputs ────────────────────────────
    const roster: CharacterInput[] = rawRoster.map((char) => ({
      characterKey: char.characterKey,
      level: char.level,
      ascension: char.ascension,
      constellation: char.constellation,
      talentNormal: char.talentNormal,
      talentSkill: char.talentSkill,
      talentBurst: char.talentBurst,
      equippedWeapon: char.equippedWeapon
        ? {
            weaponKey: char.equippedWeapon.weaponKey,
            level: char.equippedWeapon.level,
            refinement: char.equippedWeapon.refinement,
          }
        : null,
    }));

    // Build lookup map for the Explainer.
    const rosterMap = new Map<string, CharacterInput>(
      roster.map((c) => [c.characterKey, c]),
    );

    // ── 4. Score all templates ─────────────────────────────────────────────
    const allBreakdowns: TeamScoreBreakdown[] = scoreAllTemplates(META_TEMPLATES, roster);

    // ── 5. Filter to buildable and take top 3 ────────────────────────────
    const buildable = allBreakdowns.filter((b) => b.isBuildable);

    if (buildable.length === 0) {
      throw new UnprocessableError(
        'Your roster does not satisfy the required roles for any known team archetype. ' +
          'Import more characters and try again.',
      );
    }

    const top3 = buildable.slice(0, 3);

    // ── 6. Attach template metadata and explanations ──────────────────────
    const templateById = new Map<string, TeamTemplate>(
      META_TEMPLATES.map((t) => [t.id, t]),
    );

    const recommendations: TeamRecommendation[] = top3.map((breakdown, index) => {
      const template = templateById.get(breakdown.templateId)!;

      const explanations = explainTeamScore(breakdown, template, rosterMap);

      const rosterSlots: TeamRosterSlot[] = breakdown.roles.map(
        (role: TemplateRoleResult) => ({
          roleId: role.roleId,
          label: role.label,
          element: role.element,
          characterKey: role.filledBy,
          investmentScore: role.investmentScore,
          isRequired: role.isRequired,
          flex: role.flex,
        }),
      );

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

    return {
      recommendations,
      analysedAt: new Date().toISOString(),
    };
  }
}
