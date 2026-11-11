import { accountContextSchema, type ShowcaseResult } from '@celestia/api-contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotFoundError } from '@/core/errors/app-error.js';

import { importedAccountContext } from '../importer/imported-account.calculator.js';
import { importedAccountFixture } from '../importer/imported-account.fixtures.js';
import type { ImportedAccountService } from '../importer/imported-account.service.js';
import { syntheticShowcase } from '../showcase/showcase.fixtures.js';
import { parseShowcase } from '../showcase/showcase.parser.js';
import type { ShowcaseService } from '../showcase/showcase.service.js';
import { AccountContextProvider } from './account-context-provider.service.js';

describe('AccountContextProvider', () => {
  const FIXED_NOW_ISO = '2026-10-27T12:00:00.000Z';
  const FIXED_NOW_MS = Date.parse(FIXED_NOW_ISO);

  let mockImportedAccountService: { read: ReturnType<typeof vi.fn> };
  let mockShowcaseService: { lookup: ReturnType<typeof vi.fn> };
  let provider: AccountContextProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    mockImportedAccountService = {
      read: vi.fn(),
    };

    mockShowcaseService = {
      lookup: vi.fn(),
    };

    provider = new AccountContextProvider(
      mockImportedAccountService as unknown as ImportedAccountService,
      mockShowcaseService as unknown as ShowcaseService,
      undefined,
      () => FIXED_NOW_MS,
    );
  });

  describe('getForUser', () => {
    it('resolves private authenticated context with valid fingerprints and stored provenance', async () => {
      const snapshot = importedAccountFixture();
      const imported = importedAccountContext(snapshot);
      mockImportedAccountService.read.mockResolvedValueOnce(imported);

      const result = await provider.getForUser('owner-a');

      expect(mockImportedAccountService.read).toHaveBeenCalledWith('owner-a', {});
      expect(accountContextSchema.safeParse(result.context).success).toBe(true);

      expect(result.context.scope).toBe('private_authenticated');
      expect(result.context.accountId).toBe('account-a');
      expect(result.context.rosterScope).toBe('partial');
      expect(result.context.absentCharacterOwnership).toBe('unknown');
      expect(result.context.equipmentExclusivity).toBe('unverified');
      expect(result.context.sources).toEqual(['stored_account', 'good_import']);
      expect(result.context.fingerprint).toBeTruthy();
      expect(result.context.freshness).toBe('unknown');

      expect(result.context.characters).toHaveLength(1);
      const huTaoContext = result.context.characters[0]!;
      expect(huTaoContext).toMatchObject({
        formKey: '10000046:unknown',
        avatarId: 10000046,
        skillDepotId: null,
        ownership: 'unknown',
        buildState: 'stored',
        observedAt: null,
        freshness: 'unknown',
        sources: ['stored_account'],
        equipmentInstanceIds: ['weapon:weapon-a', 'artifact:artifact-a'],
      });
      expect(huTaoContext.buildFingerprint).toEqual(expect.any(String));

      expect(result.rawRoster).toHaveLength(1);
      expect(result.rawRoster[0]).toMatchObject({
        id: 'character-a',
        accountId: 'account-a',
        characterKey: 'HuTao',
        level: 80,
        equippedWeaponId: 'weapon-a',
        equippedWeapon: expect.objectContaining({
          id: 'weapon-a',
          weaponKey: 'StaffOfHoma',
          level: 80,
          refinement: 1,
        }),
      });
      expect(result.weapons).toHaveLength(1);
      expect(result.artifacts).toHaveLength(1);
    });

    it('preserves conflicted buildState when duplicate or conflicting character builds exist', async () => {
      const snapshot = importedAccountFixture();
      snapshot.characters.push({
        ...snapshot.characters[0]!,
        id: 'character-duplicate',
        level: 1,
      });
      const imported = importedAccountContext(snapshot);
      mockImportedAccountService.read.mockResolvedValueOnce(imported);

      const result = await provider.getForUser('owner-a');

      expect(result.context.characters[0]).toMatchObject({
        formKey: '10000046:unknown',
        buildState: 'conflicted',
        buildFingerprint: null,
      });
      expect(result.context.issues).toContainEqual({
        code: 'conflicting_builds',
        formKey: '10000046:unknown',
      });
    });

    it('throws NotFoundError when the user has no Genshin account', async () => {
      mockImportedAccountService.read.mockResolvedValueOnce(importedAccountContext(null));

      await expect(provider.getForUser('missing-owner')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getForShowcase', () => {
    it('resolves public UID context with partial roster scope, observed_owned characters, and unverified equipment exclusivity', async () => {
      const uid = '800000001';
      const parsed = parseShowcase(uid, syntheticShowcase(uid));
      const showcaseResult: ShowcaseResult = {
        source: 'enka.network',
        delivery: 'fetched',
        snapshot: parsed.snapshot,
        fetchedAt: FIXED_NOW_ISO,
        nextRefreshAt: new Date(FIXED_NOW_MS + 60_000).toISOString(),
        issue: null,
      };
      mockShowcaseService.lookup.mockResolvedValueOnce(showcaseResult);

      const result = await provider.getForShowcase(uid);

      expect(mockShowcaseService.lookup).toHaveBeenCalledWith(uid);
      expect(accountContextSchema.safeParse(result.context).success).toBe(true);

      expect(result.context).toMatchObject({
        version: 1,
        scope: 'public_uid',
        uid,
        rosterScope: 'partial',
        absentCharacterOwnership: 'unknown',
        equipmentExclusivity: 'unverified',
        sources: ['public_showcase'],
        oldestObservationAt: FIXED_NOW_ISO,
        newestObservationAt: FIXED_NOW_ISO,
      });
      expect(result.context.accountId).toBeUndefined();
      expect(result.context.fingerprint).toBeTruthy();
      expect(result.context.freshness).toBe('fresh');

      expect(result.context.characters).toHaveLength(1);
      const observedChar = result.context.characters[0]!;
      expect(observedChar).toMatchObject({
        formKey: '10000046:4601',
        avatarId: 10000046,
        skillDepotId: 4601,
        ownership: 'observed_owned',
        buildState: 'observed',
        observedAt: FIXED_NOW_ISO,
        freshness: 'fresh',
        sources: ['public_showcase'],
        equipmentInstanceIds: ['weapon:13501', 'artifact:90543'],
      });
      expect(observedChar.buildFingerprint).toEqual(expect.any(String));

      expect(result.rawRoster).toHaveLength(1);
      expect(result.rawRoster[0]!.characterKey).toBe('HuTao');
      expect(result.weapons).toHaveLength(1);
      expect(result.artifacts).toHaveLength(1);
    });

    it('marks showcase context and character freshness as stale when observation exceeds policy window', async () => {
      const uid = '800000001';
      const parsed = parseShowcase(uid, syntheticShowcase(uid));
      const staleFetchedAt = new Date(FIXED_NOW_MS - 10 * 24 * 60 * 60 * 1000).toISOString();
      mockShowcaseService.lookup.mockResolvedValueOnce({
        source: 'enka.network',
        delivery: 'stale',
        snapshot: parsed.snapshot,
        fetchedAt: staleFetchedAt,
        nextRefreshAt: new Date(FIXED_NOW_MS + 60_000).toISOString(),
        issue: {
          code: 'ENKA_503',
          message: 'Enka is temporarily unavailable. Try again later.',
          status: 503,
        },
      } satisfies ShowcaseResult);

      const result = await provider.getForShowcase(uid);

      expect(accountContextSchema.safeParse(result.context).success).toBe(true);
      expect(result.context.freshness).toBe('stale');
      expect(result.context.sourceTimestamps[0]?.freshness).toBe('stale');
      expect(result.context.characters[0]?.freshness).toBe('stale');
      expect(result.context.missingData).toContainEqual({
        dimension: 'freshness',
        status: 'stale',
        reason: 'observation_exceeded_policy',
      });
    });

    it('handles empty showcase snapshot gracefully with structured unavailable observation state', async () => {
      const uid = '800000001';
      mockShowcaseService.lookup.mockResolvedValueOnce({
        source: 'enka.network',
        delivery: 'cached',
        snapshot: {
          uid,
          nickname: 'Hidden Showcase Traveler',
          adventureRank: 60,
          worldLevel: 8,
          signature: 'Empty showcase',
          characters: [],
        },
        fetchedAt: FIXED_NOW_ISO,
        nextRefreshAt: new Date(FIXED_NOW_MS + 60_000).toISOString(),
        issue: null,
      } satisfies ShowcaseResult);

      const result = await provider.getForShowcase(uid);

      expect(accountContextSchema.safeParse(result.context).success).toBe(true);
      expect(result.context.scope).toBe('public_uid');
      expect(result.context.rosterScope).toBe('partial');
      expect(result.context.equipmentExclusivity).toBe('unverified');
      expect(result.context.characters).toEqual([]);
      expect(result.context.freshness).toBe('unavailable');
      expect(result.context.sourceTimestamps[0]?.freshness).toBe('unavailable');
      expect(result.context.missingData).toContainEqual({
        dimension: 'observation',
        status: 'unavailable',
        reason: 'showcase_has_no_observed_characters',
      });
      expect(result.rawRoster).toEqual([]);
    });

    it('throws NotFoundError when public showcase snapshot is null (missing profile)', async () => {
      const uid = '800000001';
      mockShowcaseService.lookup.mockResolvedValueOnce({
        source: 'enka.network',
        delivery: 'unavailable',
        snapshot: null,
        fetchedAt: null,
        nextRefreshAt: new Date(FIXED_NOW_MS + 30_000).toISOString(),
        issue: {
          code: 'ENKA_404',
          message: 'No public player was found for this UID.',
          status: 404,
        },
      } satisfies ShowcaseResult);

      await expect(provider.getForShowcase(uid)).rejects.toThrow(NotFoundError);
    });
  });
});
