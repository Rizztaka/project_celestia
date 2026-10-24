// Entirely synthetic builds. No real player's values or credentials are used.
const stat = (id, value) => ({ id, value, name: id, formatted: String(value) });
const ids = [10000089, 10000043, 10000114, 10000103, 10000112, 10000115];
const depots = [8901, 4301, 11401, 10301, 11201, 11501];
const names = ['Furina', 'Sucrose', 'Skirk', 'Xilonen', 'Escoffier', 'Dahlia'];
const elements = ['Hydro', 'Anemo', 'Cryo', 'Geo', 'Cryo', 'Hydro'];
const sets = [
  [32543, 32523, 32554, 32514, 32533],
  [76543, 76523, 76554, 76514, 76533],
  [31543, 31523, 31554, 31514, 31533],
  [37543, 37523, 37554, 37514, 37533],
];
export function analysisFixture(uid = '800000001') {
  const characters = ids.map((id, i) => {
    const main =
      i === 1
        ? [
            'FIGHT_PROP_HP',
            'FIGHT_PROP_ATTACK',
            'FIGHT_PROP_ATTACK_PERCENT',
            'FIGHT_PROP_ELEMENT_MASTERY',
            'FIGHT_PROP_ELEMENT_MASTERY',
          ]
        : i === 3
          ? [
              'FIGHT_PROP_HP',
              'FIGHT_PROP_ATTACK',
              'FIGHT_PROP_DEFENSE_PERCENT',
              'FIGHT_PROP_DEFENSE_PERCENT',
              'FIGHT_PROP_HEAL_ADD',
            ]
          : i === 2
            ? [
                'FIGHT_PROP_HP',
                'FIGHT_PROP_ATTACK',
                'FIGHT_PROP_ATTACK_PERCENT',
                'FIGHT_PROP_ICE_ADD_HURT',
                'FIGHT_PROP_CRITICAL_HURT',
              ]
            : [
                'FIGHT_PROP_HP',
                'FIGHT_PROP_ATTACK',
                'FIGHT_PROP_HP_PERCENT',
                'FIGHT_PROP_HP_PERCENT',
                'FIGHT_PROP_CRITICAL_HURT',
              ];
    return {
      key: `${id}:${depots[i]}`,
      id,
      skillDepotId: depots[i],
      name: names[i],
      portrait: null,
      element: elements[i],
      weaponType: i === 1 ? 'Catalyst' : i === 4 ? 'Polearm' : 'Sword',
      rarity: 5,
      level: 80,
      ascension: 6,
      constellation: 0,
      metadataAvailable: true,
      talents: ['normal', 'skill', 'burst'].map((kind, t) => ({
        id: `${id}-${t}`,
        label: kind,
        kind,
        baseLevel: t === 0 ? 1 : 8,
        bonusLevel: null,
      })),
      equipmentAvailable: true,
      weapon: {
        id: i === 1 ? 14403 : i === 4 ? 13407 : i === 0 ? 11426 : 11401,
        name:
          i === 1
            ? 'Sacrificial Fragments'
            : i === 4
              ? 'Favonius Lance'
              : i === 0
                ? 'Fleuve Cendre Ferryman'
                : 'Favonius Sword',
        icon: null,
        rarity: 4,
        level: 90,
        ascension: 6,
        refinement: 5,
        slot: null,
        setName: null,
        mainStat: null,
        stats: [stat('FIGHT_PROP_CHARGE_EFFICIENCY', 45.9)],
      },
      artifacts: ['Flower', 'Plume', 'Sands', 'Goblet', 'Circlet'].map((slot, s) => {
        const mainStat = stat(main[s], s < 2 ? (s === 0 ? 4780 : 311) : 46.6);
        return {
          id: (sets[i] ?? sets[0])[s],
          name: `Synthetic ${slot}`,
          icon: null,
          rarity: 5,
          level: 20,
          ascension: null,
          refinement: null,
          slot,
          setName: 'Set label intentionally unresolved',
          mainStat,
          stats: [mainStat, stat('FIGHT_PROP_CRITICAL', 7)],
        };
      }),
      stats: [
        stat('2000', 30000),
        stat('2001', 1800),
        stat('2002', 1900),
        stat('20', 0.65),
        stat('22', 1.8),
        stat('23', 1.84),
        stat('28', i === 1 ? 700 : 0),
      ],
    };
  });
  return {
    source: 'enka.network',
    delivery: 'fetched',
    fetchedAt: '2026-10-24T10:00:00.000Z',
    nextRefreshAt: '2026-10-24T10:00:10.000Z',
    issue: null,
    snapshot: {
      uid,
      nickname: 'Synthetic build analyzer',
      adventureRank: 60,
      worldLevel: 9,
      signature: 'Synthetic local verification only',
      characters,
    },
  };
}
