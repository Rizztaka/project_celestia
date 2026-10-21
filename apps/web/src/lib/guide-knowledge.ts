import {
  type CharacterEquipmentResponse,
  guideAdviceSchema,
  type GuideScenario,
} from '@celestia/api-contracts';

import { type AccountSession } from './account-session';
import { fetchApi } from './api';

export function guideObservation(equipment: CharacterEquipmentResponse) {
  return {
    weaponState: equipment.weapon.state,
    weaponKey: equipment.weapon.item?.weaponKey ?? null,
    refinement: equipment.weapon.item?.refinement ?? null,
    charactersReceipt: equipment.provenance.characters,
    weaponsReceipt: equipment.provenance.weapons,
  };
}
export function guideSnapshotKey(equipment: CharacterEquipmentResponse): string {
  return JSON.stringify([equipment.character.characterKey, guideObservation(equipment)]);
}
export function guideQueryOptions(
  equipment: CharacterEquipmentResponse,
  scenario: GuideScenario,
  session: AccountSession,
) {
  const query = new URLSearchParams({ contractVersion: '1', hp: scenario.hp });
  if (scenario.example) query.set('example', scenario.example);
  if (scenario.refinement) query.set('refinement', scenario.refinement);
  return {
    queryKey: [
      'genshin',
      'guide-advice',
      session.generation,
      guideSnapshotKey(equipment),
      scenario,
    ] as const,
    queryFn: async ({ signal }: { signal: AbortSignal }) =>
      guideAdviceSchema.parse(
        await fetchApi(
          `/games/genshin/characters/${encodeURIComponent(equipment.character.characterKey)}/guide-advice?${query}`,
          { signal },
          session,
        ),
      ),
    retry: false,
  };
}
