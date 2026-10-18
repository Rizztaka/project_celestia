import { createHash } from 'node:crypto';

import { quote } from './policy.mjs';

const uuid = (n) => `cb500000-0000-4000-8000-${String(n).padStart(12, '0')}`;
export const ids = {
  a: uuid(1),
  b: uuid(2),
  empty: uuid(3),
  accountA: uuid(4),
  accountB: uuid(5),
  charA: uuid(6),
  charB: uuid(7),
  weaponA: uuid(8),
  completed: uuid(10),
  active: uuid(11),
  paused: uuid(12),
  archived: uuid(13),
  legacy: uuid(14),
  foreignGoal: uuid(15),
};
export const stamp = '2026-10-05T03:04:05.678Z';
const timestamps = { createdAt: stamp, updatedAt: '2026-10-06T06:07:08.901Z' };
export const applicationTables = [
  'users',
  'sessions',
  'rotated_refresh_tokens',
  'oauth_accounts',
  'password_reset_tokens',
  'email_verification_tokens',
  'genshin_accounts',
  'genshin_characters',
  'genshin_weapons',
  'genshin_artifacts',
  'genshin_materials',
  'genshin_import_sections',
  'genshin_character_focus',
  'upgrade_goals',
  'genshin_routine_state',
  'genshin_plan_preferences',
  'genshin_plan_dismissals',
  'daily_companion',
  'weekly_boss_state',
  'event_progress',
  'spiral_abyss_runs',
  'imaginarium_theater_runs',
  'NikkeAccount',
  'NikkeCharacter',
  'NikkeEquipment',
].sort();
export async function seed(client, syntheticLoginPassword) {
  const { default: bcrypt } = await import('bcryptjs');
  // IDs/timestamps/data are fixed; ephemeral generated credentials stay outside the repository.
  const password = await bcrypt.hash(syntheticLoginPassword, '$2b$04$......................');
  let serial = 100;
  const row = (extra) => ({ id: uuid(serial++), ...timestamps, ...extra });
  const insert = async (table, data) => {
    const columns = Object.keys(data);
    await client.query(
      `INSERT INTO ${quote(table)} (${columns.map(quote).join(',')}) VALUES (${columns.map((_, i) => '$' + (i + 1)).join(',')})`,
      Object.values(data),
    );
  };
  await client.query('BEGIN');
  try {
    for (const [key, id] of [
      ['a', ids.a],
      ['b', ids.b],
      ['empty', ids.empty],
    ]) {
      await insert(
        'users',
        row({ id, email: `c5b-${key}@test.invalid`, username: `c5b-${key}`, password }),
      );
      const digest = (kind) => createHash('sha256').update(`synthetic-${kind}-${id}`).digest('hex');
      await insert(
        'sessions',
        row({
          id,
          userId: id,
          tokenHash: digest('refresh'),
          userAgent: 'Synthetic recovery fixture',
          ipAddress: '127.0.0.1',
          expiresAt: '2099-01-01T00:00:00.000Z',
          revokedAt: null,
        }),
      );
      await insert('rotated_refresh_tokens', {
        tokenHash: digest('old-refresh'),
        sessionId: id,
        expiresAt: '2099-01-01T00:00:00.000Z',
      });
      await insert('oauth_accounts', {
        id: uuid(serial++),
        userId: id,
        provider: 'discord',
        providerAccountId: `synthetic-${id}`,
        createdAt: stamp,
      });
      for (const table of ['password_reset_tokens', 'email_verification_tokens'])
        await insert(table, {
          id: uuid(serial++),
          userId: id,
          tokenHash: digest(table),
          expiresAt: stamp,
          usedAt: stamp,
          createdAt: stamp,
        });
    }
    for (const [id, userId, nickname] of [
      [ids.accountA, ids.a, 'Synthetic A'],
      [ids.accountB, ids.b, null],
    ]) {
      await insert(
        'genshin_accounts',
        row({ id, userId, nickname, uid: null, adventureRank: 45, worldLevel: 0 }),
      );
    }
    for (const [id, accountId, level] of [[ids.weaponA, ids.accountA, 90]]) {
      await insert(
        'genshin_weapons',
        row({
          id,
          accountId,
          weaponKey: 'StaffOfHoma',
          level,
          ascension: 6,
          refinement: 2,
          locked: true,
        }),
      );
    }
    await insert(
      'genshin_weapons',
      row({
        accountId: ids.accountA,
        weaponKey: 'OpaqueSyntheticWeapon',
        level: 1,
        ascension: 0,
        refinement: 1,
        locked: false,
      }),
    );
    for (const [id, accountId, level, weapon] of [
      [ids.charA, ids.accountA, 80, ids.weaponA],
      [ids.charB, ids.accountB, 20, null],
    ]) {
      await insert(
        'genshin_characters',
        row({
          id,
          accountId,
          characterKey: 'HuTao',
          level,
          ascension: 6,
          constellation: 0,
          talentNormal: 9,
          talentSkill: 12,
          talentBurst: 15,
          equippedWeaponId: weapon,
        }),
      );
    }
    await insert(
      'genshin_characters',
      row({
        accountId: ids.accountA,
        characterKey: 'OpaqueSyntheticCharacter',
        level: 1,
        ascension: 0,
        constellation: 0,
        talentNormal: 1,
        talentSkill: 1,
        talentBurst: 1,
        equippedWeaponId: null,
      }),
    );
    for (const [index, slotKey] of ['flower', 'plume', 'sands', 'goblet', 'circlet'].entries()) {
      await insert(
        'genshin_artifacts',
        row({
          accountId: ids.accountA,
          setKey: 'OpaqueSyntheticSet',
          slotKey,
          level: index === 0 ? 0 : 20,
          rarity: 5,
          mainStatKey: 'hp',
          subStats: JSON.stringify([
            { key: 'critRate_', value: 6.6 },
            { key: 'opaque', value: 0 },
          ]),
          locked: index === 0,
          equippedCharacterId: ids.charA,
        }),
      );
    }
    await insert(
      'genshin_artifacts',
      row({
        accountId: ids.accountB,
        setKey: 'OpaqueSyntheticSet',
        slotKey: 'flower',
        level: 0,
        rarity: 1,
        mainStatKey: 'hp',
        subStats: '[]',
        locked: false,
        equippedCharacterId: null,
      }),
    );
    for (const [accountId, itemKey, quantity] of [
      [ids.accountA, 'Mora', 13000],
      [ids.accountA, 'GuideToDiligence', 1],
      [ids.accountB, 'Mora', 0],
    ]) {
      await insert('genshin_materials', row({ accountId, itemKey, quantity }));
    }
    // Receipt time is receipt time only. Source explicitly labels synthetic evidence.
    for (const [index, section] of ['characters', 'weapons', 'artifacts', 'materials'].entries()) {
      await insert('genshin_import_sections', {
        id: uuid(serial++),
        accountId: ids.accountA,
        section,
        importedAt: `2026-10-0${index + 1}T03:04:05.678Z`,
        source: index === 2 ? null : 'C5b synthetic fixture',
        entryCount: [2, 2, 5, 2][index],
      });
    }
    await insert('genshin_import_sections', {
      id: uuid(serial++),
      accountId: ids.accountB,
      section: 'weapons',
      importedAt: stamp,
      source: 'C5b synthetic empty receipt',
      entryCount: 0,
    });
    // B confirms an empty weapon section, but its retained artifact has no receipt.
    await insert('genshin_character_focus', {
      accountId: ids.accountA,
      characterKey: 'HuTao',
      focused: true,
      revision: 7,
    });
    await insert('genshin_character_focus', {
      accountId: ids.accountA,
      characterKey: 'OpaqueSyntheticCharacter',
      focused: false,
      revision: 4,
    });
    const goal = {
      userId: ids.a,
      goalType: 'CHARACTER_TALENT',
      targetKey: 'HuTao',
      fromPhase: 1,
      toPhase: 6,
      talentType: 'normal',
      status: 'active',
      priority: 1,
      revision: 3,
    };
    await insert(
      'upgrade_goals',
      row({
        ...goal,
        id: ids.completed,
        fromPhase: 1,
        toPhase: 3,
        status: 'completed',
        revision: 8,
        completedAt: stamp,
        completionReason: 'good_enough',
        createRequestId: uuid(501),
      }),
    );
    await insert(
      'upgrade_goals',
      row({
        ...goal,
        id: ids.active,
        fromPhase: 3,
        predecessorId: ids.completed,
        createRequestId: uuid(502),
      }),
    );
    await insert(
      'upgrade_goals',
      row({
        ...goal,
        id: ids.paused,
        talentType: 'skill',
        status: 'paused',
        priority: 5,
        revision: 9,
      }),
    );
    await insert(
      'upgrade_goals',
      row({
        ...goal,
        id: ids.archived,
        talentType: 'burst',
        status: 'archived',
        priority: 2,
        revision: 6,
        completedAt: stamp,
        completionReason: 'achieved',
      }),
    );
    await insert(
      'upgrade_goals',
      row({
        ...goal,
        id: ids.legacy,
        targetKey: 'LegacySyntheticIntent',
        fromPhase: -8,
        toPhase: 99,
        talentType: 'invalid',
        priority: 4,
      }),
    );
    await insert(
      'upgrade_goals',
      row({ ...goal, id: ids.foreignGoal, userId: ids.b, priority: 2, revision: 12 }),
    );
    await insert('genshin_routine_state', {
      userId: ids.a,
      ...timestamps,
      revision: 14,
      serverId: 'asia',
      dailyPeriodStart: '2026-10-04T20:00:00.000Z',
      commissionsDone: true,
      teapotChecked: false,
      transformerLastUsedAt: stamp,
      resinAmount: 0,
      resinRecordedAt: stamp,
      weeklyPeriodStart: '2026-10-04T20:00:00.000Z',
      weeklyRewardClaims: 0,
    });
    await insert('genshin_routine_state', {
      userId: ids.b,
      ...timestamps,
      revision: 5,
      serverId: null,
      resinAmount: null,
      resinRecordedAt: null,
      weeklyRewardClaims: null,
    });
    await insert('genshin_plan_preferences', {
      userId: ids.a,
      revision: 11,
      dailyResinBudget: 0,
      commissions: true,
      teapot: true,
      transformer: true,
      weeklyClaims: true,
    });
    await insert('genshin_plan_preferences', {
      userId: ids.b,
      revision: 2,
      dailyResinBudget: null,
      commissions: false,
      teapot: false,
      transformer: true,
      weeklyClaims: false,
    });
    await insert('genshin_plan_dismissals', {
      userId: ids.a,
      sourceKey: 'goal:' + ids.active,
      scope: 'day',
      serverId: 'asia',
      periodId: 'genshin:asia:v1:daily:2026-10-04T20:00:00.000Z',
      goalId: ids.active,
      goalRevision: 3,
      routineKind: null,
    });
    await insert('genshin_plan_dismissals', {
      userId: ids.a,
      sourceKey: 'routine:weeklyClaims',
      scope: 'week',
      serverId: 'asia',
      periodId: 'genshin:asia:v1:weekly:2026-10-04T20:00:00.000Z',
      goalId: null,
      goalRevision: null,
      routineKind: 'weeklyClaims',
    });
    await insert(
      'daily_companion',
      row({
        userId: ids.a,
        resinAmount: 0,
        resinUpdatedAt: stamp,
        commissionsDone: true,
        teapotClaimed: false,
        transformerClaimed: true,
        dailyResetAt: stamp,
      }),
    );
    await insert(
      'weekly_boss_state',
      row({ userId: ids.a, defeatedBossKeys: JSON.stringify(['Dvalin']), weeklyResetAt: stamp }),
    );
    await insert(
      'event_progress',
      row({ userId: ids.a, eventKey: 'C5bSyntheticRetainedEvent', tierId: 't1', claimed: true }),
    );
    await insert(
      'spiral_abyss_runs',
      row({
        accountId: ids.accountA,
        cycleId: 'C5b-synthetic-cycle',
        floor: 9,
        chamber: 1,
        half: 1,
        stars: 0,
        team: JSON.stringify(['HuTao']),
      }),
    );
    await insert(
      'imaginarium_theater_runs',
      row({
        accountId: ids.accountB,
        seasonId: 'C5b-synthetic-season',
        difficulty: 'NORMAL',
        actsCleared: 1,
        stars: 0,
        cast: JSON.stringify(['HuTao']),
      }),
    );
    const nikkeAccount = uuid(600),
      nikkeCharacter = uuid(601);
    await insert(
      'NikkeAccount',
      row({
        id: nikkeAccount,
        userId: ids.b,
        commanderName: 'C5b synthetic',
        commanderLevel: null,
      }),
    );
    await insert(
      'NikkeCharacter',
      row({
        id: nikkeCharacter,
        accountId: nikkeAccount,
        characterKey: 'Rapi',
        level: 1,
        limitBreak: 0,
        coreEnhance: 0,
        skill1: 1,
        skill2: 1,
        burstSkill: 1,
      }),
    );
    await insert(
      'NikkeEquipment',
      row({
        characterId: nikkeCharacter,
        slot: 'Head',
        tier: 1,
        manufacturer: null,
        level: 1,
        isOverload: false,
      }),
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
