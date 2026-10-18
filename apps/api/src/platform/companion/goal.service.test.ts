import { randomUUID } from 'node:crypto';

import { createGoalSchema, focusCommandSchema, goalCommandSchema } from '@celestia/api-contracts';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/core/db/prisma.js', () => ({ prisma: {} }));
import { GoalService } from './goal.service.js';
const valid = () => ({
  contractVersion: 3,
  requestId: randomUUID(),
  goalType: 'CHARACTER_TALENT',
  targetKey: 'HuTao',
  fromPhase: 1,
  toPhase: 6,
  talentType: 'normal',
  priority: 3,
});
// Ownership, duplicate conflicts and successful writes now execute against PostgreSQL
// in goal-lifecycle.integration.test.ts; no mocked persistence result substitutes for them.
describe('Goal service and shared strict contract', () => {
  it.each([
    { goalType: 'INVALID' },
    { targetKey: '' },
    { targetKey: 'x'.repeat(201) },
    { targetKey: 'bad\nkey' },
    { fromPhase: 0 },
    { fromPhase: NaN },
    { fromPhase: 1.5 },
    { toPhase: Infinity },
    { toPhase: 11 },
    { toPhase: 1 },
    { talentType: null },
    { talentType: 'auto' },
    { priority: 0 },
    { priority: 6 },
    { priority: 1.5 },
    { ownerId: 'foreign' },
    { accountId: 'foreign' },
    { status: 'completed' },
    { expectedRevision: 0 },
    { requestId: 'not-uuid' },
    { goalType: 'CHARACTER_ASCENSION', talentType: 'normal' },
    { goalType: 'WEAPON_ASCENSION', talentType: 'skill' },
  ])('rejects invalid input directly in the service: %j', async (extra) => {
    await expect(
      new GoalService().createGoal('owner', { ...valid(), ...extra }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
  it.each(['CHARACTER_ASCENSION', 'WEAPON_ASCENSION'])(
    'accepts the bounded %s shape',
    (goalType) => {
      expect(
        createGoalSchema.parse({ ...valid(), goalType, talentType: null, fromPhase: 0 }).fromPhase,
      ).toBe(0);
    },
  );
  it.each(['normal', 'skill', 'burst'])(
    'accepts base talent slot %s at both range limits',
    (talentType) => {
      expect(
        createGoalSchema.parse({ ...valid(), talentType, fromPhase: 9, toPhase: 10 }).talentType,
      ).toBe(talentType);
    },
  );
  it('fails closed for unversioned create clients', async () => {
    await expect(
      new GoalService().createGoal('owner', {
        goalType: 'CHARACTER_ASCENSION',
        targetKey: 'HuTao',
        fromPhase: 0,
        toPhase: 6,
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
  it('accepts opaque parameterized natural keys without normalization', () => {
    const targetKey = "Legacy / ' OR 1=1 -- ? 字";
    expect(createGoalSchema.parse({ ...valid(), targetKey }).targetKey).toBe(targetKey);
  });
  it('rejects unknown, fractional, stale-contract and cross-action command fields', async () => {
    for (const extra of [
      { action: 'delete' },
      { expectedRevision: -1 },
      { expectedRevision: 1.5 },
      { contractVersion: 2 },
      { ownerId: 'foreign' },
      { priority: 2 },
      { reason: 'achieved' },
    ]) {
      const request = { contractVersion: 3, expectedRevision: 0, action: 'pause', ...extra };
      expect(goalCommandSchema.safeParse(request).success).toBe(false);
      await expect(new GoalService().updateGoal('owner', 'id', request)).rejects.toMatchObject({
        statusCode: 400,
      });
    }
    expect(
      goalCommandSchema.safeParse({ contractVersion: 3, expectedRevision: 0, action: 'complete' })
        .success,
    ).toBe(false);
  });
  it('strict focus commands reject caller ownership, stale versions and non-integer revisions', () => {
    for (const extra of [
      { accountId: 'foreign' },
      { contractVersion: 2 },
      { focused: 1 },
      { expectedRevision: NaN },
      { expectedRevision: 0.5 },
    ])
      expect(
        focusCommandSchema.safeParse({
          contractVersion: 1,
          expectedRevision: 0,
          focused: true,
          ...extra,
        }).success,
      ).toBe(false);
  });
});
