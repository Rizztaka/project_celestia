import { describe, expect, it } from 'vitest';

import {
  applyWishResultToSession,
  buildSandboxPullRequest,
  clearWishSandboxSession,
  createInitialWishSandboxSession,
  getActivePityForBanner,
  loadWishSandboxSession,
  MAX_RECENT_PULLS_RETAINED,
  resetSandboxSession,
  saveWishSandboxSession,
  setBannerScenario,
  setPathTarget,
  updatePityOverrides,
  WISH_SANDBOX_STORAGE_KEY,
} from '../../web/src/lib/wish-sandbox-session.ts';

const mavuikaBanner = {
  bannerId: 'banner_mavuika_phase1',
  name: 'Ancient Flame Ablaze · v5.3',
  type: 'CHARACTER',
  fiveStarKey: 'Mavuika',
  fiveStarKeys: ['Mavuika'],
  fourStarKeys: ['Kachina', 'Bennett', 'Diona'],
  startDate: '2025-01-01',
  endDate: '2025-01-21',
  historical: true,
  hardPity: 90,
  fatePointCap: 0,
  standardFiveStarKeys: ['Diluc', 'Jean', 'Mona', 'Qiqi', 'Keqing', 'Tighnari', 'Dehya'],
  standardFourStarKeys: ['Barbara', 'Razor'],
  sourceUrl: 'https://example.com/banner',
};

const citlaliBanner = {
  bannerId: 'banner_citlali_phase1',
  name: 'Starry Night’s Whispers · v5.3',
  type: 'CHARACTER',
  fiveStarKey: 'Citlali',
  fiveStarKeys: ['Citlali'],
  fourStarKeys: ['Kachina', 'Bennett', 'Diona'],
  startDate: '2025-01-01',
  endDate: '2025-01-21',
  historical: true,
  hardPity: 90,
  fatePointCap: 0,
  standardFiveStarKeys: ['Diluc', 'Jean', 'Mona', 'Qiqi', 'Keqing', 'Tighnari', 'Dehya'],
  standardFourStarKeys: ['Barbara', 'Razor'],
  sourceUrl: 'https://example.com/banner',
};

const weaponBanner = {
  bannerId: 'weapon_53_phase1',
  name: 'Epitome Invocation · v5.3',
  type: 'WEAPON',
  fiveStarKey: 'AThousandBlazingSuns',
  fiveStarKeys: ['AThousandBlazingSuns', 'StarcallersWatch'],
  fourStarKeys: ['FavoniusSword', 'TheStringless'],
  startDate: '2025-01-01',
  endDate: '2025-01-21',
  historical: true,
  hardPity: 80,
  fatePointCap: 1,
  standardFiveStarKeys: ['SkywardHarp', 'AquilaFavonia'],
  standardFourStarKeys: ['TheFlute'],
  sourceUrl: 'https://example.com/weapon',
};

const chronicledBanner = {
  bannerId: 'chronicled_mondstadt_45',
  name: 'Ode to the Dawn Breeze · v4.5',
  type: 'CHRONICLED',
  fiveStarKey: 'Eula',
  fiveStarKeys: ['Eula', 'Mona', 'Albedo', 'Klee', 'Diluc', 'Jean'],
  fourStarKeys: ['Bennett', 'Razor'],
  startDate: '2024-03-13',
  endDate: '2024-04-02',
  historical: true,
  hardPity: 90,
  fatePointCap: 1,
  standardFiveStarKeys: [],
  standardFourStarKeys: [],
  sourceUrl: 'https://example.com/chronicled',
};

