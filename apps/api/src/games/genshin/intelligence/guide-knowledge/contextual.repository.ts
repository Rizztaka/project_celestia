import type { CharacterEquipmentResponse } from '@celestia/api-contracts';

import { NotFoundError } from '@/core/errors/app-error.js';

import { GenshinCharacterEquipmentRepository } from '../../characters/character-equipment.repository.js';
import { GenshinCharacterEquipmentService } from '../../characters/character-equipment.service.js';

export class ContextualObservationRepository {
  constructor(private readonly equipment = new GenshinCharacterEquipmentRepository()) {}
  async read(userId: string, keys: string[]): Promise<CharacterEquipmentResponse[]> {
    const rows = await this.equipment.readManyForUser(userId, keys);
    if (rows.length !== keys.length) throw new NotFoundError('Character not found.');
    return Promise.all(
      rows.map((row) =>
        new GenshinCharacterEquipmentService({ readForUser: async () => row }).read(
          userId,
          row.character.characterKey,
        ),
      ),
    );
  }
}
