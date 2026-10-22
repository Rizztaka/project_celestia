import { createHash } from 'node:crypto';

import type {
  BuildInsightCard,
  BuildInsightQuery,
  BuildInsightsResponse,
} from '@celestia/api-contracts';

import { AppError } from '@/core/errors/app-error.js';

import type { CharacterEquipmentRow } from '../../characters/character-equipment.repository.js';
import { ProfileReferenceService } from '../../characters/profile-reference.service.js';
import {
  evaluateHarbinger,
  evaluateSet,
  pieceBounds,
  weaponCompatibility,
} from './build-insights.calculator.js';
import { explainCard } from './build-insights.explainer.js';
import { BuildInsightsRepository } from './build-insights.repository.js';
import { harbingerSource, setRuleSources } from './build-insights.rules.js';

export class BuildInsightsService {
  constructor(
    private readonly repository: Pick<
      BuildInsightsRepository,
      'readForUser'
    > = new BuildInsightsRepository(),
    private readonly reference = new ProfileReferenceService(),
  ) {}
  private optionalReference<T>(read: () => T): T | null {
    try {
      return read();
    } catch (error) {
      // Unknown legacy keys are retained as gaps. Integrity failures remain errors.
      if (error instanceof AppError && error.statusCode === 404) return null;
      throw error;
    }
  }
  private weapon(
    characterType: string,
    key: string | null,
    refinement: number | null,
    basis: BuildInsightCard['basis'],
  ): BuildInsightCard[] {
    const ref = key ? this.optionalReference(() => this.reference.weapon(key)) : null;
    const compatibility = weaponCompatibility(characterType, ref?.weaponType ?? null);
    if (key && !ref) compatibility.values.sourceKey = key;
    const sourceText = ref
      ? (ref.refinements.find((r) => r.rank === refinement)?.description ??
        ref.refinements.map((r) => `R${r.rank}: ${r.description}`).join('\n'))
      : null;
    const context = {
      title: ref?.name ?? key ?? 'Equipped weapon',
      basis,
      source: ref?.source ?? null,
      sourceText,
    };
    const cards = [explainCard(compatibility, context)];
    if (ref && compatibility.state !== 'not_applicable') {
      const decision =
        key === 'HarbingerOfDawn' && ref.source.sha256 === harbingerSource
          ? evaluateHarbinger(refinement, compatibility.conditions[0]!.truth)
          : {
              id: 'weapon-effect',
              code: 'source_only' as const,
              state: 'reference' as const,
              conditions: [],
              values: {},
            };
      cards.push(explainCard(decision, { ...context, title: `${ref.name} · ${ref.effectName}` }));
    }
    return cards;
  }
  private artifact(
    key: string,
    bounds: { min: number; max: number },
    basis: BuildInsightCard['basis'],
  ): BuildInsightCard[] {
    const ref = this.optionalReference(() => this.reference.artifact(key));
    if (!ref)
      return [
        explainCard(
          { id: key, code: 'source_only', state: 'unavailable', conditions: [], values: {} },
          { title: key, basis, source: null, sourceText: null },
        ),
      ];
    const modeled = Object.hasOwn(setRuleSources, key) && setRuleSources[key] === ref.source.sha256;
    return evaluateSet(key, bounds, modeled).map((decision) =>
      explainCard(decision, {
        title: ref.name + (decision.values.pieces ? ` · ${decision.values.pieces}-piece` : ''),
        basis,
        source: ref.source,
        sourceText: decision.values.pieces
          ? (ref.effects.find((e) => e.pieces === decision.values.pieces)?.description ?? null)
          : ref.effects.map((e) => `${e.pieces}-piece: ${e.description}`).join('\n'),
      }),
    );
  }
  async read(
    userId: string,
    key: string,
    query: BuildInsightQuery,
  ): Promise<BuildInsightsResponse> {
    const profile = this.reference.character(key);
    const row = await this.repository.readForUser(userId, key);
    const assignments = row?.artifacts.map((a) => ({ slot: a.slotKey, set: a.setKey })) ?? [];
    const weapon = row?.weaponRelationConsistent ? row.weapon : null;
    const cards = this.weapon(
      profile.weaponType,
      weapon?.weaponKey ?? null,
      weapon?.refinement ?? null,
      'recorded',
    );
    for (const set of [...new Set(assignments.map((a) => a.set))].sort())
      cards.push(
        ...this.artifact(
          set,
          pieceBounds(assignments, row?.artifactRelationsConsistent ?? false, set),
          'recorded',
        ),
      );
    let comparison: BuildInsightCard[] | null = null;
    if (query.weapon)
      comparison = this.weapon(
        profile.weaponType,
        query.weapon,
        query.refinement ?? null,
        'hypothetical',
      );
    if (query.artifactSet)
      comparison = this.artifact(
        query.artifactSet,
        { min: query.pieces!, max: query.pieces! },
        'hypothetical',
      );
    return {
      contractVersion: 1,
      engineVersion: 'deterministic-build-v1',
      characterKey: key,
      characterName: profile.name,
      weaponType: profile.weaponType,
      recorded: row !== null,
      observation: createHash('sha256')
        .update(JSON.stringify(this.observation(row)))
        .digest('hex'),
      cards,
      comparison,
      weaponOptions: profile.weapons,
      artifactOptions: profile.artifactSets,
      limitations: [
        'Evaluates the imported equipment snapshot. Missing assignments and current combat conditions remain unknown.',
        'Executable rules cover weapon type, set piece bounds, Harbinger HP gating and the two/four-piece requirements of Deepwood, Gilded, Golden Troupe and Marechaussee Hunter. Other effects remain sourced references.',
        'Four-piece eligibility does not establish activation, target coverage, uptime or team suitability. No damage, ER target or optimal-build ranking is calculated.',
        ...(profile.forms.length
          ? [
              'Choose an elemental Traveler form for element-dependent advice; no current form is inferred.',
            ]
          : []),
      ],
    };
  }
  private observation(row: CharacterEquipmentRow | null) {
    return row
      ? {
          key: row.character.characterKey,
          weapon: row.weaponRelationConsistent
            ? row.weapon && { key: row.weapon.weaponKey, refinement: row.weapon.refinement }
            : null,
          artifacts: row.artifacts.map((a) => ({ slot: a.slotKey, set: a.setKey })),
          consistent: row.artifactRelationsConsistent,
        }
      : null;
  }
}
