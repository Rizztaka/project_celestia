import {
  characterKeySchema,
  type ContextualAdvice,
  contextualAdviceSchema,
  contextualEquipmentIdentity,
  contextualQuerySchema,
  contextualReleaseAdviceDataSchema,
  contextualReleaseAdviceSchema,
  normalizeContextualScenario,
} from '@celestia/api-contracts';

import { BadRequestError, NotFoundError } from '@/core/errors/app-error.js';

import { calculateContextualAdvice, type TeamMember } from './contextual.calculator.js';
import { contextualLoadedMetadata, contextualReleaseSnapshot } from './contextual.data.js';
import { explainContextualAdvice } from './contextual.explainer.js';
import type { ContextualPack } from './contextual.pack.js';
import { type KnowledgeRelease, releaseMetadata } from './contextual.release.js';
import { ContextualObservationRepository } from './contextual.repository.js';
import { digest } from './guide-knowledge.pack.js';

export class ContextualAdviceService {
  constructor(
    private readonly repository: Pick<
      ContextualObservationRepository,
      'read'
    > = new ContextualObservationRepository(),
    private readonly release: KnowledgeRelease = contextualReleaseSnapshot,
  ) {}
  metadata() {
    return this.release === contextualReleaseSnapshot
      ? contextualLoadedMetadata
      : releaseMetadata(this.release);
  }
  async read(userId: string, rawKey: unknown, query: unknown): Promise<ContextualAdvice> {
    const data = await this.evaluate(userId, rawKey, query, this.release.pack);
    // V2's strict agent-only review shape is retained. Never relabel a human review:
    // disclose those claims as unavailable to that legacy client; V3 carries their real type.
    return contextualAdviceSchema.parse({
      ...data,
      contractVersion: 2,
      cards: data.cards.filter((card) => card.review.type === 'agent'),
      excluded: [
        ...data.excluded,
        ...data.cards
          .filter((card) => card.review.type !== 'agent')
          .map((card) => ({
            id: card.id,
            reason:
              'This claim has a human review; use the version-3 advice contract to see its actual review attribution.',
          })),
      ],
    });
  }
  async readV3(userId: string, rawKey: unknown, query: unknown) {
    return contextualReleaseAdviceSchema.parse({
      contractVersion: 3,
      release: this.metadata().release,
      advice: await this.evaluate(
        userId,
        rawKey,
        query,
        this.release.pack,
        this.release.descriptor.digest,
      ),
    });
  }
  private async evaluate(
    userId: string,
    rawKey: unknown,
    query: unknown,
    pack: ContextualPack,
    releaseDigest?: string,
  ) {
    const parsed = contextualQuerySchema.safeParse(query),
      key = characterKeySchema.safeParse(rawKey);
    if (!parsed.success || !key.success)
      throw new BadRequestError('Invalid version-2 contextual scenario.');
    const scenario = normalizeContextualScenario(parsed.data);
    const subject = pack.subjects.find((entry) => entry.key === key.data);
    const selections = scenario.team ?? [];
    if (
      selections.some((entry) => entry.characterKey === key.data) ||
      (scenario.activeCharacter &&
        scenario.activeCharacter !== key.data &&
        !selections.some((member) => member.characterKey === scenario.activeCharacter))
    )
      throw new BadRequestError(
        'Select at most three unique additional team members; active character must be selected.',
      );
    if (subject && !subject.roles.includes(scenario.role))
      throw new BadRequestError('This role is outside reviewed character coverage.');
    if (
      selections.some(
        (entry) =>
          entry.selection === 'hypothetical' &&
          !pack.subjects.some((entrySubject) => entrySubject.key === entry.characterKey),
      )
    )
      throw new BadRequestError('Hypothetical teammate is outside reviewed coverage.');
    if (
      scenario.exampleFischlA4 !== 'unknown' &&
      !selections.some(
        (entry) => entry.characterKey === 'Fischl' && entry.selection === 'hypothetical',
      )
    )
      throw new BadRequestError('A4 assumption requires hypothetical Fischl.');
    const keys = [
      key.data,
      ...selections
        .filter((entry) => entry.selection === 'owned')
        .map((entry) => entry.characterKey),
    ].sort();
    const snapshots = await this.repository.read(userId, keys);
    const equipment = snapshots.find((entry) => entry.character.characterKey === key.data);
    if (!equipment) throw new NotFoundError('Character not found.');
    const team: TeamMember[] = [
      {
        characterKey: key.data,
        selection: 'owned' as const,
        origin: 'recorded' as const,
        ascension: equipment.character.ascension,
      },
      ...selections.map((entry): TeamMember => {
        const recorded = snapshots.find(
          (snapshot) => snapshot.character.characterKey === entry.characterKey,
        );
        if (entry.selection === 'owned' && !recorded)
          throw new NotFoundError('Character not found.');
        return {
          ...entry,
          origin: entry.selection === 'owned' ? 'recorded' : 'assumed',
          ascension: recorded?.character.ascension ?? null,
        };
      }),
    ].sort((a, b) =>
      a.characterKey < b.characterKey ? -1 : a.characterKey > b.characterKey ? 1 : 0,
    );
    const calculation = calculateContextualAdvice(pack, equipment, scenario, team);
    const observationFingerprint = digest({
      current: contextualEquipmentIdentity(equipment),
      ownedTeam: team
        .filter((entry) => entry.selection === 'owned')
        .map(({ characterKey, ascension }) => ({ characterKey, ascension })),
    });
    return contextualReleaseAdviceDataSchema.parse({
      contractVersion: 3,
      packVersion: pack.version,
      characterKey: key.data,
      coverage: subject ? 'supported' : 'unsupported',
      supportedRoles: subject?.roles ?? [],
      scenario,
      fingerprint: digest({
        pack: pack.contentHash,
        ...(releaseDigest ? { release: releaseDigest } : {}),
        observationFingerprint,
        scenario,
      }),
      observationFingerprint,
      team,
      setBounds: calculation.setBounds,
      cards: explainContextualAdvice(calculation),
      excluded: calculation.excluded,
      sources: pack.sources,
      limitations: pack.limitations,
      externalReading: subject?.externalReading ?? [],
    });
  }
}