describe('WishSandboxSession pure state transitions', () => {
  it('initializes with default zero pity and empty history', () => {
    const session = createInitialWishSandboxSession();
    expect(session.version).toBe(1);
    expect(session.characterPity).toEqual({
      pity5: 0,
      pity4: 0,
      guaranteed5: false,
      guaranteed4: false,
    });
    expect(session.weaponPity).toEqual({
      pity5: 0,
      pity4: 0,
      guaranteed5: false,
      guaranteed4: false,
      fatePoints: 0,
    });
    expect(session.chronicledPity).toEqual({
      pity5: 0,
      pity4: 0,
      fatePoints: 0,
    });
    expect(session.recentPulls).toHaveLength(0);
    expect(session.stats.totalPulls).toBe(0);
  });

  it('shares character pity and guarantee across different character banners', () => {
    let session = createInitialWishSandboxSession('banner_mavuika_phase1');
    session = updatePityOverrides(session, mavuikaBanner, {
      pity5: 45,
      pity4: 6,
      guaranteed5: true,
      guaranteed4: false,
    });

    // Switch to Citlali banner
    session = setBannerScenario(session, citlaliBanner);
    const citlaliPity = getActivePityForBanner(session, citlaliBanner);

    expect(citlaliPity.pity5).toBe(45);
    expect(citlaliPity.pity4).toBe(6);
    expect(citlaliPity.guaranteed5).toBe(true);
  });

  it('maintains independent weapon pity and fate point pool', () => {
    let session = createInitialWishSandboxSession('banner_mavuika_phase1');
    session = updatePityOverrides(session, mavuikaBanner, { pity5: 70, guaranteed5: true });
    session = updatePityOverrides(session, weaponBanner, {
      pity5: 35,
      fatePoints: 1,
      guaranteed5: false,
    });

    const charPity = getActivePityForBanner(session, mavuikaBanner);
    const wepPity = getActivePityForBanner(session, weaponBanner);

    expect(charPity.pity5).toBe(70);
    expect(charPity.guaranteed5).toBe(true);
    expect(charPity.fatePoints).toBeUndefined();

    expect(wepPity.pity5).toBe(35);
    expect(wepPity.guaranteed5).toBe(false);
    expect(wepPity.fatePoints).toBe(1);
  });

  it('clears weapon Fate Points when path target changes', () => {
    let session = createInitialWishSandboxSession('weapon_53_phase1');
    session = setBannerScenario(session, weaponBanner);
    session = setPathTarget(session, weaponBanner, 'AThousandBlazingSuns');
    session = updatePityOverrides(session, weaponBanner, { fatePoints: 1 });

    expect(session.weaponPity.fatePoints).toBe(1);

    // Change target to StarcallersWatch
    session = setPathTarget(session, weaponBanner, 'StarcallersWatch');
    expect(session.weaponPity.fatePoints).toBe(0);
    expect(session.pathTargetKey).toBe('StarcallersWatch');
  });

  it('clears weapon Fate Points when switching scenarios', () => {
    let session = createInitialWishSandboxSession('weapon_53_phase1');
    session = updatePityOverrides(session, weaponBanner, { fatePoints: 1 });
    expect(session.weaponPity.fatePoints).toBe(1);

    // Switch to character banner then back to weapon banner
    session = setBannerScenario(session, mavuikaBanner);
    session = setBannerScenario(session, weaponBanner);

    expect(session.weaponPity.fatePoints).toBe(0);
  });

  it('builds a valid WishSandboxRequest payload from active session', () => {
    let session = createInitialWishSandboxSession('weapon_53_phase1');
    session = setBannerScenario(session, weaponBanner);
    session = setPathTarget(session, weaponBanner, 'StarcallersWatch');
    session = updatePityOverrides(session, weaponBanner, {
      pity5: 64,
      pity4: 8,
      guaranteed5: true,
      guaranteed4: false,
      fatePoints: 1,
    });

    const request = buildSandboxPullRequest(session, weaponBanner, 10);
    expect(request).toEqual({
      bannerId: 'weapon_53_phase1',
      count: 10,
      rulesVersion: session.rulesVersion,
      currentPity5: 64,
      currentPity4: 8,
      guaranteed5: true,
      guaranteed4: false,
      pathTargetKey: 'StarcallersWatch',
      fatePoints: 1,
    });
  });

  it('caps currentPity5 below hardPity when building request', () => {
    let session = createInitialWishSandboxSession('banner_mavuika_phase1');
    session = updatePityOverrides(session, mavuikaBanner, { pity5: 89 });
    const request = buildSandboxPullRequest(session, mavuikaBanner, 1);
    expect(request.currentPity5).toBe(89);
  });

  it('applies wish results and bounds recent pulls to 200 items', () => {
    let session = createInitialWishSandboxSession('banner_mavuika_phase1');

    const fakePulls = Array.from({ length: 150 }, (_, i) => ({
      id: `pull-${i}`,
      type: '3_STAR',
      itemKey: 'DebateClub',
      itemKind: 'weapon',
      isFeatured: false,
    }));

    const resultBatch1 = {
      pulls: fakePulls,
      endPity5: 50,
      endPity4: 2,
      endGuaranteed5: false,
      endGuaranteed4: false,
      endFatePoints: 0,
    };

    session = applyWishResultToSession(session, mavuikaBanner, resultBatch1);
    expect(session.recentPulls).toHaveLength(150);
    expect(session.stats.totalPulls).toBe(150);
    expect(session.stats.total3Stars).toBe(150);

    // Second batch of 100 pulls
    const fakePullsBatch2 = Array.from({ length: 100 }, (_, i) => ({
      id: `pull-batch2-${i}`,
      type: i === 0 ? '5_STAR' : '3_STAR',
      itemKey: i === 0 ? 'Mavuika' : 'BlackTassel',
      itemKind: i === 0 ? 'character' : 'weapon',
      isFeatured: i === 0,
    }));

    const resultBatch2 = {
      pulls: fakePullsBatch2,
      endPity5: 99,
      endPity4: 0,
      endGuaranteed5: false,
      endGuaranteed4: false,
      endFatePoints: 0,
    };

    session = applyWishResultToSession(session, mavuikaBanner, resultBatch2);

    // Must be bounded to 200
    expect(session.recentPulls).toHaveLength(MAX_RECENT_PULLS_RETAINED);
    expect(session.stats.totalPulls).toBe(250);
    expect(session.stats.total5Stars).toBe(1);
    expect(session.stats.records5Star).toHaveLength(1);
    expect(session.stats.records5Star[0].itemKey).toBe('Mavuika');
  });

  it('tracks 5-star history with correct relative pity offset', () => {
    let session = createInitialWishSandboxSession('banner_mavuika_phase1');
    session = updatePityOverrides(session, mavuikaBanner, { pity5: 20 });

    const result = {
      pulls: [
        { id: '1', type: '3_STAR', itemKey: 'CoolSteel', itemKind: 'weapon', isFeatured: false },
        { id: '2', type: '3_STAR', itemKey: 'CoolSteel', itemKind: 'weapon', isFeatured: false },
        { id: '3', type: '5_STAR', itemKey: 'Diluc', itemKind: 'character', isFeatured: false },
        { id: '4', type: '3_STAR', itemKey: 'CoolSteel', itemKind: 'weapon', isFeatured: false },
        { id: '5', type: '5_STAR', itemKey: 'Mavuika', itemKind: 'character', isFeatured: true },
      ],
      endPity5: 0,
      endPity4: 5,
      endGuaranteed5: false,
      endGuaranteed4: false,
      endFatePoints: 0,
    };

    session = applyWishResultToSession(session, mavuikaBanner, result);
    expect(session.stats.records5Star).toHaveLength(2);
    // Diluc pulled at 20 + 3 = 23 pity
    expect(session.stats.records5Star.find((r) => r.itemKey === 'Diluc')?.pity).toBe(23);
    // Mavuika pulled 2 pulls later at 2 pity
    expect(session.stats.records5Star.find((r) => r.itemKey === 'Mavuika')?.pity).toBe(2);
  });
  it('handles chronicled wish pity and fate points with resetSandboxSession', () => {
    let session = createInitialWishSandboxSession('chronicled_mondstadt_45');
    session = setBannerScenario(session, chronicledBanner);
    session = setPathTarget(session, chronicledBanner, 'Klee');
    session = updatePityOverrides(session, chronicledBanner, { pity5: 50, fatePoints: 1 });

    const active = getActivePityForBanner(session, chronicledBanner);
    expect(active.pity5).toBe(50);
    expect(active.fatePoints).toBe(1);

    const reset = resetSandboxSession();
    expect(reset.chronicledPity.pity5).toBe(0);
    expect(reset.chronicledPity.fatePoints).toBe(0);
  });
});

