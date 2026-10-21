import { type GuideAdvice, guideAdviceSchema, guideScenarioSchema } from '@celestia/api-contracts';

import { BadRequestError } from '@/core/errors/app-error.js';

import { GenshinCharacterEquipmentService } from '../../characters/character-equipment.service.js';
import { calculateAdvice } from './guide-knowledge.calculator.js';
import { guideKnowledgePack } from './guide-knowledge.data.js';
import { explainAdvice } from './guide-knowledge.explainer.js';
import { digest } from './guide-knowledge.pack.js';

export class GuideKnowledgeService {
  constructor(
    private readonly equipment: Pick<
      GenshinCharacterEquipmentService,
      'read'
    > = new GenshinCharacterEquipmentService(),
  ) {}
  async read(userId: string, key: unknown, rawQuery: unknown): Promise<GuideAdvice> {
    const parsed = guideScenarioSchema.safeParse(rawQuery);
    if (!parsed.success)
      throw new BadRequestError(
        'Invalid guide scenario. Use contractVersion=1 and allowlisted, single scenario values.',
      );
    const scenario = parsed.data;
    const equipment = await this.equipment.read(userId, key);
    const pack = guideKnowledgePack;
    const result = calculateAdvice(pack, equipment, scenario);
    const observation = {
      weaponState: equipment.weapon.state,
      weaponKey: equipment.weapon.item?.weaponKey ?? null,
      refinement: equipment.weapon.item?.refinement ?? null,
      charactersReceipt: equipment.provenance.characters,
      weaponsReceipt: equipment.provenance.weapons,
    };
    return guideAdviceSchema.parse({
      contractVersion: 1,
      characterKey: equipment.character.characterKey,
      packVersion: pack.version,
      fingerprint: digest({
        pack: pack.contentHash,
        characterKey: equipment.character.characterKey,
        scenario,
        observation,
      }),
      scenario,
      observation,
      ...result,
      explanations: explainAdvice(result),
      evidence: pack.sources,
      review: pack.review,
      limitations: pack.limitations,
      externalReading: pack.externalReading,
    });
  }
}
