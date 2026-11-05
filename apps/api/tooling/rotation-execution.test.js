import { Worker } from 'node:worker_threads';

import { expect, it } from 'vitest';

import { summarizeRuns } from '../../web/src/lib/team-damage/calculator.ts';
import { executionConfig, summaryRun } from './rotation-execution-fixtures.mjs';

function runEngine(workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./gcsim/runtime-runner.mjs', import.meta.url), {
      workerData,
    });
    worker.once('message', resolve);
    worker.once('error', reject);
    worker.once('exit', (code) => {
      if (code) reject(new Error(`Runtime exit ${code}`));
    });
  });
}

it('distinguishes cooldown retry checks from energy retry checks in the actual engine', async () => {
  const [skill, burst, sameBurst] = await runEngine([
    { config: executionConfig('skill'), seed: 1 },
    { config: executionConfig('burst'), seed: 1 },
    { config: executionConfig('burst'), seed: 1 },
  ]);
  expect(skill).not.toHaveProperty('error');
  expect(burst).not.toHaveProperty('error');
  expect(skill.diagnosticsVersion).toBe(1);
  // Captured from the previous bridge with this exact pinned source, Go and seed.
  expect(skill.dps).toBe(70.26634841904867);
  expect(burst.dps).toBe(18.554059559753924);
  expect(skill.members[0].blockedAttempts.skill_cd).toBeGreaterThan(0);
  expect(skill.members[0].blockedAttempts.insufficient_energy ?? 0).toBe(0);
  expect(skill.members[0].actionCounts.skill).toBeGreaterThan(1);
  expect(burst.members[0].blockedAttempts.insufficient_energy).toBeGreaterThan(0);
  expect(burst.members[0].actionCounts.burst).toBe(1);
  for (const member of burst.members) {
    expect(Object.values(member.actionCounts).reduce((a, b) => a + b, 0)).toBe(member.actions);
  }
  expect(burst).toEqual(sameBurst);
}, 60000);

it('averages retry and action counts over every sample, including samples with zero checks', () => {
  const first = summaryRun();
  first.members[0].blockedAttempts.insufficient_energy = 60;
  const second = summaryRun();
  second.seed = '2';
  const before = structuredClone([first, second]);
  const result = summarizeRuns([first, second]);
  expect(result.diagnosticsAvailable).toBe(true);
  expect(result.members[0].blockedAttempts).toEqual({ insufficient_energy: 30, skill_cd: 120 });
  expect(result.members[0].actionCounts).toEqual({ burst: 1, skill: 2 });
  expect(result.members[1].blockedAttempts).toEqual({});
  expect([first, second]).toEqual(before);
});

it('keeps missing or mixed-version diagnostics unknown instead of silently reporting zero blocks', () => {
  for (const runs of [[summaryRun(false)], [summaryRun(), summaryRun(false)]]) {
    const result = summarizeRuns(runs);
    expect(result.diagnosticsAvailable).toBe(false);
    expect(result.members.every((m) => m.blockedAttempts === null && m.actionCounts === null)).toBe(
      true,
    );
    expect(result.dps).toBe(100);
  }
});

it('does not read inherited object properties when a counter is absent in another sample', () => {
  const first = summaryRun();
  const second = summaryRun();
  first.members[0].blockedAttempts = { constructor: 4 };
  second.members[0].blockedAttempts = {};
  const result = summarizeRuns([first, second]);
  expect(result.members[0].blockedAttempts).toEqual({ constructor: 2 });
});

it('rejects partial, inconsistent or malformed diagnostics before they can become readiness advice', () => {
  for (const mutate of [
    (run) => {
      delete run.members[0].blockedAttempts;
    },
    (run) => {
      run.members[0].blockedAttempts.insufficient_energy = -1;
    },
    (run) => {
      run.members[0].blockedAttempts.skill_cd = 1.5;
    },
    (run) => {
      run.members[0].actionCounts.burst = 2;
    },
    (run) => {
      run.members[0].actionCounts = [];
    },
    (run) => {
      run.members[0].blockedAttempts = { unknown: NaN };
    },
    (run) => {
      run.members[0].blockedAttempts = { 'bad key': 4 };
    },
  ]) {
    const run = summaryRun();
    mutate(run);
    expect(() => summarizeRuns([run])).toThrow('INVALID_SIMULATION_RESULT');
  }
});