describe('WishSandboxSession storage persistence & recovery', () => {
  class MockStorage {
    constructor() {
      this.store = new Map();
    }
    getItem(key) {
      return this.store.get(key) ?? null;
    }
    setItem(key, value) {
      this.store.set(key, String(value));
    }
    removeItem(key) {
      this.store.delete(key);
    }
    clear() {
      this.store.clear();
    }
  }

  it('round-trips session through storage', () => {
    const storage = new MockStorage();
    let session = createInitialWishSandboxSession('banner_mavuika_phase1');
    session = updatePityOverrides(session, mavuikaBanner, { pity5: 55, guaranteed5: true });

    saveWishSandboxSession(session, storage);
    const reloaded = loadWishSandboxSession(storage);

    expect(reloaded.characterPity.pity5).toBe(55);
    expect(reloaded.characterPity.guaranteed5).toBe(true);
  });

  it('recovers cleanly from corrupt or malformed JSON in storage', () => {
    const storage = new MockStorage();
    storage.setItem(WISH_SANDBOX_STORAGE_KEY, '{ invalid json garbage');

    const recovered = loadWishSandboxSession(storage);
    expect(recovered.version).toBe(1);
    expect(recovered.characterPity.pity5).toBe(0);
  });

  it('recovers cleanly from mismatched schema version in storage', () => {
    const storage = new MockStorage();
    storage.setItem(WISH_SANDBOX_STORAGE_KEY, JSON.stringify({ version: 99, dummy: true }));

    const recovered = loadWishSandboxSession(storage);
    expect(recovered.version).toBe(1);
    expect(recovered.characterPity.pity5).toBe(0);
  });

  it('clears session from storage', () => {
    const storage = new MockStorage();
    let session = createInitialWishSandboxSession();
    session = updatePityOverrides(session, mavuikaBanner, { pity5: 50 });
    saveWishSandboxSession(session, storage);

    expect(loadWishSandboxSession(storage).characterPity.pity5).toBe(50);
    clearWishSandboxSession(storage);
    expect(loadWishSandboxSession(storage).characterPity.pity5).toBe(0);
  });
});
