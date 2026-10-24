// Explicitly synthetic protocol fixture; never evidence of a real player's build.
export function syntheticShowcase(uid = '800000001') {
  return {
    uid,
    ttl: 60,
    playerInfo: {
      nickname: 'Synthetic Traveler',
      level: 60,
      worldLevel: 9,
      signature: 'Synthetic showcase for local tests.',
    },
    avatarInfoList: [
      {
        avatarId: 10000046,
        skillDepotId: 4601,
        propMap: { '4001': { val: '80' }, '1002': { val: '6' } },
        talentIdList: [461],
        skillLevelMap: { '10461': 8, '10462': 9, '10463': 10 },
        proudSkillExtraLevelMap: { '4632': 3 },
        fightPropMap: {
          '2000': 31234,
          '2001': 1543.27,
          '2002': 800,
          '20': 0.731,
          '22': 2.12,
          '23': 1.3,
          '28': 0,
        },
        equipList: [
          {
            itemId: 13501,
            weapon: { level: 90, promoteLevel: 6, affixMap: { '113501': 0 } },
            flat: {
              itemType: 'ITEM_WEAPON',
              nameTextMapHash: '3235324891',
              rankLevel: 5,
              icon: 'UI_EquipIcon_Pole_Homa',
              weaponStats: [
                { appendPropId: 'FIGHT_PROP_BASE_ATTACK', statValue: 608 },
                { appendPropId: 'FIGHT_PROP_CRITICAL_HURT', statValue: 66.2 },
              ],
            },
          },
          {
            itemId: 90543,
            reliquary: { level: 21 },
            flat: {
              itemType: 'ITEM_RELIQUARY',
              nameTextMapHash: 'unknown-fixture-name',
              setNameTextMapHash: '1524173875',
              rankLevel: 5,
              icon: 'UI_RelicIcon_15006_4',
              equipType: 'EQUIP_BRACER',
              reliquaryMainstat: { mainPropId: 'FIGHT_PROP_HP', statValue: 4780 },
              reliquarySubstats: [{ appendPropId: 'FIGHT_PROP_CRITICAL', statValue: 10.5 }],
            },
          },
        ],
      },
    ],
  };
}
