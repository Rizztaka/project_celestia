import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Worker } from 'node:worker_threads';
import { gunzipSync } from 'node:zlib';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { damageInput, summarizeRuns } from '../../web/src/lib/team-damage/calculator.ts';
import {
  readDamageSettings,
  saveDamageSettings,
} from '../../web/src/lib/team-damage/preferences.ts';
import { analysisFixture } from './build-analysis-fixtures.mjs';

const uid = '800000001';
afterEach(() => vi.unstubAllGlobals());
function runEngine(workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./gcsim/runtime-runner.mjs', import.meta.url), {
      workerData,
    });
    worker.once('message', resolve);
    worker.once('error', reject);
    worker.once('exit', (code) => {
      if (code !== 0) reject(new Error(`Runtime exit ${code}`));
    });
  });
}
function fixture() {
  const f = analysisFixture(uid);
  const records = f.snapshot.characters.map((character) => ({
    uid,
    character,
    observedAt: f.fetchedAt,
  }));
  const members = [0, 2, 4, 5].map((i) => ({
    characterKey: records[i].character.key,
    roleId: 'unspecified',
  }));
  const team = { uid, version: 1, id: 'damage-check', name: 'Synthetic damage', members };
  const settings = {
    duration: 10,
    enemyLevel: 100,
    resistance: 10,
    samples: 1,
    steps: members.map((m) => ({
      characterKey: m.characterKey,
      action: 'skill',
      repeat: 1,
      params: '',
      waitFrames: 0,
    })),
  };
  settings.steps.push({ ...settings.steps[1], action: 'attack', repeat: 5 });
  return { team, records, settings };
}
describe('observed build to damage simulation', () => {
  it('ships the pinned engine and matching source bridge with verified checksums', () => {
    const asset = (name) =>
      new URL(`../../web/public/vendor/gcsim-v2.47.2/${name}`, import.meta.url);
    const manifest = JSON.parse(readFileSync(asset('manifest.json')));
    const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
    expect(hash(gunzipSync(readFileSync(asset('engine.wasm.gz'))))).toBe(manifest.wasmSha256);
    expect(hash(readFileSync(asset('wasm_exec.js'), 'utf8').replaceAll('\r\n', '\n'))).toBe(
      manifest.runtimeSha256,
    );
    expect(
      hash(
        readFileSync(new URL('./gcsim/celestia.go', import.meta.url), 'utf8').replaceAll(
          '\r\n',
          '\n',
        ),
      ),
    ).toBe(manifest.bridgeSha256);
    expect(manifest.revision).toBe('caf738dc807a646e2eee7e7b572f225dd6deb510');
    expect(manifest.license).toBe('MIT');
  });
  it('saves rotation preferences within the team and UID without modifying builds', () => {
    const rows = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (key) => rows.get(key) ?? null,
      setItem: (key, value) => rows.set(key, value),
    });
    const f = fixture();
    saveDamageSettings(uid, f.team.id, f.settings);
    expect(readDamageSettings(uid, f.team.id)).toEqual(f.settings);
    expect(readDamageSettings('800000002', f.team.id)).toBeNull();
    expect(readDamageSettings(uid, 'other-team')).toBeNull();
  });
  it('rejects corrupt, oversized and invalid saved rotations without crashing the details page', () => {
    let raw = 'broken';
    vi.stubGlobal('localStorage', {
      getItem: () => raw,
      setItem: () => {
        throw new Error('blocked');
      },
    });
    expect(readDamageSettings(uid, 'x')).toBeNull();
    raw = ' '.repeat(32001);
    expect(readDamageSettings(uid, 'x')).toBeNull();
    const f = fixture();
    expect(() => saveDamageSettings(uid, 'x', { ...f.settings, duration: 0 })).toThrow();
    expect(() => saveDamageSettings(uid, 'x', f.settings)).toThrow('blocked');
  });
  it('uses artifact-only stats, stable IDs and base talents without inventing bonuses', () => {
    const { team, records, settings } = fixture();
    const original = JSON.stringify(records);
    const result = damageInput(uid, team, records, settings);
    expect(result.issues).toEqual([]);
    expect(result.config).toContain('furina char lvl=80/90 cons=0 talent=1,8,8;');
    expect(result.config).toContain('weapon="fleuvecendreferryman"');
    expect(result.config).toContain('hp%=0.932');
    expect(result.config).not.toContain('30000');
    expect(result.config).toContain('count=5');
    expect(result.config).toContain('swap_delay=12');
    expect(result.config).not.toContain('ignore_burst_energy');
    expect(JSON.stringify(records)).toBe(original);
  });
  it('blocks missing data, unsupported kits, duplicate slots and unknown stats instead of partial totals', () => {
    for (const mutate of [
      (f) => {
        f.records[0].character.id = 10000120;
        f.records[0].character.key = '10000120:12001';
        f.team.members[0].characterKey = '10000120:12001';
      },
      (f) => {
        f.records[0].character.weapon.id = 999999;
      },
      (f) => {
        f.records[0].character.artifacts[2].mainStat = null;
      },
      (f) => {
        f.records[0].character.artifacts[2].slot = 'Flower';
      },
      (f) => {
        f.records[0].character.artifacts[2].stats.push({
          id: 'unreviewed',
          name: '?',
          value: 5,
          formatted: '5',
        });
      },
      (f) => {
        f.records[0].uid = '800000002';
      },
      (f) => {
        f.records[0].character.talents[0].kind = null;
      },
    ]) {
      const f = fixture();
      mutate(f);
      expect(damageInput(uid, f.team, f.records, f.settings).config).toBeNull();
    }
  });
  it('bounds rotations and prevents script injection through action parameters', () => {
    const f = fixture();
    f.settings.steps[0].params = 'hold=1';
    expect(damageInput(uid, f.team, f.records, f.settings).config).toContain('[hold=1]');
    for (const params of ['hold=1];target lvl=1;', 'test="x"', 'hold=Infinity']) {
      f.settings.steps[0].params = params;
      expect(damageInput(uid, f.team, f.records, f.settings).config).toBeNull();
    }
    f.settings.steps[0].params = '';
    f.settings.steps[0].repeat = 100;
    expect(damageInput(uid, f.team, f.records, f.settings).config).toBeNull();
  });
  it('changes the frozen signature for rotation, enemy, build and engine inputs', () => {
    const f = fixture();
    const before = damageInput(uid, f.team, f.records, f.settings);
    f.settings.enemyLevel = 90;
    expect(damageInput(uid, f.team, f.records, f.settings).signature).not.toBe(before.signature);
    f.settings.enemyLevel = 100;
    f.records[0].observedAt = '2026-10-20T00:00:00.000Z';
    expect(damageInput(uid, f.team, f.records, f.settings).signature).not.toBe(before.signature);
  });
  it('runs the real pinned WASM engine reproducibly, conserves damage and responds to enemy resistance', async () => {
    const f = fixture();
    const normal = damageInput(uid, f.team, f.records, f.settings);
    const resistant = damageInput(uid, f.team, f.records, { ...f.settings, resistance: 50 });
    const runs = await runEngine([
      { config: normal.config, seed: 1 },
      { config: normal.config, seed: 1 },
      { config: resistant.config, seed: 1 },
    ]);
    expect(runs[0]).not.toHaveProperty('error');
    expect(runs[0].dps).toBeGreaterThan(0);
    expect(runs[0]).toEqual(runs[1]);
    expect((await runEngine([{ config: normal.config, seed: 1 }]))[0]).toEqual(runs[0]);
    expect(runs[2].dps).toBeLessThan(runs[0].dps);
    expect(runs[0].members).toHaveLength(4);
    expect(runs[0].members.reduce((sum, m) => sum + m.damage, 0)).toBeCloseTo(
      runs[0].totalDamage,
      5,
    );
    expect(runs[0].totalDamage / (runs[0].durationFrames / 60)).toBeCloseTo(runs[0].dps, 5);
    const summary = summarizeRuns(runs.slice(0, 2));
    expect(summary.dps).toBe(runs[0].dps);
    expect(() =>
      summarizeRuns([
        {
          ...runs[0],
          members: runs[0].members.map((member, i) => (i ? member : { ...member, damage: NaN })),
        },
      ]),
    ).toThrow();
  }, 60000);
});
