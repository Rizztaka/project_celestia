// Synthetic protocol fixtures. These are not a captured player account.
export const fixtureRole = {
  uid: '800000001',
  server: 'os_asia' as const,
  nickname: 'Fixture Traveler',
  level: 60,
};
export const fixtureCookies = {
  ltuid_v2: 'synthetic-user',
  ltoken_v2: 'synthetic-token',
  account_mid_v2: 'synthetic-mid',
};
export function fixtureDetail(id = 10000038) {
  return {
    base: { id, level: 80, element: 'Geo', actived_constellation_num: 2 },
    skills: [
      { skill_type: 1, level: 6 },
      { skill_type: 1, level: 9 },
      { skill_type: 1, level: 8 },
      { skill_type: 2, level: 1 },
    ],
    weapon: { id: 11302, level: 90, promote_level: 6, affix_level: 5 },
    relics: [
      {
        pos: 1,
        level: 20,
        rarity: 5,
        set: { id: 15026 },
        main_property: { property_type: 2000, value: '4,780' },
        sub_property_list: [
          { property_type: 20, value: '3.9%' },
          { property_type: 9, value: '5.8%' },
        ],
      },
    ],
  };
}
export function fixtureDetailResponse(id = 10000038) {
  return {
    list: [fixtureDetail(id)],
    property_map: { '2000': { name: 'HP' }, '20': { name: 'CRIT Rate' }, '9': { name: 'DEF' } },
  };
}
export const fixtureNotes = {
  current_resin: 160,
  max_resin: 200,
  resin_recovery_time: '19200',
  finished_task_num: 4,
  total_task_num: 4,
  is_extra_task_reward_received: false,
  expeditions: [{ status: 'Finished', remained_time: '0' }],
};
