import type { ImportSnapshot } from './importer.repository.js';

export function importedAccountFixture(): NonNullable<ImportSnapshot> {
  const time = new Date('2026-10-20T12:00:00.000Z');
  return {
    id: 'account-a',
    userId: 'owner-a',
    uid: null,
    nickname: null,
    adventureRank: null,
    worldLevel: null,
    createdAt: time,
    updatedAt: time,
    characters: [
      {
        id: 'character-a',
        accountId: 'account-a',
        characterKey: 'HuTao',
        level: 80,
        ascension: 5,
        constellation: 0,
        talentNormal: 8,
        talentSkill: 8,
        talentBurst: 6,
        equippedWeaponId: 'weapon-a',
        createdAt: time,
        updatedAt: time,
      },
    ],
    weapons: [
      {
        id: 'weapon-a',
        accountId: 'account-a',
        weaponKey: 'StaffOfHoma',
        level: 80,
        ascension: 5,
        refinement: 1,
        locked: true,
        createdAt: time,
        updatedAt: time,
      },
    ],
    artifacts: [
      {
        id: 'artifact-a',
        accountId: 'account-a',
        setKey: 'GladiatorsFinale',
        slotKey: 'flower',
        level: 20,
        rarity: 5,
        mainStatKey: 'hp',
        subStats: [{ key: 'critRate_', value: 3.9 }],
        locked: false,
        equippedCharacterId: 'character-a',
        createdAt: time,
        updatedAt: time,
      },
    ],
    materials: [],
    importStates: ['characters', 'weapons', 'artifacts'].map((section, index) => ({
      id: `receipt-${index}`,
      accountId: 'account-a',
      section: section as 'characters' | 'weapons' | 'artifacts',
      importedAt: time,
      source: 'Synthetic GOOD exporter',
      entryCount: 1,
    })),
  };
}
