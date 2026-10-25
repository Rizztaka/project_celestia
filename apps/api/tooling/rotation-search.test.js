import { Worker } from 'node:worker_threads';

import { afterEach, describe, expect, it, vi } from 'vitest';

import manifest from '../../web/public/vendor/gcsim-v2.47.2/manifest.json';
import { damageInput, summarizeRuns } from '../../web/src/lib/team-damage/calculator.ts';
import { describeRotation } from '../../web/src/lib/team-damage/rotation-explainer.ts';
import {
  damageChange,
  rankDamage,
  rotationCandidates,
} from '../../web/src/lib/team-damage/rotation-search.calculator.ts';
import { runTeamSimulation, searchTeamRotations } from '../../web/src/lib/team-damage/service.ts';
import { analysisFixture } from './build-analysis-fixtures.mjs';

const step = (characterKey, action = 'skill', repeat = 1) => ({
  characterKey,
  action,
  repeat,
  waitFrames: 0,
  params: '',
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe('bounded rotation planning', () => {
  it('includes the baseline, preserves combos and timing, samples all four-turn orders and varies attack counts deterministically', () => {
    const steps = [
      step('a'),
      { ...step('a', 'burst'), waitFrames: 90, params: 'hold=1' },
      step('b'),
      step('c'),
      step('d'),
      step('d', 'attack', 6),
    ];
    const before = structuredClone(steps);
    const plan = rotationCandidates(steps, 48);
    expect(plan.candidates[0].steps).toEqual(steps);
    expect(plan.candidates.length).toBeLessThanOrEqual(48);
    expect(new Set(plan.candidates.map((c) => JSON.stringify(c.steps))).size).toBe(
      plan.candidates.length,
    );
    expect(
      new Set(
        plan.candidates.slice(0, 24).map((c) =>
          c.steps
            .filter((s) => s.action === 'skill')
            .map((s) => s.characterKey)
            .join(''),
        ),
      ).size,
    ).toBe(24);
    for (const candidate of plan.candidates) {
      const first = candidate.steps.findIndex((s) => s.characterKey === 'a');
      expect(candidate.steps.slice(first, first + 2)).toEqual(steps.slice(0, 2));
      expect(candidate.steps.reduce((s, a) => s + a.repeat, 0)).toBeLessThanOrEqual(200);
    }
    expect(
      new Set(plan.candidates.map((c) => c.steps.find((s) => s.action === 'attack').repeat)),
    ).toEqual(new Set([3, 6, 9]));
    expect(rotationCandidates(steps, 48)).toEqual(plan);
    expect(steps).toEqual(before);
    expect(rotationCandidates(steps, 12).candidates.length).toBeLessThanOrEqual(12);
  });
  it('handles empty plans, limits turns and ranks ties without mutating rows or inventing zero-baseline gains', () => {
    expect(rotationCandidates([], 12).issue).toBe('empty');
    expect(
      rotationCandidates(
        Array.from({ length: 9 }, (_, i) => step(String(i))),
        12,
      ).issue,
    ).toBe('turn_limit');
    const rows = [
      { id: '2', dps: 10 },
      { id: '0', dps: 10 },
      { id: '1', dps: 20 },
    ];
    expect(rankDamage(rows).map((r) => r.id)).toEqual(['1', '0', '2']);
    expect(rows[0].id).toBe('2');
    expect(() => rankDamage([{ id: '0', dps: NaN }])).toThrow();
    expect(damageChange(0, 10)).toBeNull();
    expect(damageChange(100, 120)).toBeCloseTo(20);
    expect(
      describeRotation([{ ...step('a', 'attack', 3), waitFrames: 90 }], { a: 'Furina' })[0],
    ).toContain('Furina: Normal attack ×3 → wait 1.5s');
  });
});

function fakeRun(dps, seed) {
  return {
    seed: String(seed),
    durationFrames: 600,
    totalDamage: dps * 10,
    dps,
    members: ['a', 'b', 'c', 'd'].map((key, i) => ({
      key,
      damage: i === 0 ? dps * 10 : 0,
      activeFrames: 0,
      actions: 1,
      failedIntervals: 0,
    })),
  };
}
function installWorker(responder) {
  const instances = [];
  class TestWorker {
    messages = [];
    terminated = false;
    constructor() {
      instances.push(this);
    }
    postMessage(message) {
      this.messages.push(message);
      if (responder) queueMicrotask(() => responder(this, message));
    }
    terminate() {
      this.terminated = true;
    }
  }
  vi.stubGlobal('Worker', TestWorker);
  vi.stubGlobal('window', { setTimeout, clearTimeout });
  return instances;
}
describe('search orchestration and worker lifecycle', () => {
  it('screens once, verifies the baseline and finalists with identical sample counts, reranks and excludes errors', async () => {
    const instances = installWorker((worker, message) =>
      worker.onmessage({
        data: {
          type: 'result',
          results: message.jobs.map((job) =>
            job.id === '4'
              ? { id: job.id, error: 'Unsupported action' }
              : {
                  id: job.id,
                  runs: Array.from({ length: job.samples }, (_, i) =>
                    fakeRun(
                      job.samples === 1
                        ? 100 + Number(job.id)
                        : job.id === '1'
                          ? 500
                          : 100 + Number(job.id),
                      i + 1,
                    ),
                  ),
                },
          ),
        },
      }),
    );
    const job = searchTeamRotations(
      Array.from({ length: 5 }, (_, i) => ({ id: String(i), config: 'config' + i })),
      10,
      () => {},
    );
    const result = await job.promise;
    expect(instances).toHaveLength(1);
    expect(instances[0].messages[0].jobs.every((j) => j.samples === 1)).toBe(true);
    expect(instances[0].messages[1].jobs.map((j) => j.id)).toEqual(['0', '3', '2', '1']);
    expect(instances[0].messages[1].jobs.every((j) => j.samples === 10)).toBe(true);
    expect(result.ranked[0].id).toBe('1');
    expect(result.failed).toBe(1);
    expect(instances[0].terminated).toBe(true);
  });
  it('rejects incomplete comparisons, baseline failures and cancellation, and releases the worker', async () => {
    const instances = installWorker();
    const run = runTeamSimulation('config', 2, () => {});
    instances[0].onmessage({ data: { type: 'result', results: [] } });
    await expect(run.promise).rejects.toThrow('incomplete');
    expect(instances[0].terminated).toBe(true);
    const cancelled = searchTeamRotations(
      [
        { id: '0', config: 'x' },
        { id: '1', config: 'y' },
      ],
      10,
      () => {},
    );
    cancelled.cancel();
    await expect(cancelled.promise).rejects.toThrow('cancelled');
    expect(instances[1].terminated).toBe(true);
    const failed = searchTeamRotations(
      [
        { id: '0', config: 'x' },
        { id: '1', config: 'y' },
      ],
      10,
      () => {},
    );
    instances[2].onmessage({
      data: {
        type: 'result',
        results: [
          { id: '0', error: 'No baseline' },
          { id: '1', runs: [fakeRun(1, 1)] },
        ],
      },
    });
    await expect(failed.promise).rejects.toThrow('No baseline');
    expect(instances[2].terminated).toBe(true);
  });
  it('times out a stalled search without leaving a worker running', async () => {
    vi.useFakeTimers();
    const instances = installWorker();
    const job = searchTeamRotations(
      [
        { id: '0', config: 'x' },
        { id: '1', config: 'y' },
      ],
      10,
      () => {},
    );
    const rejection = expect(job.promise).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(240000);
    await rejection;
    expect(instances[0].terminated).toBe(true);
  });
});

it('executes the shipped batch worker and real WASM against one non-dying neutral dummy with matching seeds', async () => {
  const f = analysisFixture('800000001');
  const records = f.snapshot.characters.map((character) => ({
    uid: '800000001',
    character,
    observedAt: f.fetchedAt,
  }));
  const members = [0, 2, 4, 5].map((i) => ({
    characterKey: records[i].character.key,
    roleId: 'unspecified',
  }));
  const team = { uid: '800000001', version: 1, id: 'test', name: 'Test', members };
  const settings = {
    duration: 10,
    enemyLevel: 100,
    resistance: 0,
    samples: 2,
    steps: [
      ...members.map((m) => step(m.characterKey)),
      step(members[2].characterKey, 'attack', 3),
    ],
  };
  const config = damageInput(team.uid, team, records, settings).config;
  expect(config.match(/^target /gm)).toHaveLength(1);
  expect(config).toContain('target lvl=100 resist=0 pos=0,0 radius=1;');
  expect(config.split('\n').find((line) => line.startsWith('target '))).not.toMatch(/\bhp=/);
  const results = await new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./gcsim/browser-worker-runner.mjs', import.meta.url), {
      workerData: [
        {
          hash: manifest.wasmSha256,
          jobs: [
            { id: '0', config, samples: 2 },
            { id: '1', config, samples: 2 },
          ],
        },
        { hash: manifest.wasmSha256, jobs: [{ id: '0', config, samples: 2 }] },
        { hash: manifest.wasmSha256, jobs: [] },
        { hash: manifest.wasmSha256, config, samples: 2 },
      ],
    });
    worker.once('message', resolve);
    worker.once('error', reject);
    worker.once('exit', (code) => {
      if (code !== 0) reject(new Error('Worker failed'));
    });
  });
  expect(results[0].type).toBe('result');
  expect(results[0].results[0].runs).toEqual(results[0].results[1].runs);
  expect(results[0].results[0].runs).toEqual(results[1].results[0].runs);
  expect(results[0].results[0].runs[0].durationFrames).toBe(600);
  expect(summarizeRuns(results[0].results[0].runs).dps).toBeGreaterThan(0);
  expect(results[2].type).toBe('error');
  expect(results[3].runs).toEqual(results[0].results[0].runs);
}, 60000);
