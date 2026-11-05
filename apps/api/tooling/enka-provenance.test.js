import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { projectEnkaMetadata, verifyEnkaProvenance } from './enka-provenance.mjs';

const root = new URL('../src/games/genshin/static/enka/', import.meta.url);
const input = () => {
  const provenanceBytes = readFileSync(new URL('provenance.json', root));
  return {
    provenanceBytes,
    provenance: JSON.parse(provenanceBytes),
    charactersBytes: readFileSync(new URL('characters.json', root)),
    englishBytes: readFileSync(new URL('english.json', root)),
  };
};
describe('Enka projection provenance', () => {
  it('does not confuse a local projection digest with upstream integrity or independent approval', () => {
    expect(verifyEnkaProvenance(input())).toMatchObject({
      localByteIntegrity: 'verified',
      metadataIntegrity: 'verified',
      upstreamByteIntegrity: 'unavailable',
      projectionIntegrity: 'unavailable',
      provenance: 'unverified',
      status: 'unverified',
    });
  });
  it('rejects local bytes and metadata changed together', () => {
    const data = input();
    data.charactersBytes = Buffer.from('{}');
    data.provenance.localSha256 = 'caller supplied';
    data.provenanceBytes = Buffer.from(JSON.stringify(data.provenance));
    expect(verifyEnkaProvenance(data)).toMatchObject({
      status: 'invalid',
      localByteIntegrity: 'invalid',
      metadataIntegrity: 'invalid',
    });
  });
  it('rejects a mutable URL/revision even if the metadata object is detached from its original bytes', () => {
    const data = input();
    data.provenance.revision = 'master';
    data.provenance.sources[0].url = data.provenance.sources[0].url.replace(
      /\/[a-f0-9]{40}\//,
      '/master/',
    );
    expect(verifyEnkaProvenance(data)).toMatchObject({
      status: 'invalid',
      metadataIntegrity: 'invalid',
    });
  });
  it('rejects tampered raw upstream bytes without allowing refreshed metadata pins', () => {
    const data = input();
    data.upstream = {
      'gi/avatars': Buffer.from('{}'),
      loc: Buffer.from('{}'),
      'gi/locs': Buffer.from('{}'),
    };
    expect(verifyEnkaProvenance(data)).toMatchObject({
      status: 'invalid',
      upstreamByteIntegrity: 'invalid',
      projectionIntegrity: 'invalid',
    });
  });
  it('reproduces the documented core projection and locale precedence without inventing forms', () => {
    const result = projectEnkaMetadata({
      'gi/avatars': {
        '10000005-504': {
          NameTextMapHash: 42,
          Element: 'Wind',
          SideIconName: '/a.png',
          SkillOrder: [1, 2, 3],
          Costumes: { 9: { Icon: 'front', SideIcon: 'side' } },
          Ignored: true,
        },
        invalid: { Element: 'Fire' },
      },
      loc: { en: { 42: 'Old', 7: 'Equipment' } },
      'gi/locs': { en: { 42: 'New' } },
    });
    expect(result).toEqual({
      characters: {
        '10000005-504': {
          NameTextMapHash: 42,
          Element: 'Wind',
          SideIconName: '/a.png',
          SkillOrder: [1, 2, 3],
          ProudMap: {},
          Costumes: { 9: { icon: 'front', sideIconName: 'side' } },
        },
      },
      english: { 42: 'New', 7: 'Equipment' },
    });
  });
});
