import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { ProfileReferenceService } from './profile-reference.service.js';

const service = new ProfileReferenceService();
const root = new URL('../static/profile-reference/', import.meta.url);
const index = JSON.parse(readFileSync(new URL('index.json', root), 'utf8'));
describe('production profile references', () => {
  it('reads every canonical character and item through bounded contracts and verified bytes', () => {
    expect(Object.keys(index.characters)).toHaveLength(129);
    expect(Object.keys(index.weapons)).toHaveLength(252);
    expect(Object.keys(index.artifacts)).toHaveLength(63);
    for (const key of Object.keys(index.characters)) {
      const ref = service.character(key);
      expect(ref.key).toBe(key);
      expect(ref.description.length).toBeGreaterThan(5);
      expect(Buffer.byteLength(JSON.stringify(ref))).toBeLessThan(150000);
      if (!ref.forms.length) {
        expect(ref.constellations.map((e) => e.constellation)).toEqual([1, 2, 3, 4, 5, 6]);
        expect(ref.talents.some((t) => t.kind === 'normal')).toBe(true);
        expect(ref.talents.some((t) => t.kind === 'passive')).toBe(true);
      }
      expect(ref.talents.every((t) => t.unlock === 'unknown')).toBe(true);
    }
    for (const key of Object.keys(index.weapons)) expect(service.weapon(key).key).toBe(key);
    for (const key of Object.keys(index.artifacts)) expect(service.artifact(key).key).toBe(key);
  });
  it('preserves full charged/plunge, alternate sprint, passive and constellation conditions', () => {
    const ayaka = service.character('KamisatoAyaka');
    expect(ayaka.talents.find((e) => e.kind === 'normal')!.description).toContain(
      '\n\nCharged Attack\n',
    );
    expect(ayaka.talents.find((e) => e.key === 'combatsp')!.description).toContain(
      'Alternate Sprint',
    );
    expect(ayaka.talents.find((e) => e.key === 'passive2')!.description).toContain(
      'When the Cryo application',
    );
    expect(service.character('Aino').constellations[0]!.description).toContain('do not stack');
  });
  it('does not infer Traveler form or transfer another form’s identity', () => {
    for (const key of ['Aether', 'Lumine']) {
      const ref = service.character(key);
      expect(ref.forms).toHaveLength(7);
      expect(ref.talents).toEqual([]);
      expect(ref.constellations).toEqual([]);
    }
    expect(service.character('TravelerDendro').element).toBe('Dendro');
    expect(service.character('TravelerDendro').talents.find((t) => t.kind === 'skill')!.name).toBe(
      'Razorgrass Blade',
    );
  });
  it('joins exact weapon ranks and artifact piece/effect counts without flattening conditions', () => {
    const weapon = service.weapon('HarbingerOfDawn');
    expect(weapon.refinements.find((r) => r.rank === 1)!.description).toBe(
      'When HP is above 90%, increases CRIT Rate by 14%.',
    );
    expect(weapon.refinements.find((r) => r.rank === 5)!.description).toContain('28%');
    const set = service.artifact('GoldenTroupe');
    expect(set.pieces[0]!.name).toBe("Golden Song's Variation");
    expect(set.effects.map((e) => e.pieces)).toEqual([2, 4]);
    expect(set.effects[1]!.description).toContain('cleared 2s after taking the field');
  });
  it('rejects unknown keys, prototype keys and traversal without falling back to a kit', () => {
    for (const key of ['missing', '__proto__', '../../index', 'Traveler', 'Keqing%00'])
      expect(() => service.character(key)).toThrow('Reference not available');
    expect(() => service.character('x'.repeat(201))).toThrow('Invalid reference key');
  });
  it('fails closed for corrupted files and valid-hash contract/identity mismatches', () => {
    const dir = mkdtempSync(join(tmpdir(), 'celestia-profile-reference-'));
    for (const value of [
      '{}',
      JSON.stringify({ ...service.character('Keqing'), key: 'Fischl' }),
      JSON.stringify({ ...service.character('Keqing'), description: 'x'.repeat(20001) }),
    ]) {
      const bytes = Buffer.from(value);
      writeFileSync(join(dir, 'characters-Keqing.json'), bytes);
      const local = {
        contractVersion: 1,
        characters: {
          Keqing: {
            file: 'characters-Keqing.json',
            sha256: createHash('sha256').update(bytes).digest('hex'),
          },
        },
        weapons: {},
        artifacts: {},
      };
      writeFileSync(join(dir, 'index.json'), JSON.stringify(local));
      expect(() => new ProfileReferenceService(dir).character('Keqing')).toThrow(
        'temporarily unavailable',
      );
    }
    writeFileSync(join(dir, 'characters-Keqing.json'), 'tampered');
    expect(() => new ProfileReferenceService(dir).character('Keqing')).toThrow(
      'temporarily unavailable',
    );
  });
});
